import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefundService } from '../../refund-service';
import type { SupabaseClient } from '../../client';

// Mock Supabase client
const createMockSupabase = () => {
  let mockChain: any;

  const resetChain = () => {
    mockChain = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      single: vi.fn(),
      order: vi.fn(),
    };

    // Make all methods return the chain for fluent API
    getChain().select.mockReturnValue(mockChain);
    getChain().insert.mockReturnValue(mockChain);
    getChain().update.mockReturnValue(mockChain);
    getChain().eq.mockReturnValue(mockChain);
    getChain().in.mockReturnValue(mockChain);
    getChain().order.mockReturnValue(mockChain);

    return mockChain;
  };

  const mockSupabase = {
    from: vi.fn(() => resetChain()),
  };

  return { supabase: mockSupabase as unknown as SupabaseClient, getChain: () => mockChain };
};

// Mock fetch globally
global.fetch = vi.fn();

describe('RefundService', () => {
  let refundService: RefundService;
  let mockSupabase: SupabaseClient;
  let getChain: () => any;
  const mockStripeKey = 'sk_test_mock_key';

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.supabase;
    getChain = mocks.getChain;
    refundService = new RefundService(mockSupabase, mockStripeKey);
    vi.clearAllMocks();
  });

  describe('createRefund', () => {
    const mockPayment = {
      id: 'payment-123',
      amount_cents: 10000,
      stripe_payment_intent_id: 'pi_test_123',
      status: 'succeeded',
    };

    const mockStripeRefund = {
      id: 'ref_test_123',
      amount: 10000,
      status: 'succeeded',
    };

    it('should create a full refund successfully', async () => {
      // Setup mock chain for this test
      const chain1 = getChain();
      chain1.single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      const chain2 = getChain();
      chain2.in.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock Stripe API
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeRefund,
      });

      const chain3 = getChain();
      chain3.single.mockResolvedValueOnce({
        data: {
          id: 'refund-123',
          payment_id: 'payment-123',
          amount_cents: 10000,
          stripe_refund_id: 'ref_test_123',
          reason: null,
          status: 'succeeded',
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const chain4 = getChain();
      chain4.eq.mockResolvedValueOnce({
        error: null,
      });

      const result = await refundService.createRefund({
        paymentId: 'payment-123',
      });

      expect(result.refund.amount_cents).toBe(10000);
      expect(result.stripeRefundId).toBe('ref_test_123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.stripe.com/v1/refunds',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockStripeKey}`,
          }),
        })
      );
    });

    it('should create a partial refund successfully', async () => {
      // Mock payment fetch
      getChain().single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      // Mock existing refunds check
      getChain().in.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock Stripe API for partial refund
      const partialRefund = { ...mockStripeRefund, amount: 5000 };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => partialRefund,
      });

      // Mock refund insert
      getChain().single.mockResolvedValueOnce({
        data: {
          id: 'refund-123',
          payment_id: 'payment-123',
          amount_cents: 5000,
          stripe_refund_id: 'ref_test_123',
          reason: 'Partial cancellation',
          status: 'succeeded',
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await refundService.createRefund({
        paymentId: 'payment-123',
        amountCents: 5000,
        reason: 'Partial cancellation',
      });

      expect(result.refund.amount_cents).toBe(5000);
      expect(result.refund.reason).toBe('Partial cancellation');
    });

    it('should throw error if payment not found', async () => {
      getChain().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        refundService.createRefund({ paymentId: 'invalid-id' })
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error if payment status is not succeeded', async () => {
      getChain().single.mockResolvedValueOnce({
        data: { ...mockPayment, status: 'pending' },
        error: null,
      });

      await expect(
        refundService.createRefund({ paymentId: 'payment-123' })
      ).rejects.toThrow('Cannot refund payment with status: pending');
    });

    it('should throw error if payment has no Stripe payment intent', async () => {
      getChain().single.mockResolvedValueOnce({
        data: { ...mockPayment, stripe_payment_intent_id: null },
        error: null,
      });

      await expect(
        refundService.createRefund({ paymentId: 'payment-123' })
      ).rejects.toThrow('Payment has no associated Stripe payment intent');
    });

    it('should throw error if refund amount is zero', async () => {
      getChain().single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      await expect(
        refundService.createRefund({ paymentId: 'payment-123', amountCents: 0 })
      ).rejects.toThrow('Refund amount must be positive');
    });

    it('should throw error if refund amount is negative', async () => {
      getChain().single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      await expect(
        refundService.createRefund({ paymentId: 'payment-123', amountCents: -100 })
      ).rejects.toThrow('Refund amount must be positive');
    });

    it('should throw error if refund amount exceeds payment amount', async () => {
      getChain().single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      getChain().in.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await expect(
        refundService.createRefund({ paymentId: 'payment-123', amountCents: 15000 })
      ).rejects.toThrow('Refund amount (15000) exceeds payment amount (10000)');
    });

    it('should throw error if refund amount exceeds remaining refundable amount', async () => {
      getChain().single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      // Mock existing refund of 6000 cents
      getChain().in.mockResolvedValueOnce({
        data: [{ amount_cents: 6000, status: 'succeeded' }],
        error: null,
      });

      await expect(
        refundService.createRefund({ paymentId: 'payment-123', amountCents: 5000 })
      ).rejects.toThrow('Refund amount (5000) exceeds remaining refundable amount (4000)');
    });

    it('should handle Stripe API errors', async () => {
      getChain().single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      getChain().in.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Insufficient funds' },
        }),
      });

      await expect(
        refundService.createRefund({ paymentId: 'payment-123' })
      ).rejects.toThrow('Stripe API error: Insufficient funds');
    });

    it('should update payment status to refunded for full refund', async () => {
      getChain().single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      getChain().in.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeRefund,
      });

      getChain().single.mockResolvedValueOnce({
        data: {
          id: 'refund-123',
          payment_id: 'payment-123',
          amount_cents: 10000,
          stripe_refund_id: 'ref_test_123',
          reason: null,
          status: 'succeeded',
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      getChain().eq.mockResolvedValueOnce({ error: null });

      await refundService.createRefund({ paymentId: 'payment-123' });

      expect(getChain().eq).toHaveBeenCalled();
    });
  });

  describe('getRefundById', () => {
    it('should return refund when found', async () => {
      const mockRefund = {
        id: 'refund-123',
        payment_id: 'payment-123',
        amount_cents: 10000,
        stripe_refund_id: 'ref_test_123',
        reason: null,
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      getChain().single.mockResolvedValueOnce({
        data: mockRefund,
        error: null,
      });

      const result = await refundService.getRefundById('refund-123');

      expect(result).toEqual(mockRefund);
    });

    it('should return null when refund not found', async () => {
      getChain().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await refundService.getRefundById('invalid-id');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      getChain().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      await expect(
        refundService.getRefundById('refund-123')
      ).rejects.toThrow('Error fetching refund');
    });
  });

  describe('getRefundsByPaymentId', () => {
    it('should return all refunds for a payment', async () => {
      const mockRefunds = [
        {
          id: 'refund-1',
          payment_id: 'payment-123',
          amount_cents: 5000,
          stripe_refund_id: 'ref_1',
          reason: null,
          status: 'succeeded',
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'refund-2',
          payment_id: 'payment-123',
          amount_cents: 3000,
          stripe_refund_id: 'ref_2',
          reason: 'Partial refund',
          status: 'succeeded',
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      getChain().order.mockResolvedValueOnce({
        data: mockRefunds,
        error: null,
      });

      const result = await refundService.getRefundsByPaymentId('payment-123');

      expect(result).toEqual(mockRefunds);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no refunds found', async () => {
      getChain().order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await refundService.getRefundsByPaymentId('payment-123');

      expect(result).toEqual([]);
    });
  });

  describe('getTotalRefunded', () => {
    it('should calculate total refunded amount', async () => {
      const mockRefunds = [
        { amount_cents: 5000 },
        { amount_cents: 3000 },
        { amount_cents: 2000 },
      ];

      getChain().in.mockResolvedValueOnce({
        data: mockRefunds,
        error: null,
      });

      const result = await refundService.getTotalRefunded('payment-123');

      expect(result).toBe(10000);
    });

    it('should return 0 when no refunds exist', async () => {
      getChain().in.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await refundService.getTotalRefunded('payment-123');

      expect(result).toBe(0);
    });

    it('should throw error on database error', async () => {
      getChain().in.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        refundService.getTotalRefunded('payment-123')
      ).rejects.toThrow('Error calculating total refunded');
    });
  });
});
