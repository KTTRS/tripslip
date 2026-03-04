/**
 * Unit Tests - Payment Service
 * 
 * Tests the payment service functionality including:
 * - Payment intent creation
 * - Payment confirmation
 * - Error handling
 * - API integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createPaymentIntent, 
  confirmPayment, 
  getPayment, 
  getPaymentHistory,
  refundPayment,
  PaymentService 
} from '../payment-service';
import { createSupabaseClient } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  createSupabaseClient: vi.fn(),
}));

const mockSupabaseClient = {
  functions: {
    invoke: vi.fn(),
  },
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

// Mock fetch for direct API calls
global.fetch = vi.fn();

describe('Payment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createSupabaseClient as any).mockReturnValue(mockSupabaseClient);
  });

  describe('createPaymentIntent', () => {
    it('creates payment intent successfully', async () => {
      const paymentData = {
        permissionSlipId: 'slip-123',
        amount: 2500,
        currency: 'usd',
        metadata: {
          studentName: 'John Doe',
          parentEmail: 'parent@example.com',
        },
      };

      const mockResponse = {
        data: {
          clientSecret: 'pi_test_client_secret',
          paymentIntentId: 'pi_test_123',
        },
        error: null,
      };

      mockSupabaseClient.functions.invoke.mockResolvedValue(mockResponse);

      const result = await createPaymentIntent(paymentData);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
        'create-payment-intent',
        {
          body: paymentData,
        }
      );

      expect(result).toEqual({
        clientSecret: 'pi_test_client_secret',
        paymentIntentId: 'pi_test_123',
      });
    });

    it('handles payment intent creation errors', async () => {
      const paymentData = {
        permissionSlipId: 'slip-123',
        amount: 2500,
        currency: 'usd',
        metadata: {},
      };

      const mockResponse = {
        data: null,
        error: {
          message: 'Invalid amount',
        },
      };

      mockSupabaseClient.functions.invoke.mockResolvedValue(mockResponse);

      await expect(createPaymentIntent(paymentData)).rejects.toThrow('Invalid amount');
    });

    it('validates payment data', async () => {
      const invalidPaymentData = {
        permissionSlipId: '',
        amount: -100, // Invalid amount
        currency: 'invalid',
        metadata: {},
      };

      await expect(createPaymentIntent(invalidPaymentData as any))
        .rejects.toThrow('Invalid payment data');
    });

    it('handles network errors', async () => {
      const paymentData = {
        permissionSlipId: 'slip-123',
        amount: 2500,
        currency: 'usd',
        metadata: {},
      };

      mockSupabaseClient.functions.invoke.mockRejectedValue(new Error('Network error'));

      await expect(createPaymentIntent(paymentData)).rejects.toThrow('Network error');
    });
  });

  describe('confirmPayment', () => {
    it('confirms payment successfully', async () => {
      const confirmationData = {
        paymentIntentId: 'pi_test_123',
        permissionSlipId: 'slip-123',
      };

      const mockResponse = {
        data: {
          success: true,
          paymentIntent: {
            id: 'pi_test_123',
            status: 'succeeded',
            amount: 2500,
          },
        },
        error: null,
      };

      mockSupabaseClient.functions.invoke.mockResolvedValue(mockResponse);

      const result = await confirmPayment(confirmationData);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
        'confirm-payment',
        {
          body: confirmationData,
        }
      );

      expect(result).toEqual({
        success: true,
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
          amount: 2500,
        },
      });
    });

    it('handles payment confirmation errors', async () => {
      const confirmationData = {
        paymentIntentId: 'pi_test_invalid',
        permissionSlipId: 'slip-123',
      };

      const mockResponse = {
        data: null,
        error: {
          message: 'Payment intent not found',
        },
      };

      mockSupabaseClient.functions.invoke.mockResolvedValue(mockResponse);

      await expect(confirmPayment(confirmationData)).rejects.toThrow('Payment intent not found');
    });
  });

  describe('getPayment', () => {
    it('retrieves payment by ID', async () => {
      const mockPayment = {
        id: 'payment-123',
        permission_slip_id: 'slip-123',
        stripe_payment_intent_id: 'pi_test_123',
        amount_cents: 2500,
        currency: 'usd',
        status: 'succeeded',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPayment, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const result = await getPayment('payment-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('payments');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'payment-123');
      expect(result).toEqual(mockPayment);
    });

    it('returns null when payment not found', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const result = await getPayment('nonexistent');

      expect(result).toBeNull();
    });

    it('throws error for database errors', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      await expect(getPayment('payment-123')).rejects.toThrow('Database error');
    });
  });

  describe('getPaymentHistory', () => {
    it('retrieves payment history for permission slip', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          amount_cents: 2500,
          status: 'succeeded',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'payment-2',
          amount_cents: 500,
          status: 'refunded',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPayments, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const result = await getPaymentHistory('slip-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('payments');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('permission_slip_id', 'slip-123');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockPayments);
    });

    it('returns empty array when no payments found', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const result = await getPaymentHistory('slip-no-payments');

      expect(result).toEqual([]);
    });
  });

  describe('refundPayment', () => {
    it('processes refund successfully', async () => {
      const refundData = {
        paymentId: 'payment-123',
        amount: 2500,
        reason: 'Trip cancelled',
      };

      const mockResponse = {
        data: {
          success: true,
          refund: {
            id: 'refund-123',
            amount: 2500,
            status: 'succeeded',
          },
        },
        error: null,
      };

      mockSupabaseClient.functions.invoke.mockResolvedValue(mockResponse);

      const result = await refundPayment(refundData);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
        'process-refund',
        {
          body: refundData,
        }
      );

      expect(result).toEqual({
        success: true,
        refund: {
          id: 'refund-123',
          amount: 2500,
          status: 'succeeded',
        },
      });
    });

    it('handles refund errors', async () => {
      const refundData = {
        paymentId: 'payment-invalid',
        amount: 2500,
        reason: 'Trip cancelled',
      };

      const mockResponse = {
        data: null,
        error: {
          message: 'Payment not found',
        },
      };

      mockSupabaseClient.functions.invoke.mockResolvedValue(mockResponse);

      await expect(refundPayment(refundData)).rejects.toThrow('Payment not found');
    });
  });
});

describe('PaymentService Class', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    paymentService = new PaymentService(mockSupabaseClient as any);
  });

  describe('calculateTotal', () => {
    it('calculates total with base amount only', () => {
      const result = paymentService.calculateTotal(2000, []);
      expect(result).toBe(2000);
    });

    it('calculates total with add-ons', () => {
      const addOns = [
        { id: '1', name: 'Lunch', price: 500 },
        { id: '2', name: 'T-shirt', price: 1000 },
      ];

      const result = paymentService.calculateTotal(2000, addOns);
      expect(result).toBe(3500); // 2000 + 500 + 1000
    });

    it('handles empty add-ons array', () => {
      const result = paymentService.calculateTotal(2000, []);
      expect(result).toBe(2000);
    });
  });

  describe('formatAmount', () => {
    it('formats USD amounts', () => {
      expect(paymentService.formatAmount(2500, 'usd')).toBe('$25.00');
      expect(paymentService.formatAmount(100, 'usd')).toBe('$1.00');
      expect(paymentService.formatAmount(50, 'usd')).toBe('$0.50');
    });

    it('formats EUR amounts', () => {
      expect(paymentService.formatAmount(2500, 'eur')).toBe('€25.00');
    });

    it('formats GBP amounts', () => {
      expect(paymentService.formatAmount(2500, 'gbp')).toBe('£25.00');
    });

    it('handles zero amounts', () => {
      expect(paymentService.formatAmount(0, 'usd')).toBe('$0.00');
    });

    it('handles large amounts', () => {
      expect(paymentService.formatAmount(123456, 'usd')).toBe('$1,234.56');
    });
  });

  describe('validatePaymentData', () => {
    it('validates correct payment data', () => {
      const validData = {
        permissionSlipId: 'slip-123',
        amount: 2500,
        currency: 'usd',
        metadata: {
          studentName: 'John Doe',
        },
      };

      expect(() => paymentService.validatePaymentData(validData)).not.toThrow();
    });

    it('throws for missing permission slip ID', () => {
      const invalidData = {
        permissionSlipId: '',
        amount: 2500,
        currency: 'usd',
        metadata: {},
      };

      expect(() => paymentService.validatePaymentData(invalidData))
        .toThrow('Permission slip ID is required');
    });

    it('throws for invalid amount', () => {
      const invalidData = {
        permissionSlipId: 'slip-123',
        amount: -100,
        currency: 'usd',
        metadata: {},
      };

      expect(() => paymentService.validatePaymentData(invalidData))
        .toThrow('Amount must be positive');
    });

    it('throws for invalid currency', () => {
      const invalidData = {
        permissionSlipId: 'slip-123',
        amount: 2500,
        currency: 'invalid',
        metadata: {},
      };

      expect(() => paymentService.validatePaymentData(invalidData))
        .toThrow('Invalid currency');
    });

    it('throws for amount too large', () => {
      const invalidData = {
        permissionSlipId: 'slip-123',
        amount: 10000000, // $100,000
        currency: 'usd',
        metadata: {},
      };

      expect(() => paymentService.validatePaymentData(invalidData))
        .toThrow('Amount exceeds maximum allowed');
    });
  });

  describe('isPaymentSuccessful', () => {
    it('identifies successful payment statuses', () => {
      expect(paymentService.isPaymentSuccessful('succeeded')).toBe(true);
      expect(paymentService.isPaymentSuccessful('processing')).toBe(true);
    });

    it('identifies failed payment statuses', () => {
      expect(paymentService.isPaymentSuccessful('failed')).toBe(false);
      expect(paymentService.isPaymentSuccessful('canceled')).toBe(false);
      expect(paymentService.isPaymentSuccessful('requires_action')).toBe(false);
    });

    it('handles unknown statuses', () => {
      expect(paymentService.isPaymentSuccessful('unknown_status' as any)).toBe(false);
    });
  });

  describe('getPaymentStatusMessage', () => {
    it('returns appropriate messages for each status', () => {
      expect(paymentService.getPaymentStatusMessage('succeeded'))
        .toBe('Payment completed successfully');
      
      expect(paymentService.getPaymentStatusMessage('processing'))
        .toBe('Payment is being processed');
      
      expect(paymentService.getPaymentStatusMessage('failed'))
        .toBe('Payment failed');
      
      expect(paymentService.getPaymentStatusMessage('canceled'))
        .toBe('Payment was canceled');
      
      expect(paymentService.getPaymentStatusMessage('requires_action'))
        .toBe('Payment requires additional action');
    });

    it('handles unknown statuses', () => {
      expect(paymentService.getPaymentStatusMessage('unknown' as any))
        .toBe('Unknown payment status');
    });
  });

  describe('canRefund', () => {
    it('allows refund for succeeded payments', () => {
      const payment = {
        status: 'succeeded',
        created_at: new Date().toISOString(),
      };

      expect(paymentService.canRefund(payment as any)).toBe(true);
    });

    it('disallows refund for failed payments', () => {
      const payment = {
        status: 'failed',
        created_at: new Date().toISOString(),
      };

      expect(paymentService.canRefund(payment as any)).toBe(false);
    });

    it('disallows refund for old payments', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      const payment = {
        status: 'succeeded',
        created_at: oldDate.toISOString(),
      };

      expect(paymentService.canRefund(payment as any)).toBe(false);
    });
  });
});