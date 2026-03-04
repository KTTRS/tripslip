import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { PermissionSlipPage } from '../PermissionSlipPage';

// Mock the supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
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

describe('Permission Slip Flow Integration Tests', () => {
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
  });

  /**
   * **Validates: Requirements FR-9.1, FR-9.2, FR-9.3**
   * Test complete permission slip workflow for paid trips
   */
  it('should complete permission slip workflow for paid trips', async () => {
    const user = userEvent.setup();

    // Mock successful data fetch
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockSlipData,
      error: null,
    });

    render(
      <BrowserRouter>
        <PermissionSlipPage />
      </BrowserRouter>
    );

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
    });

    // Verify trip details are displayed
    expect(screen.getByText('Science Museum Experience')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Payment Required')).toBeInTheDocument();

    // Fill out the form
    await user.type(screen.getByLabelText(/First Name/), 'John');
    await user.type(screen.getByLabelText(/Last Name/), 'Doe');
    await user.type(screen.getByLabelText(/Email/), 'john@example.com');
    await user.type(screen.getByLabelText(/Phone/), '555-123-4567');
    await user.type(screen.getByLabelText(/Emergency Contact Name/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Emergency Contact Phone/), '555-987-6543');

    // Mock signature (simulate canvas interaction)
    const canvas = screen.getByRole('img', { hidden: true });
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Sign & Proceed to Payment/ });
    await user.click(submitButton);

    // Verify database update was called with correct data
    await waitFor(() => {
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_first_name: 'John',
          parent_last_name: 'Doe',
          parent_email: 'john@example.com',
          parent_phone: '555-123-4567',
          emergency_contact_name: 'Jane Doe',
          emergency_contact_phone: '555-987-6543',
          signature: expect.any(String),
          signed_at: expect.any(String),
          status: 'signed_pending_payment',
        })
      );
    });

    // Verify navigation to payment page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/payment?slip=slip-123&token=test-token');
    });
  });

  /**
   * **Validates: Requirements FR-9.7**
   * Test complete permission slip workflow for free trips
   */
  it('should complete permission slip workflow for free trips', async () => {
    const user = userEvent.setup();

    const freeSlipData = { 
      ...mockSlipData, 
      trips: { 
        ...mockSlipData.trips, 
        estimated_cost_cents: 0 
      } 
    };

    mockSupabase.from().select().eq().single.mockResolvedValue({
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
    });

    // Should not show payment notice for free trips
    expect(screen.queryByText('Payment Required')).not.toBeInTheDocument();

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

    const submitButton = screen.getByRole('button', { name: /Submit Permission Slip/ });
    await user.click(submitButton);

    // Verify status is 'signed' for free trips
    await waitFor(() => {
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'signed',
        })
      );
    });

    // Verify navigation to success page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/permission-slip/success?slip=slip-123&token=test-token');
    });
  });

  /**
   * **Validates: Requirements FR-9.6**
   * Test form validation
   */
  it('should validate required fields', async () => {
    const user = userEvent.setup();

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockSlipData,
      error: null,
    });

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

    // Should show validation errors
    await waitFor(() => {
      const errorMessages = screen.getAllByText('This field is required');
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    // Should not call database update
    expect(mockSupabase.from().update).not.toHaveBeenCalled();
  });

  /**
   * **Validates: Requirements FR-4.2**
   * Test error handling
   */
  it('should handle database errors gracefully', async () => {
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: new Error('Database error'),
    });

    render(
      <BrowserRouter>
        <PermissionSlipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Permission Slip')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });
  });

  /**
   * **Validates: Requirements FR-9.1**
   * Test invalid token handling
   */
  it('should handle invalid tokens', async () => {
    // Mock useSearchParams to return empty params
    vi.mocked(require('react-router')).useSearchParams = vi.fn(() => [new URLSearchParams()]);

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

  /**
   * **Validates: Requirements FR-9.1**
   * Test redirect for already processed slips
   */
  it('should redirect for already signed slips', async () => {
    const signedSlipData = { ...mockSlipData, status: 'signed' };

    mockSupabase.from().select().eq().single.mockResolvedValue({
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

  /**
   * **Validates: Requirements FR-9.8**
   * Test redirect to payment for signed pending payment slips
   */
  it('should redirect to payment for signed pending payment slips', async () => {
    const pendingPaymentSlipData = { ...mockSlipData, status: 'signed_pending_payment' };

    mockSupabase.from().select().eq().single.mockResolvedValue({
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