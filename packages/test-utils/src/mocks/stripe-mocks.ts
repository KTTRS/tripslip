import { vi } from 'vitest';

/**
 * Mock Stripe services for testing
 * Provides comprehensive mocking for Stripe payment operations
 */

// Mock Stripe Elements
export const mockStripeElements = {
  create: vi.fn(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    destroy: vi.fn(),
    update: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    clear: vi.fn(),
  })),
  getElement: vi.fn(),
  fetchUpdates: vi.fn(),
  submit: vi.fn(),
};

// Mock Stripe instance
export const mockStripe = {
  elements: vi.fn(() => mockStripeElements),
  createToken: vi.fn(),
  createSource: vi.fn(),
  createPaymentMethod: vi.fn(),
  confirmCardPayment: vi.fn(),
  confirmCardSetup: vi.fn(),
  confirmPayment: vi.fn(),
  confirmSetup: vi.fn(),
  handleCardAction: vi.fn(),
  handleCardPayment: vi.fn(),
  handleCardSetup: vi.fn(),
  handleNextAction: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  retrieveSetupIntent: vi.fn(),
  paymentRequest: vi.fn(),
  redirectToCheckout: vi.fn(),
};

// Mock loadStripe function
export const mockLoadStripe = vi.fn(() => Promise.resolve(mockStripe));

// Mock Stripe Edge Function responses
export const mockStripeEdgeFunctions = {
  createPaymentIntent: {
    success: (clientSecret: string = 'pi_test_123_secret_456') => ({
      clientSecret,
      status: 'requires_payment_method',
    }),
    error: (message: string = 'Payment intent creation failed') => ({
      error: { message, type: 'api_error' },
    }),
  },
  
  webhook: {
    paymentSucceeded: {
      id: 'pi_test_123',
      object: 'payment_intent',
      status: 'succeeded',
      amount: 1500,
      currency: 'usd',
      metadata: {
        permission_slip_id: 'slip-123',
        parent_id: 'parent-123',
      },
    },
    paymentFailed: {
      id: 'pi_test_123',
      object: 'payment_intent',
      status: 'payment_failed',
      amount: 1500,
      currency: 'usd',
      last_payment_error: {
        message: 'Your card was declined.',
        type: 'card_error',
        code: 'card_declined',
      },
    },
  },
};

// Mock payment method data
export const mockPaymentMethods = {
  card: {
    id: 'pm_test_123',
    object: 'payment_method',
    type: 'card',
    card: {
      brand: 'visa',
      last4: '4242',
      exp_month: 12,
      exp_year: 2025,
    },
    billing_details: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
};

// Mock Stripe responses
export const mockStripeResponses = {
  confirmPayment: {
    success: (paymentIntent: any = mockStripeEdgeFunctions.webhook.paymentSucceeded) => ({
      paymentIntent,
      error: undefined,
    }),
    error: (message: string = 'Payment failed') => ({
      paymentIntent: undefined,
      error: {
        message,
        type: 'card_error',
        code: 'card_declined',
      },
    }),
    requiresAction: (paymentIntent: any) => ({
      paymentIntent: {
        ...paymentIntent,
        status: 'requires_action',
        next_action: {
          type: 'use_stripe_sdk',
        },
      },
      error: undefined,
    }),
  },
  
  createPaymentMethod: {
    success: (paymentMethod: any = mockPaymentMethods.card) => ({
      paymentMethod,
      error: undefined,
    }),
    error: (message: string = 'Invalid card details') => ({
      paymentMethod: undefined,
      error: {
        message,
        type: 'validation_error',
      },
    }),
  },
};

// Helper to mock Stripe in tests
export const setupStripeMocks = () => {
  // Mock the global Stripe object
  (global as any).Stripe = vi.fn(() => mockStripe);
  
  // Reset all mocks
  Object.values(mockStripe).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });
  
  // Set up default successful responses
  mockStripe.confirmCardPayment.mockResolvedValue(
    mockStripeResponses.confirmPayment.success()
  );
  
  mockStripe.createPaymentMethod.mockResolvedValue(
    mockStripeResponses.createPaymentMethod.success()
  );
  
  return mockStripe;
};

// Helper to simulate payment flow
export const simulatePaymentFlow = {
  success: () => {
    mockStripe.confirmCardPayment.mockResolvedValueOnce(
      mockStripeResponses.confirmPayment.success()
    );
  },
  
  failure: (message?: string) => {
    mockStripe.confirmCardPayment.mockResolvedValueOnce(
      mockStripeResponses.confirmPayment.error(message)
    );
  },
  
  requiresAction: () => {
    mockStripe.confirmCardPayment.mockResolvedValueOnce(
      mockStripeResponses.confirmPayment.requiresAction({
        id: 'pi_test_123',
        status: 'requires_action',
      })
    );
  },
};