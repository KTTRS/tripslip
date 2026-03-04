import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { PermissionSlipPage } from '../PermissionSlipPage';

// Mock the supabase client
const mockSupabaseFrom = vi.fn();
const mockSupabaseSelect = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseSingle = vi.fn();
const mockSupabaseUpdate = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockSupabaseFrom,
  }
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'permissionSlip.title': 'Field Trip Permission Slip',
        'permissionSlip.subtitle': 'Please review the trip details and provide your signature for {{studentName}} to participate',
        'permissionSlip.paymentRequired': 'Payment Required',
        'permissionSlip.paymentNotice': 'After signing, you will be redirected to pay {{amount}} for this trip',
        'permissionSlip.signAndProceedToPayment': 'Sign & Proceed to Payment',
        'permissionSlip.submitPermissionSlip': 'Submit Permission Slip',
        'permissionSlip.invalidLink': 'Invalid permission slip link',
        'permissionSlip.errorTitle': 'Unable to Load Permission Slip',
        'permissionSlip.notFound': 'This permission slip could not be found',
        'permissionSlip.submissionError': 'Submission Error',
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
        'permissionSlip.submitting': 'Submitting...',
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
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=test-token')],
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children
  };
});

// Mock Logger
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

describe('PermissionSlipFlow', () => {
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
      medical_conditions: 'None',
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

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      mockSupabaseSingle.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('should show error when no token is provided', async () => {
      // Mock useSearchParams to return empty params
      vi.mocked(require('react-router').useSearchParams).mockReturnValue([new URLSearchParams()]);

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Permission Slip')).toBeInTheDocument();
        expect(screen.getByText('Invalid permission slip link')).toBeInTheDocument();
      });
    });

    it('should show error when permission slip is not found', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Permission Slip')).toBeInTheDocument();
      });
    });

    it('should redirect if permission slip is already signed', async () => {
      const signedSlipData = { ...mockSlipData, status: 'signed' };
      mockSupabaseSingle.mockResolvedValue({
        data: signedSlipData,
        error: null,
      });

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/permission-slip/success?slip=slip-123&token=test-token');
      });
    });

    it('should redirect to payment if already signed and payment pending', async () => {
      const pendingPaymentSlipData = { ...mockSlipData, status: 'signed_pending_payment' };
      mockSupabaseSingle.mockResolvedValue({
        data: pendingPaymentSlipData,
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

  describe('Permission Slip Display', () => {
    beforeEach(() => {
      mockSupabaseSingle.mockResolvedValue({
        data: mockSlipData,
        error: null,
      });
    });

    it('should display trip details correctly', async () => {
      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
        expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
        expect(screen.getByText('Science Museum Experience')).toBeInTheDocument();
        expect(screen.getByText('Science Museum')).toBeInTheDocument();
      });
    });

    it('should show payment notice for paid trips', async () => {
      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Required')).toBeInTheDocument();
        expect(screen.getByText(/After signing, you will be redirected to pay \$25\.00/)).toBeInTheDocument();
      });
    });

    it('should not show payment notice for free trips', async () => {
      const freeSlipData = { ...mockSlipData, trips: { ...mockSlipData.trips, estimated_cost_cents: 0 } };
      mockSupabaseSingle.mockResolvedValue({
        data: freeSlipData,
        error: null,
      });

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
        expect(screen.queryByText('Payment Required')).not.toBeInTheDocument();
      });
    });

    it('should display student information', async () => {
      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('5th Grade')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      mockSupabaseSingle.mockResolvedValue({
        data: mockSlipData,
        error: null,
      });
    });

    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText('This field is required');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Fill in invalid email
      const emailInput = screen.getByLabelText(/Email/);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should validate phone format', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Fill in invalid phone
      const phoneInput = screen.getByLabelText(/Phone/);
      await user.type(phoneInput, '123');

      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    it('should require signature', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Fill all fields except signature
      await user.type(screen.getByLabelText(/First Name/), 'John');
      await user.type(screen.getByLabelText(/Last Name/), 'Doe');
      await user.type(screen.getByLabelText(/Email/), 'john@example.com');
      await user.type(screen.getByLabelText(/Phone/), '555-123-4567');
      await user.type(screen.getByLabelText(/Emergency Contact Name/), 'Jane Doe');
      await user.type(screen.getByLabelText(/Emergency Contact Phone/), '555-987-6543');

      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signature is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      mockSupabaseSingle.mockResolvedValue({
        data: mockSlipData,
        error: null,
      });
    });

    it('should submit form successfully for paid trips', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Fill out the form
      await user.type(screen.getByLabelText(/First Name/), 'John');
      await user.type(screen.getByLabelText(/Last Name/), 'Doe');
      await user.type(screen.getByLabelText(/Email/), 'john@example.com');
      await user.type(screen.getByLabelText(/Phone/), '555-123-4567');
      await user.type(screen.getByLabelText(/Emergency Contact Name/), 'Jane Doe');
      await user.type(screen.getByLabelText(/Emergency Contact Phone/), '555-987-6543');

      // Mock signature (would normally be set by canvas interaction)
      const canvas = screen.getByRole('img', { hidden: true }); // Canvas element
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.mouseUp(canvas);

      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith({
          parent_first_name: 'John',
          parent_last_name: 'Doe',
          parent_email: 'john@example.com',
          parent_phone: '555-123-4567',
          emergency_contact_name: 'Jane Doe',
          emergency_contact_phone: '555-987-6543',
          signature: expect.any(String),
          signed_at: expect.any(String),
          status: 'signed_pending_payment',
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/payment?slip=slip-123&token=test-token');
      });
    });

    it('should submit form successfully for free trips', async () => {
      const freeSlipData = { ...mockSlipData, trips: { ...mockSlipData.trips, estimated_cost_cents: 0 } };
      mockSupabaseSingle.mockResolvedValue({
        data: freeSlipData,
        error: null,
      });

      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Fill out the form
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

      const submitButton = screen.getByRole('button', { name: /Submit Permission Slip/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'signed',
          })
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/permission-slip/success?slip=slip-123&token=test-token');
      });
    });

    it('should handle submission errors', async () => {
      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('Database error') }),
      });

      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Fill out the form
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

      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submission Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to save permission slip')).toBeInTheDocument();
      });
    });

    it('should show submitting state during form submission', async () => {
      // Mock a slow update
      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))),
      });

      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
      });

      // Fill out the form
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

      const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
      await user.click(submitButton);

      // Should show submitting state
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});