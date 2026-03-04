import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentForm } from '../PaymentForm';
import { createPaymentIntent } from '../../services/payment-service';
import { componentHelpers } from '@tripslip/test-utils';

// Mock Stripe
const mockStripe = {
  confirmPayment: vi.fn(),
};

const mockElements = {
  getElement: vi.fn(),
  submit: vi.fn(),
};

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe)),
}));

// Mock payment service
vi.mock('../../services/payment-service', () => ({
  createPaymentIntent: vi.fn(),
}));

// Mock UI components
vi.mock('@tripslip/ui', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props} data-testid="payment-button">
      {children}
    </button>
  ),
}));

describe('PaymentForm', () => {
  const defaultProps = {
    permissionSlipId: 'slip-123',
    amountCents: 2500, // $25.00
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStripe.confirmPayment.mockResolvedValue({ error: null });
    (createPaymentIntent as any).mockResolvedValue({
      clientSecret: 'pi_test_client_secret',
    });
  });

  it('renders payment form with correct amount', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    expect(screen.getByTestId('payment-button')).toBeInTheDocument();
  });

  it('displays formatted amount correctly for different locales', () => {
    render(<PaymentForm {...defaultProps} amountCents={12345} />);
    
    // Should format $123.45
    expect(screen.getByText('$123.45')).toBeInTheDocument();
  });

  it('handles successful payment submission', async () => {
    const onSuccess = vi.fn();
    render(<PaymentForm {...defaultProps} onSuccess={onSuccess} />);

    const submitButton = screen.getByTestId('payment-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createPaymentIntent).toHaveBeenCalledWith({
        permissionSlipId: 'slip-123',
        amountCents: 2500,
        parentId: undefined,
        isSplitPayment: undefined,
      });
    });

    await waitFor(() => {
      expect(mockStripe.confirmPayment).toHaveBeenCalledWith({
        elements: mockElements,
        clientSecret: 'pi_test_client_secret',
        confirmParams: {
          return_url: expect.stringContaining('/payment/success'),
        },
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles payment intent creation error', async () => {
    const onError = vi.fn();
    const errorMessage = 'Payment intent creation failed';
    (createPaymentIntent as any).mockRejectedValue(new Error(errorMessage));

    render(<PaymentForm {...defaultProps} onError={onError} />);

    const submitButton = screen.getByTestId('payment-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(onError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('handles Stripe confirmation error', async () => {
    const onError = vi.fn();
    const stripeError = { message: 'Your card was declined.' };
    mockStripe.confirmPayment.mockResolvedValue({ error: stripeError });

    render(<PaymentForm {...defaultProps} onError={onError} />);

    const submitButton = screen.getByTestId('payment-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
      expect(onError).toHaveBeenCalledWith('Your card was declined.');
    });
  });

  it('shows processing state during payment', async () => {
    // Make the payment take time to resolve
    let resolvePayment: (value: any) => void;
    const paymentPromise = new Promise((resolve) => {
      resolvePayment = resolve;
    });
    mockStripe.confirmPayment.mockReturnValue(paymentPromise);

    render(<PaymentForm {...defaultProps} />);

    const submitButton = screen.getByTestId('payment-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('Securely processing your payment...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Resolve the payment
    resolvePayment!({ error: null });
    
    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });

  it('handles split payment parameters', async () => {
    render(
      <PaymentForm 
        {...defaultProps} 
        parentId="parent-456"
        isSplitPayment={true}
      />
    );

    const submitButton = screen.getByTestId('payment-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createPaymentIntent).toHaveBeenCalledWith({
        permissionSlipId: 'slip-123',
        amountCents: 2500,
        parentId: 'parent-456',
        isSplitPayment: true,
      });
    });
  });

  it('disables submit button when Stripe is not loaded', () => {
    // Mock useStripe to return null (not loaded)
    vi.mocked(require('@stripe/react-stripe-js').useStripe).mockReturnValue(null);

    render(<PaymentForm {...defaultProps} />);

    const submitButton = screen.getByTestId('payment-button');
    expect(submitButton).toBeDisabled();
  });

  it('prevents form submission when Stripe elements are not ready', () => {
    // Mock useElements to return null
    vi.mocked(require('@stripe/react-stripe-js').useElements).mockReturnValue(null);

    render(<PaymentForm {...defaultProps} />);

    const submitButton = screen.getByTestId('payment-button');
    fireEvent.click(submitButton);

    // Should not call createPaymentIntent
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it('displays correct button text with amount', () => {
    render(<PaymentForm {...defaultProps} amountCents={5000} />);

    expect(screen.getByText('Pay $50.00')).toBeInTheDocument();
  });

  it('handles form submission event correctly', async () => {
    render(<PaymentForm {...defaultProps} />);

    const form = screen.getByRole('form') || screen.getByTestId('payment-button').closest('form');
    expect(form).toBeInTheDocument();

    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      fireEvent(form, submitEvent);

      await waitFor(() => {
        expect(createPaymentIntent).toHaveBeenCalled();
      });
    }
  });
});