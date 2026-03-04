/**
 * Unit Tests - PaymentForm Component
 * 
 * Tests the PaymentForm component functionality including:
 * - Form rendering and validation
 * - Stripe integration
 * - Payment processing
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentForm } from '../PaymentForm';

// Mock Stripe
const mockStripe = {
  confirmPayment: vi.fn(),
  retrievePaymentIntent: vi.fn(),
};

const mockElements = {
  getElement: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockCardElement = {
  mount: vi.fn(),
  unmount: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  update: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn(),
};

// Mock @stripe/react-stripe-js
vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  CardElement: ({ onChange, onReady, onFocus, onBlur }: any) => {
    return (
      <div data-testid="card-element">
        <input
          data-testid="card-input"
          onChange={(e) => onChange?.({ complete: e.target.value.length > 10, error: null })}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    );
  },
}));

// Mock payment service
vi.mock('../../services/payment-service', () => ({
  createPaymentIntent: vi.fn(),
  confirmPayment: vi.fn(),
}));

import { createPaymentIntent, confirmPayment } from '../../services/payment-service';

const mockPaymentData = {
  permissionSlipId: 'slip-123',
  amount: 2500, // $25.00
  currency: 'usd',
  studentName: 'John Doe',
  parentEmail: 'parent@example.com',
  addOns: [
    { id: 'addon-1', name: 'Lunch', price: 500 },
    { id: 'addon-2', name: 'T-shirt', price: 1000 },
  ],
};

describe('PaymentForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockElements.getElement.mockReturnValue(mockCardElement);
  });

  it('renders payment form with all elements', () => {
    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByText('Student: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Total: $25.00')).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument();
  });

  it('displays add-ons in payment summary', () => {
    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('T-shirt')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('calculates total amount correctly', () => {
    const paymentDataWithAddOns = {
      ...mockPaymentData,
      amount: 1000, // Base amount $10.00
      addOns: [
        { id: 'addon-1', name: 'Lunch', price: 500 }, // $5.00
        { id: 'addon-2', name: 'T-shirt', price: 1000 }, // $10.00
      ],
    };

    render(
      <PaymentForm
        paymentData={paymentDataWithAddOns}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Total should be $10.00 + $5.00 + $10.00 = $25.00
    expect(screen.getByText('Total: $25.00')).toBeInTheDocument();
  });

  it('disables pay button when card is incomplete', () => {
    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const payButton = screen.getByRole('button', { name: /pay now/i });
    expect(payButton).toBeDisabled();
  });

  it('enables pay button when card is complete', async () => {
    const user = userEvent.setup();
    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const cardInput = screen.getByTestId('card-input');
    await user.type(cardInput, '4242424242424242'); // Complete card number

    const payButton = screen.getByRole('button', { name: /pay now/i });
    expect(payButton).not.toBeDisabled();
  });

  it('shows card errors', async () => {
    const user = userEvent.setup();
    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Simulate card error
    const cardInput = screen.getByTestId('card-input');
    fireEvent.change(cardInput, {
      target: { value: '4000000000000002' }, // Declined card
    });

    // Trigger onChange with error
    const cardElement = screen.getByTestId('card-element');
    fireEvent.change(cardElement, {
      complete: false,
      error: { message: 'Your card was declined.' },
    });

    await waitFor(() => {
      expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
    });
  });

  it('processes payment successfully', async () => {
    const user = userEvent.setup();
    
    // Mock successful payment intent creation
    (createPaymentIntent as any).mockResolvedValue({
      clientSecret: 'pi_test_client_secret',
      paymentIntentId: 'pi_test_123',
    });

    // Mock successful payment confirmation
    mockStripe.confirmPayment.mockResolvedValue({
      paymentIntent: {
        id: 'pi_test_123',
        status: 'succeeded',
      },
      error: null,
    });

    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Complete the card
    const cardInput = screen.getByTestId('card-input');
    await user.type(cardInput, '4242424242424242');

    // Submit payment
    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    await waitFor(() => {
      expect(createPaymentIntent).toHaveBeenCalledWith({
        permissionSlipId: 'slip-123',
        amount: 2500,
        currency: 'usd',
        metadata: {
          studentName: 'John Doe',
          parentEmail: 'parent@example.com',
        },
      });
    });

    await waitFor(() => {
      expect(mockStripe.confirmPayment).toHaveBeenCalledWith({
        clientSecret: 'pi_test_client_secret',
        elements: mockElements,
        confirmParams: {
          return_url: expect.stringContaining('/payment-success'),
        },
      });
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        paymentIntentId: 'pi_test_123',
        amount: 2500,
      });
    });
  });

  it('handles payment intent creation errors', async () => {
    const user = userEvent.setup();
    
    // Mock payment intent creation error
    (createPaymentIntent as any).mockRejectedValue(new Error('Payment intent creation failed'));

    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Complete the card
    const cardInput = screen.getByTestId('card-input');
    await user.type(cardInput, '4242424242424242');

    // Submit payment
    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    expect(screen.getByText('Payment failed. Please try again.')).toBeInTheDocument();
  });

  it('handles payment confirmation errors', async () => {
    const user = userEvent.setup();
    
    // Mock successful payment intent creation
    (createPaymentIntent as any).mockResolvedValue({
      clientSecret: 'pi_test_client_secret',
      paymentIntentId: 'pi_test_123',
    });

    // Mock payment confirmation error
    mockStripe.confirmPayment.mockResolvedValue({
      paymentIntent: null,
      error: {
        message: 'Your card was declined.',
        type: 'card_error',
      },
    });

    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Complete the card
    const cardInput = screen.getByTestId('card-input');
    await user.type(cardInput, '4242424242424242');

    // Submit payment
    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    await waitFor(() => {
      expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Your card was declined.',
    }));
  });

  it('shows processing state during payment', async () => {
    const user = userEvent.setup();
    
    // Mock slow payment intent creation
    (createPaymentIntent as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        clientSecret: 'pi_test_client_secret',
        paymentIntentId: 'pi_test_123',
      }), 100))
    );

    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Complete the card
    const cardInput = screen.getByTestId('card-input');
    await user.type(cardInput, '4242424242424242');

    // Submit payment
    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    // Should show processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(payButton).toBeDisabled();

    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });

  it('validates required billing information', async () => {
    const user = userEvent.setup();
    
    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
        requireBillingAddress={true}
      />
    );

    // Try to submit without billing info
    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    await waitFor(() => {
      expect(screen.getByText('Billing address is required')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('handles different currencies', () => {
    const eurPaymentData = {
      ...mockPaymentData,
      amount: 2000, // €20.00
      currency: 'eur',
    };

    render(
      <PaymentForm
        paymentData={eurPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Total: €20.00')).toBeInTheDocument();
  });

  it('displays payment method icons', () => {
    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Should show accepted payment methods
    expect(screen.getByText('Visa')).toBeInTheDocument();
    expect(screen.getByText('Mastercard')).toBeInTheDocument();
    expect(screen.getByText('American Express')).toBeInTheDocument();
  });

  it('handles payment without add-ons', () => {
    const paymentDataNoAddOns = {
      ...mockPaymentData,
      addOns: [],
    };

    render(
      <PaymentForm
        paymentData={paymentDataNoAddOns}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Total: $25.00')).toBeInTheDocument();
    expect(screen.queryByText('Add-ons')).not.toBeInTheDocument();
  });

  it('focuses card element on mount', () => {
    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(mockCardElement.focus).toHaveBeenCalled();
  });

  it('cleans up card element on unmount', () => {
    const { unmount } = render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    unmount();

    expect(mockCardElement.unmount).toHaveBeenCalled();
  });

  it('handles Stripe not loaded', () => {
    // Mock Stripe not being available
    vi.mocked(mockStripe).confirmPayment = undefined as any;

    render(
      <PaymentForm
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Payment system is loading...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay now/i })).toBeDisabled();
  });
});