import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPaymentIntent, getPayment, getPaymentsByPermissionSlip } from '../payment-service';
import { supabase } from '../../lib/supabase';

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Payment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockResponse = {
        data: {
          clientSecret: 'pi_test_secret',
          paymentId: 'payment-123',
        },
        error: null,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

      const result = await createPaymentIntent({
        permissionSlipId: 'slip-123',
        amountCents: 5000,
        parentId: 'parent-123',
      });

      expect(result).toEqual({
        clientSecret: 'pi_test_secret',
        paymentId: 'payment-123',
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-payment-intent', {
        body: {
          permissionSlipId: 'slip-123',
          amountCents: 5000,
          parentId: 'parent-123',
          isSplitPayment: undefined,
          splitPaymentGroupId: undefined,
        },
      });
    });

    it('should handle split payment parameters', async () => {
      const mockResponse = {
        data: {
          clientSecret: 'pi_test_secret',
          paymentId: 'payment-123',
        },
        error: null,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

      await createPaymentIntent({
        permissionSlipId: 'slip-123',
        amountCents: 2500,
        parentId: 'parent-123',
        isSplitPayment: true,
        splitPaymentGroupId: 'group-123',
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-payment-intent', {
        body: {
          permissionSlipId: 'slip-123',
          amountCents: 2500,
          parentId: 'parent-123',
          isSplitPayment: true,
          splitPaymentGroupId: 'group-123',
        },
      });
    });

    it('should throw error when API returns error', async () => {
      const mockResponse = {
        data: null,
        error: { message: 'Invalid amount' },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

      await expect(
        createPaymentIntent({
          permissionSlipId: 'slip-123',
          amountCents: -100,
        })
      ).rejects.toThrow('Invalid amount');
    });

    it('should throw error when response is invalid', async () => {
      const mockResponse = {
        data: {},
        error: null,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

      await expect(
        createPaymentIntent({
          permissionSlipId: 'slip-123',
          amountCents: 5000,
        })
      ).rejects.toThrow('Invalid response from payment service');
    });
  });

  describe('getPayment', () => {
    it('should retrieve a payment successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        permission_slip_id: 'slip-123',
        parent_id: 'parent-123',
        amount_cents: 5000,
        stripe_payment_intent_id: 'pi_123',
        status: 'succeeded',
        is_split_payment: false,
        split_payment_group_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockPayment,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const result = await getPayment('payment-123');

      expect(result).toEqual(mockPayment);
      expect(supabase.from).toHaveBeenCalledWith('payments');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'payment-123');
    });

    it('should throw error when payment not found', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      await expect(getPayment('nonexistent')).rejects.toThrow('Payment not found');
    });

    it('should throw error when database query fails', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      await expect(getPayment('payment-123')).rejects.toThrow('Database error');
    });
  });

  describe('getPaymentsByPermissionSlip', () => {
    it('should retrieve all payments for a permission slip', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          permission_slip_id: 'slip-123',
          amount_cents: 2500,
          status: 'succeeded',
        },
        {
          id: 'payment-2',
          permission_slip_id: 'slip-123',
          amount_cents: 2500,
          status: 'succeeded',
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockPayments,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const result = await getPaymentsByPermissionSlip('slip-123');

      expect(result).toEqual(mockPayments);
      expect(supabase.from).toHaveBeenCalledWith('payments');
      expect(mockEq).toHaveBeenCalledWith('permission_slip_id', 'slip-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no payments found', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const result = await getPaymentsByPermissionSlip('slip-123');

      expect(result).toEqual([]);
    });
  });
});
