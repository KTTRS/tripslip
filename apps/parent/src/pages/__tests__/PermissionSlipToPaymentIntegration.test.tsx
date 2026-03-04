import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { PermissionSlipPage } from '../PermissionSlipPage';
import { PaymentPage } from '../PaymentPage';

// Mock the supabase client
vi.mock('../../lib/supabase', () => {
  const mockSupabaseFrom = vi.fn();
  const mockSupabaseSelect = vi.fn();
  const mockSupabaseEq = vi.fn();
  const mockSupabaseSingle = vi.fn();
  const mockSupabaseUpdate = vi.fn();

  return {
    supabase: {
      from: mockSupabaseFrom,
    },
    mockSupabaseFrom,
    mockSupabaseSelect,
    mockSupabaseEq,
    mockSupabaseSingle,
    mockSupabaseUpdate,
  };
});

const {
  mockSupabaseFrom,
  mockSupabaseSelect,
  mockSupabaseEq,
  mockSupabaseSingle,
  mockSupabaseUpdate,
} = vi.mocked(await import('../../lib/supabase'));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        // Permission slip translations
        'permissionSlip.title': 'Field Trip Permission Slip',
        'permissionSlip.subtitle': 'Please review the trip details and provide your signature for {{studentName}} to participate',
        'permissionSlip.paymentRequired': 'Payment Required',
        'permissionSlip.paymentNotice': 'After signing, you will be redirected to pay {{amount}} for this trip',
        'permissionSlip.signAndProceedToPayment': 'Sign & Proceed to Payment',
        'permissionSlip.parentInformation': 'Parent Information',
        'permissionSlip.parentFirstName': 'First Name',
        'permissionSlip.parentLastName': 'Last Name',
        'permissionSlip.parentEmail': 'Email',
        'permissionSlip.parentPhone': 'Phone',
        'permissionSlip.emergencyContact': 'Emergency Contact',
        'permissionSlip.emergencyContactName': 'Emergency Contact Name',
        'permissionSlip.emergencyContactPhone': 'Emergency Contact Phone',
        'permissionSlip.signature': 'Signature',
        'permissionSlip.signatureInstruction': 'Please sign above',
        'permissionSlip.clearSignature': 'Clear',
        
        // Payment translations
        'payment.title': 'Payment',
        'payment.subtitle': 'Complete payment for {{studentName}} - {{tripTitle}}',
        'payment.tripSummary': 'Trip Summary',
        'payment.trip': 'Trip',
        'payment.student': 'Student',
        'payment.date': 'Date',
        'payment.paymentOptions': 'Payment Options',
        'payment.enableSplitPayment': 'Enable split payment',
        'payment.securityNotice': 'Security Notice',
        'payment.secureProcessing': 'All payments are processed securely',
        'payment.noStoredCards': 'We do not store your card information',
        'payment.receiptEmail': 'You will receive a receipt via email',
        'payment.invalidLink': 'Invalid payment link',
        'payment.alreadyPaid': 'This trip has already been paid for',
        'payment.notReadyForPayment': 'Permission slip must be signed before payment',
        'payment.errorTitle': 'Payment Error',
        'payment.notFound': 'Payment information not found',
        
        // Common translations
        'common.loading': 'Loading...',
        'common.goHome': 'Go to Home',
        'errors.required': 'This field is required',
        'errors.invalidEmail': 'Please enter a valid email address',
        'errors.invalidPhone': 'Please enter a valid phone number',
        'errors.signatureRequired': 'Signature is required',
      };
      
      let result = translations[key] || key;
      if (options && typeof options === 'object') {
        Object.keys(options).forEach(optionKey => {
          result = result.replace(`{{${optionKey}}}`, options[optionKey]);
        });
      }
      return result;
    },
    i18n: { language: 'en' }
  })
}));

// Mock react-router
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams('token=test-token');

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children
  };
});

// Mock Logger and utilities
vi.mock('@tripslip/utils', () => ({
  Logger: class {
    debug = vi.fn();
    info = vi.fn();
    error = vi.fn();
  },
  validateEmail: (email: string) => email.includes('@') && email.includes('.'),
  validatePhone: (phone: string) => phone.length >= 10,
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

// Mock payment components
vi.mock('../../components/PaymentForm', () => ({
  PaymentForm: ({ onSuccess, onError, amountCents }: any) => (
    <div data-testid="payment-form">
      <p>Amount: ${amountCents / 100}</p>
      <button onClick={() => onSuccess()}>Pay Now</button>
      <button onClick={() => onError('Payment failed')}>Simulate Error</button>
    </div>
  )
}));

vi.mock('../../components/AddOnSelector', () => ({
  AddOnSelector: ({ basePriceCents, onTotalChange }: any) => {
    // Simulate add-on selection
    const handleAddOnChange = () => {
      onTotalChange(basePriceCents + 500); // Add $5 add-on
    };

    return (
      <div data-testid="addon-selector">
        <p>Base Price: ${basePriceCents / 100}</p>
        <button onClick={handleAddOnChange}>Add Optional Item (+$5)</button>
      </div>
    );
  }
}));

vi.mock('../../components/SplitPaymentForm', () => ({
  SplitPaymentForm: ({ onSuccess, onError, totalAmountCents }: any) => (
    <div data-testid="split-payment-form">
      <p>Split Payment Total: ${totalAmountCents / 100}</p>
      <button onClick={() => onSuccess()}>Complete Split Payment</button>
      <button onClick={() => onError('Split payment failed')}>Simulate Split Error</button>
    </div>
  )
}));

describe('Permission Slip to Payment Integration', () => {
  const mockSlipData = {
    id: 'slip-123',
    student_id: 'student-123',
    trip_id: 'trip-123',
    status: 'pending',
    magic_link_token: 'test-token',
    students: {
      first_name: 'Alice',
      last_name: 'Smith',
      grade_level: '5th Grade',
    },
    trips: {
      title: 'Museum Visit',
      trip_date: '2024-02-15',
      departure_time: '9:00 AM',
      return_time: '3:00 PM',
      estimated_cost_cents: 2500, // $25.00
      experiences: {
        title: 'Science Museum Experience',
        description: 'Educational visit to the science museum',
        add_ons: [
          {
            id: 'addon-1',
            name: 'Lunch Package',
            description: 'Includes lunch and snacks',
            price_cents: 800,
            required: false,
          },
          {
            id: 'addon-2',
            name: 'Souvenir Package',
            description: 'Educational materials and souvenirs',
            price_cents: 500,
            required: false,
          }
        ]
      },
      venues: {
        name: 'Science Museum',
        address: '123 Museum St',
        city: 'City',
        state: 'State',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('token=test-token');
    
    // Setup default mock chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      update: mockSupabaseUpdate,
    });
    
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
    });
    
    mockSupabaseEq.mockReturnValue({
      single: mockSupabaseSingle,
    });
    
    mockSupabaseUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('Complete Permission Slip to Payment Flow', () => {
    it('should complete the full flow from permission slip to payment', async () => {
      const user = userEvent.setup();

      // Step 1: Load permission slip page
      mockSupabaseSingle.mockResolvedValue({
        data: mockSlipData,
        error: null,
      });

      const { rerender } = render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
        expect(screen.getByText('Payment Required')).toBeInTheDocument();
      });

      // Step 2: Fill out permission slip form
      await user.type(screen.getByLabelText(/First Name/), 'John');
      await user.type(screen.getByLabelText(/Last Name/), 'Doe');
      await user.type(screen.getByLabelText(/Email/), 'john@example.com');
      await user.type(screen.getByLabelText(/Phone/), '555-123-4567');
      await user.type(screen.getByLabelText(/Emergency Contact Name/), 'Jane Doe');
      await user.type(screen.getByLabelText(/Emergency Contact Phone/), '555-987-6543');

      // Mock signature
      const canvas = screen.getByRole('img', { hidden: true });
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.mouseUp(canvas);

      // Step 3: Submit permission slip
      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'signed_pending_payment',
          })
        );
        expect(mockNavigate).toHaveBeenCalledWith('/payment?slip=slip-123&token=test-token');
      });

      // Step 4: Simulate navigation to payment page
      mockSearchParams = new URLSearchParams('slip=slip-123&token=test-token');
      
      // Mock payment page data (signed_pending_payment status)
      const paymentSlipData = {
        ...mockSlipData,
        status: 'signed_pending_payment',
        parent_first_name: 'John',
        parent_last_name: 'Doe',
        parent_email: 'john@example.com',
      };

      mockSupabaseSingle.mockResolvedValue({
        data: paymentSlipData,
        error: null,
      });

      rerender(
        <BrowserRouter>
          <PaymentPage />
        </BrowserRouter>
      );

      // Step 5: Verify payment page loads correctly
      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
        expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
        expect(screen.getByText('Science Museum Experience')).toBeInTheDocument();
      });

      // Step 6: Complete payment
      const payButton = screen.getByText('Pay Now');
      await user.click(payButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/payment/success?slip=slip-123&token=test-token');
      });
    });

    it('should handle add-ons in the payment flow', async () => {
      const user = userEvent.setup();

      // Start with payment page (skip permission slip for this test)
      mockSearchParams = new URLSearchParams('slip=slip-123&token=test-token');
      
      const paymentSlipData = {
        ...mockSlipData,
        status: 'signed_pending_payment',
      };

      mockSupabaseSingle.mockResolvedValue({
        data: paymentSlipData,
        error: null,
      });

      render(
        <BrowserRouter>
          <PaymentPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });

      // Add optional item
      const addOnButton = screen.getByText('Add Optional Item (+$5)');
      await user.click(addOnButton);

      // Verify payment form shows updated amount
      await waitFor(() => {
        expect(screen.getByText('Amount: $30')).toBeInTheDocument(); // $25 + $5
      });
    });

    it('should handle split payment option', async () => {
      const user = userEvent.setup();

      mockSearchParams = new URLSearchParams('slip=slip-123&token=test-token');
      
      const paymentSlipData = {
        ...mockSlipData,
        status: 'signed_pending_payment',
      };

      mockSupabaseSingle.mockResolvedValue({
        data: paymentSlipData,
        error: null,
      });

      render(
        <BrowserRouter>
          <PaymentPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });

      // Enable split payment
      const splitPaymentCheckbox = screen.getByRole('checkbox');
      await user.click(splitPaymentCheckbox);

      // Verify split payment form is shown
      expect(screen.getByTestId('split-payment-form')).toBeInTheDocument();
      expect(screen.getByText('Split Payment Total: $25')).toBeInTheDocument();

      // Complete split payment
      const splitPayButton = screen.getByText('Complete Split Payment');
      await user.click(splitPayButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/payment/success?slip=slip-123&token=test-token');
      });
    });

    it('should handle payment errors gracefully', async () => {
      const user = userEvent.setup();

      mockSearchParams = new URLSearchParams('slip=slip-123&token=test-token');
      
      const paymentSlipData = {
        ...mockSlipData,
        status: 'signed_pending_payment',
      };

      mockSupabaseSingle.mockResolvedValue({
        data: paymentSlipData,
        error: null,
      });

      render(
        <BrowserRouter>
          <PaymentPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });

      // Simulate payment error
      const errorButton = screen.getByText('Simulate Error');
      await user.click(errorButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/payment/success'));
    });

    it('should prevent payment for already paid slips', async () => {
      mockSearchParams = new URLSearchParams('slip=slip-123&token=test-token');
      
      const paidSlipData = {
        ...mockSlipData,
        status: 'paid',
      };

      mockSupabaseSingle.mockResolvedValue({
        data: paidSlipData,
        error: null,
      });

      render(
        <BrowserRouter>
          <PaymentPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
        expect(screen.getByText('This trip has already been paid for')).toBeInTheDocument();
      });
    });

    it('should prevent payment for unsigned slips', async () => {
      mockSearchParams = new URLSearchParams('slip=slip-123&token=test-token');
      
      const unsignedSlipData = {
        ...mockSlipData,
        status: 'pending',
      };

      mockSupabaseSingle.mockResolvedValue({
        data: unsignedSlipData,
        error: null,
      });

      render(
        <BrowserRouter>
          <PaymentPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
        expect(screen.getByText('Permission slip must be signed before payment')).toBeInTheDocument();
      });
    });

    it('should handle invalid payment links', async () => {
      mockSearchParams = new URLSearchParams(); // No slip or token

      render(
        <BrowserRouter>
          <PaymentPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
        expect(screen.getByText('Invalid payment link')).toBeInTheDocument();
      });
    });

    it('should redirect from permission slip if already signed and payment pending', async () => {
      const signedPendingSlipData = {
        ...mockSlipData,
        status: 'signed_pending_payment',
      };

      mockSupabaseSingle.mockResolvedValue({
        data: signedPendingSlipData,
        error: null,
      });

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/payment?slip=slip-123&token=test-token');
      });
    });
  });

  describe('Error Handling Across Flow', () => {
    it('should handle database errors during permission slip submission', async () => {
      const user = userEvent.setup();

      mockSupabaseSingle.mockResolvedValue({
        data: mockSlipData,
        error: null,
      });

      // Mock update error
      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('Database connection failed') }),
      });

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/First Name/), 'John');
      await user.type(screen.getByLabelText(/Last Name/), 'Doe');
      await user.type(screen.getByLabelText(/Email/), 'john@example.com');
      await user.type(screen.getByLabelText(/Phone/), '555-123-4567');
      await user.type(screen.getByLabelText(/Emergency Contact Name/), 'Jane Doe');
      await user.type(screen.getByLabelText(/Emergency Contact Phone/), '555-987-6543');

      const canvas = screen.getByRole('img', { hidden: true });
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.mouseUp(canvas);

      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      // Should show error and not navigate
      await waitFor(() => {
        expect(screen.getByText('Failed to save permission slip')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle network errors during payment page load', async () => {
      mockSearchParams = new URLSearchParams('slip=slip-123&token=test-token');

      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });

      render(
        <BrowserRouter>
          <PaymentPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
        expect(screen.getByText('Permission slip not found or payment link has expired')).toBeInTheDocument();
      });
    });
  });
});