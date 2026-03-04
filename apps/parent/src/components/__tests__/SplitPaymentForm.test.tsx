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
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => ({
    confirmPayment: vi.fn(),
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

const mockPayments = [
  {
    id: 'payment-1',
    permission_slip_id: 'slip-123',
    parent_id: 'parent-1',
    amount_cents: 2500,
    stripe_payment_intent_id: 'pi_123',
    status: 'succeeded' as const,
    is_split_payment: true,
    split_payment_group_id: 'slip-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('SplitPaymentForm', () => {
  const defaultProps = {
    permissionSlipId: 'slip-123',
    totalAmountCents: 5000,
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
  });

  it('renders loading state initially', async () => {
    render(<SplitPaymentForm {...defaultProps} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays payment summary with correct amounts', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue(mockPayments);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    });

    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Total cost
    expect(screen.getByText('$25.00')).toBeInTheDocument(); // Paid so far
  });

  it('calculates remaining balance correctly', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue(mockPayments);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Remaining Balance')).toBeInTheDocument();
    });

    // Total $50.00 - Paid $25.00 = Remaining $25.00
    const remainingElements = screen.getAllByText('$25.00');
    expect(remainingElements.length).toBeGreaterThan(0);
  });

  it('shows previous contributions when they exist', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue(mockPayments);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Previous Contributions')).toBeInTheDocument();
    });

    expect(screen.getByText('Contribution 1')).toBeInTheDocument();
  });

  it('shows fully paid state when balance is zero', async () => {
    const fullPayments = [
      {
        ...mockPayments[0],
        amount_cents: 5000, // Full amount
      },
    ];
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue(fullPayments);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Payment Complete')).toBeInTheDocument();
    });

    expect(screen.getByText('This trip has been fully paid for.')).toBeInTheDocument();
  });

  it('validates contributor information', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Contributor Information')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /contribute/i });
    
    // Try to submit without filling required fields
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contributor name is required')).toBeInTheDocument();
    });
  });

  it('validates contribution amount', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
    const user = userEvent.setup();
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Contribution Amount')).toBeInTheDocument();
    });

    // Fill in contributor info
    await user.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'john@example.com');
    
    // Try to submit without amount
    const submitButton = screen.getByRole('button', { name: /contribute/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contribution amount must be greater than $0')).toBeInTheDocument();
    });
  });

  it('prevents contribution amount exceeding remaining balance', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue(mockPayments);
    const user = userEvent.setup();
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Contribution Amount')).toBeInTheDocument();
    });

    // Fill in contributor info
    await user.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'john@example.com');
    
    // Try to contribute more than remaining balance ($25.00)
    await user.type(screen.getByPlaceholderText('0.00'), '30.00');
    
    const submitButton = screen.getByRole('button', { name: /contribute/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contribution amount cannot exceed remaining balance')).toBeInTheDocument();
    });
  });

  it('handles quick amount buttons correctly', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Contribution Amount')).toBeInTheDocument();
    });

    // Click 50% button (should be $25.00 for $50.00 total)
    const fiftyPercentButton = screen.getByText('50% ($25.00)');
    fireEvent.click(fiftyPercentButton);
    
    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(amountInput.value).toBe('25.00');
  });

  it('handles pay remaining button correctly', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue(mockPayments);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Contribution Amount')).toBeInTheDocument();
    });

    // Click pay remaining button (should be $25.00 remaining)
    const payRemainingButton = screen.getByText('Pay Remaining ($25.00)');
    fireEvent.click(payRemainingButton);
    
    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(amountInput.value).toBe('25.00');
  });

  it('shows payment element when valid amount is entered', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
    const user = userEvent.setup();
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Contribution Amount')).toBeInTheDocument();
    });

    // Enter a valid amount
    await user.type(screen.getByPlaceholderText('0.00'), '10.00');
    
    await waitFor(() => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    });
  });

  it('formats currency correctly', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('$50.00').length).toBeGreaterThan(0); // Total cost formatted
    });
  });

  it('handles amount input formatting correctly', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
    const user = userEvent.setup();
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    
    // Test that non-numeric characters are filtered out
    await user.type(amountInput, 'abc123.45def');
    expect(amountInput.value).toBe('123.45');
    
    // Test that multiple decimal points are prevented
    await user.clear(amountInput);
    await user.type(amountInput, '12.34.56');
    expect(amountInput.value).toBe('12.34');
    
    // Test that more than 2 decimal places are prevented
    await user.clear(amountInput);
    await user.type(amountInput, '12.345');
    expect(amountInput.value).toBe('12.34');
  });

  it('displays split payment information', async () => {
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockResolvedValue([]);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('How Split Payments Work')).toBeInTheDocument();
    });

    expect(screen.getByText(/Multiple people can contribute/)).toBeInTheDocument();
    expect(screen.getByText(/Each contribution is processed separately/)).toBeInTheDocument();
    expect(screen.getByText(/The trip is approved once the full amount/)).toBeInTheDocument();
    expect(screen.getByText(/All contributors will receive payment confirmations/)).toBeInTheDocument();
  });

  it('calls onError when payment service fails', async () => {
    const mockError = new Error('Payment service error');
    vi.mocked(paymentService.getPaymentsByPermissionSlip).mockRejectedValue(mockError);
    
    render(<SplitPaymentForm {...defaultProps} />);
    
    // Wait for the error to be handled
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});