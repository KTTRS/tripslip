import { vi } from 'vitest';

export const createMockStripe = () => ({
  paymentIntents: {
    create: vi.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_456',
      amount: 50000,
      currency: 'usd',
      status: 'requires_payment_method',
    }),
    retrieve: vi.fn().mockResolvedValue({
      id: 'pi_test_123',
      amount: 50000,
      currency: 'usd',
      status: 'succeeded',
    }),
  },
  refunds: {
    create: vi.fn().mockResolvedValue({
      id: 're_test_123',
      amount: 50000,
      status: 'succeeded',
      payment_intent: 'pi_test_123',
    }),
  },
  webhooks: {
    constructEvent: vi.fn().mockImplementation((payload, signature, secret) => {
      return JSON.parse(payload);
    }),
  },
});

export const mockPaymentIntentSucceeded = {
  id: 'evt_test_123',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_123',
      amount: 50000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        slip_id: 'slip_123',
        parent_id: 'parent_123',
      },
    },
  },
};

export const mockPaymentIntentFailed = {
  id: 'evt_test_456',
  type: 'payment_intent.payment_failed',
  data: {
    object: {
      id: 'pi_test_456',
      amount: 50000,
      currency: 'usd',
      status: 'requires_payment_method',
      last_payment_error: {
        message: 'Your card was declined',
      },
    },
  },
};

export const mockRefundCreated = {
  id: 'evt_test_789',
  type: 'refund.created',
  data: {
    object: {
      id: 're_test_123',
      amount: 50000,
      status: 'succeeded',
      payment_intent: 'pi_test_123',
    },
  },
};
