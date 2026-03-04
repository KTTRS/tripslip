import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitPaymentForm } from '../SplitPaymentForm';
import * as paymentService from '../../services/payment-service';

// Mock the payment service
vi.mock('../../services/payment-service', () => ({
  createPaymentIntent: vi.fn(),
  getPaymentsByPermissionSlip: vi.fn(),
}));

// Mock Stripe
const mockConfirmPayment = vi.fn();
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => ({
    confirmPayment: mockConfirmPayment,
  }),
  useElements: () => ({}),
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string, options?: any) => {
      if (options && typeof options === 'object') {
        let result = defaultValue || key;
        Object.keys(options).forEach(optionKey => {
          result = result.replace(`{{${optionKey}}}`, options[optionKey]);
        });
        return result;
      }
      return defaultValue || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock Logger
vi.mock('@tripslip/utils', () => ({
  Logger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('SplitPaymentForm Integration', () => {
  const defaultProps = {
    permissionSlipId: 'slip-123',
    totalAmountCents: 5000,
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
    mockConfirmPayment.mockResolvedValue({ error: null });
  });

  it('completes a full split payment flow', async () => {
    const mockCreatePaymentIntent = vi.mocked(paymentService.createPaymentIntent);
    mockCreatePaymentIntent.mockResolvedValue({
      clientSecret: 'pi_test_client_secret',
      paymentId: 'payment-123',
    });

    const user = userEvent.setup();
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    });

    // Fill in contributor information
    await user.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'john@example.com');
    
    // Set contribution amount
    await user.type(screen.getByPlaceholderText('0.00'), '25.00');
    
    // Wait for payment element to appear
    await waitFor(() => {
      expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /contribute \$25\.00/i });
    fireEvent.click(submitButton);

    // Verify payment intent was created with correct parameters
    await waitFor(() => {
      expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
        permissionSlipId: 'slip-123',
        amountCents: 2500,
        isSplitPayment: true,
        splitPaymentGroupId: 'slip-123',
      });
    });

    // Verify Stripe confirmPayment was called
    await waitFor(() => {
      expect(mockConfirmPayment).toHaveBeenCalledWith({
        elements: {},
        clientSecret: 'pi_test_client_secret',
        confirmParams: {
          return_url: expect.stringContaining('/payment/success?slip=slip-123'),
          payment_method_data: {
            billing_details: {
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        },
      });
    });

    // Verify success callback was called
    expect(defaultProps.onSuccess).toHaveBeenCalled();
  });

  it('handles payment failure gracefully', async () => {
    const mockCreatePaymentIntent = vi.mocked(paymentService.createPaymentIntent);
    mockCreatePaymentIntent.mockResolvedValue({
      clientSecret: 'pi_test_client_secret',
      paymentId: 'payment-123',
    });

    // Mock payment failure
    mockConfirmPayment.mockResolvedValue({
      error: {
        message: 'Your card was declined.',
      },
    });

    const user = userEvent.setup();
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    });

    // Fill in contributor information
    await user.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'john@example.com');
    
    // Set contribution amount
    await user.type(screen.getByPlaceholderText('0.00'), '25.00');
    
    // Wait for payment element to appear
    await waitFor(() => {
      expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /contribute \$25\.00/i });
    fireEvent.click(submitButton);

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
    });

    // Verify error callback was called
    expect(defaultProps.onError).toHaveBeenCalledWith('Your card was declined.');
  });

  it('shows existing payments and calculates remaining balance correctly', async () => {
    const existingPayments = [
      {
        id: 'payment-1',
        permission_slip_id: 'slip-123',
        parent_id: 'parent-1',
        amount_cents: 1500,
        stripe_payment_intent_id: 'pi_123',
        status: 'succeeded' as const,
        is_split_payment: true,
        split_payment_group_id: 'slip-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'payment-2',
        permission_slip_id: 'slip-123',
        parent_id: 'parent-2',
        amount_cents: 1000,
        stripe_payment_intent_id: 'pi_456',
        status: 'succeeded' as const,
        is_split_payment: true,
        split_payment_group_id: 'slip-123',
        created_at: '2024-01-01T01:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
      },
    ];

    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue(existingPayments);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    });

    // Verify payment summary shows correct amounts
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Total cost
    expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0); // Paid so far ($15 + $10)
    
    // Verify remaining balance is correct ($50 - $25 = $25)
    const remainingElements = screen.getAllByText('$25.00');
    expect(remainingElements.length).toBeGreaterThan(1); // Should appear in paid amount and remaining balance

    // Verify previous contributions are shown
    expect(screen.getByText('Previous Contributions')).toBeInTheDocument();
    expect(screen.getByText('Contribution 1')).toBeInTheDocument();
    expect(screen.getByText('Contribution 2')).toBeInTheDocument();
  });

  it('prevents overpayment', async () => {
    const user = userEvent.setup();
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    });

    // Fill in contributor information
    await user.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'john@example.com');
    
    // Try to contribute more than the total amount
    await user.type(screen.getByPlaceholderText('0.00'), '60.00');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /contribute/i });
    fireEvent.click(submitButton);

    // Should show validation error (though the exact message might vary)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Payment intent should not be created
    expect(vi.mocked(paymentService.createPaymentIntent)).not.toHaveBeenCalled();
  });
});