import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import * as fc from 'fast-check';
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

describe('PermissionSlipFlow Property-Based Tests', () => {
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

  // Generators for test data
  const permissionSlipDataGenerator = fc.record({
    id: fc.uuid(),
    student_id: fc.uuid(),
    trip_id: fc.uuid(),
    status: fc.constantFrom('pending', 'signed', 'signed_pending_payment', 'paid'),
    magic_link_token: fc.uuid(),
    students: fc.record({
      first_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      last_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      grade_level: fc.constantFrom('K', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade'),
      medical_conditions: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    }),
    trips: fc.record({
      title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      trip_date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }).map(d => d.toISOString().split('T')[0]),
      departure_time: fc.constantFrom('8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'),
      return_time: fc.constantFrom('2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'),
      estimated_cost_cents: fc.integer({ min: 0, max: 10000 }), // $0 to $100
      experiences: fc.record({
        title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
      }),
      venues: fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        address: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        city: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        state: fc.constantFrom('CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'),
      }),
    }),
  });

  const validFormDataGenerator = fc.record({
    parentFirstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    parentLastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    parentEmail: fc.emailAddress(),
    parentPhone: fc.string({ minLength: 10, maxLength: 15 }).map(s => s.replace(/[^0-9]/g, '').slice(0, 10)),
    emergencyContactName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    emergencyContactPhone: fc.string({ minLength: 10, maxLength: 15 }).map(s => s.replace(/[^0-9]/g, '').slice(0, 10)),
    signature: fc.constant('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  });

  /**
   * **Validates: Requirements FR-9.1, FR-9.2, FR-9.3**
   * Property: Permission slip data should always be displayed correctly regardless of content
   */
  it('should display permission slip data correctly for any valid slip data', () => {
    fc.assert(fc.property(
      permissionSlipDataGenerator.filter(data => data.status === 'pending'),
      (slipData) => {
        mockSupabaseSingle.mockResolvedValue({
          data: slipData,
          error: null,
        });

        render(
          <BrowserRouter>
            <PermissionSlipPage />
          </BrowserRouter>
        );

        return waitFor(() => {
          // Should display student name
          expect(screen.getByText(new RegExp(`${slipData.students.first_name}\\s+${slipData.students.last_name}`))).toBeInTheDocument();
          
          // Should display experience title
          expect(screen.getByText(slipData.trips.experiences.title)).toBeInTheDocument();
          
          // Should display venue name
          expect(screen.getByText(slipData.trips.venues.name)).toBeInTheDocument();
          
          // Should display grade level
          expect(screen.getByText(slipData.students.grade_level)).toBeInTheDocument();
          
          return true;
        });
      }
    ), { numRuns: 20 });
  });

  /**
   * **Validates: Requirements FR-9.8**
   * Property: Payment notice should be shown if and only if cost > 0
   */
  it('should show payment notice if and only if trip has cost', () => {
    fc.assert(fc.property(
      permissionSlipDataGenerator.filter(data => data.status === 'pending'),
      (slipData) => {
        mockSupabaseSingle.mockResolvedValue({
          data: slipData,
          error: null,
        });

        render(
          <BrowserRouter>
            <PermissionSlipPage />
          </BrowserRouter>
        );

        return waitFor(() => {
          const paymentNotice = screen.queryByText('Payment Required');
          
          if (slipData.trips.estimated_cost_cents > 0) {
            expect(paymentNotice).toBeInTheDocument();
          } else {
            expect(paymentNotice).not.toBeInTheDocument();
          }
          
          return true;
        });
      }
    ), { numRuns: 30 });
  });

  /**
   * **Validates: Requirements FR-9.6, FR-9.7**
   * Property: Form validation should consistently reject invalid data
   */
  it('should validate form fields consistently', () => {
    const invalidFormDataGenerator = fc.record({
      parentFirstName: fc.oneof(fc.constant(''), fc.string().filter(s => s.trim().length === 0)),
      parentLastName: fc.oneof(fc.constant(''), fc.string().filter(s => s.trim().length === 0)),
      parentEmail: fc.oneof(fc.constant(''), fc.string().filter(s => !s.includes('@') || !s.includes('.'))),
      parentPhone: fc.oneof(fc.constant(''), fc.string({ maxLength: 9 })),
      emergencyContactName: fc.oneof(fc.constant(''), fc.string().filter(s => s.trim().length === 0)),
      emergencyContactPhone: fc.oneof(fc.constant(''), fc.string({ maxLength: 9 })),
      signature: fc.constant(''),
    });

    fc.assert(fc.property(
      permissionSlipDataGenerator.filter(data => data.status === 'pending'),
      invalidFormDataGenerator,
      async (slipData, formData) => {
        mockSupabaseSingle.mockResolvedValue({
          data: slipData,
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

        // Fill form with invalid data
        if (formData.parentFirstName) {
          await user.type(screen.getByLabelText(/First Name/), formData.parentFirstName);
        }
        if (formData.parentLastName) {
          await user.type(screen.getByLabelText(/Last Name/), formData.parentLastName);
        }
        if (formData.parentEmail) {
          await user.type(screen.getByLabelText(/Email/), formData.parentEmail);
        }
        if (formData.parentPhone) {
          await user.type(screen.getByLabelText(/Phone/), formData.parentPhone);
        }
        if (formData.emergencyContactName) {
          await user.type(screen.getByLabelText(/Emergency Contact Name/), formData.emergencyContactName);
        }
        if (formData.emergencyContactPhone) {
          await user.type(screen.getByLabelText(/Emergency Contact Phone/), formData.emergencyContactPhone);
        }

        const submitButton = screen.getByRole('button', { name: /Sign|Submit/ });
        await user.click(submitButton);

        // Should show validation errors
        await waitFor(() => {
          const errorMessages = screen.queryAllByText(/This field is required|Please enter a valid|Signature is required/);
          expect(errorMessages.length).toBeGreaterThan(0);
        });

        // Should not call update
        expect(mockSupabaseUpdate).not.toHaveBeenCalled();

        return true;
      }
    ), { numRuns: 15 });
  });

  /**
   * **Validates: Requirements FR-9.7, FR-9.8**
   * Property: Valid form submission should always result in correct status and navigation
   */
  it('should handle valid form submission correctly based on payment requirement', () => {
    fc.assert(fc.property(
      permissionSlipDataGenerator.filter(data => data.status === 'pending'),
      validFormDataGenerator,
      async (slipData, formData) => {
        mockSupabaseSingle.mockResolvedValue({
          data: slipData,
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

        // Fill form with valid data
        await user.type(screen.getByLabelText(/First Name/), formData.parentFirstName);
        await user.type(screen.getByLabelText(/Last Name/), formData.parentLastName);
        await user.type(screen.getByLabelText(/Email/), formData.parentEmail);
        await user.type(screen.getByLabelText(/Phone/), formData.parentPhone);
        await user.type(screen.getByLabelText(/Emergency Contact Name/), formData.emergencyContactName);
        await user.type(screen.getByLabelText(/Emergency Contact Phone/), formData.emergencyContactPhone);

        // Mock signature
        const canvas = screen.getByRole('img', { hidden: true });
        fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
        fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
        fireEvent.mouseUp(canvas);

        const submitButton = screen.getByRole('button', { name: /Sign|Submit/ });
        await user.click(submitButton);

        const requiresPayment = slipData.trips.estimated_cost_cents > 0;
        const expectedStatus = requiresPayment ? 'signed_pending_payment' : 'signed';

        await waitFor(() => {
          expect(mockSupabaseUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
              parent_first_name: formData.parentFirstName,
              parent_last_name: formData.parentLastName,
              parent_email: formData.parentEmail,
              parent_phone: formData.parentPhone,
              emergency_contact_name: formData.emergencyContactName,
              emergency_contact_phone: formData.emergencyContactPhone,
              signature: expect.any(String),
              signed_at: expect.any(String),
              status: expectedStatus,
            })
          );
        });

        await waitFor(() => {
          if (requiresPayment) {
            expect(mockNavigate).toHaveBeenCalledWith(`/payment?slip=${slipData.id}&token=test-token`);
          } else {
            expect(mockNavigate).toHaveBeenCalledWith(`/permission-slip/success?slip=${slipData.id}&token=test-token`);
          }
        });

        return true;
      }
    ), { numRuns: 20 });
  });

  /**
   * **Validates: Requirements FR-9.1**
   * Property: Already processed slips should always redirect appropriately
   */
  it('should redirect correctly for already processed permission slips', () => {
    const processedStatusGenerator = fc.constantFrom('signed', 'signed_pending_payment', 'paid');

    fc.assert(fc.property(
      permissionSlipDataGenerator,
      processedStatusGenerator,
      (slipData, status) => {
        const processedSlipData = { ...slipData, status };
        
        mockSupabaseSingle.mockResolvedValue({
          data: processedSlipData,
          error: null,
        });

        render(
          <BrowserRouter>
            <PermissionSlipPage />
          </BrowserRouter>
        );

        return waitFor(() => {
          if (status === 'signed_pending_payment') {
            expect(mockNavigate).toHaveBeenCalledWith(`/payment?slip=${slipData.id}&token=test-token`);
          } else {
            expect(mockNavigate).toHaveBeenCalledWith(`/permission-slip/success?slip=${slipData.id}&token=test-token`);
          }
          
          return true;
        });
      }
    ), { numRuns: 15 });
  });

  /**
   * **Validates: Requirements FR-4.2**
   * Property: Database errors should always be handled gracefully
   */
  it('should handle database errors gracefully', () => {
    const errorGenerator = fc.oneof(
      fc.constant(new Error('Network error')),
      fc.constant(new Error('Database connection failed')),
      fc.constant(new Error('Permission denied')),
      fc.constant(new Error('Timeout'))
    );

    fc.assert(fc.property(
      errorGenerator,
      (error) => {
        mockSupabaseSingle.mockResolvedValue({
          data: null,
          error,
        });

        render(
          <BrowserRouter>
            <PermissionSlipPage />
          </BrowserRouter>
        );

        return waitFor(() => {
          expect(screen.getByText('Unable to Load Permission Slip')).toBeInTheDocument();
          expect(screen.getByText('Go to Home')).toBeInTheDocument();
          
          // Should not crash the application
          expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument();
          
          return true;
        });
      }
    ), { numRuns: 10 });
  });

  /**
   * **Validates: Requirements FR-4.2**
   * Property: Form submission errors should be handled gracefully
   */
  it('should handle form submission errors gracefully', () => {
    const submissionErrorGenerator = fc.oneof(
      fc.constant(new Error('Failed to save permission slip')),
      fc.constant(new Error('Network timeout')),
      fc.constant(new Error('Database error')),
      fc.constant(new Error('Validation failed'))
    );

    fc.assert(fc.property(
      permissionSlipDataGenerator.filter(data => data.status === 'pending'),
      validFormDataGenerator,
      submissionErrorGenerator,
      async (slipData, formData, error) => {
        mockSupabaseSingle.mockResolvedValue({
          data: slipData,
          error: null,
        });

        mockSupabaseUpdate.mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error }),
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

        // Fill and submit form
        await user.type(screen.getByLabelText(/First Name/), formData.parentFirstName);
        await user.type(screen.getByLabelText(/Last Name/), formData.parentLastName);
        await user.type(screen.getByLabelText(/Email/), formData.parentEmail);
        await user.type(screen.getByLabelText(/Phone/), formData.parentPhone);
        await user.type(screen.getByLabelText(/Emergency Contact Name/), formData.emergencyContactName);
        await user.type(screen.getByLabelText(/Emergency Contact Phone/), formData.emergencyContactPhone);

        // Mock signature
        const canvas = screen.getByRole('img', { hidden: true });
        fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
        fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
        fireEvent.mouseUp(canvas);

        const submitButton = screen.getByRole('button', { name: /Sign|Submit/ });
        await user.click(submitButton);

        // Should show error message
        await waitFor(() => {
          expect(screen.getByText('Submission Error')).toBeInTheDocument();
          expect(screen.getByText(error.message)).toBeInTheDocument();
        });

        // Should not navigate
        expect(mockNavigate).not.toHaveBeenCalled();

        return true;
      }
    ), { numRuns: 10 });
  });
});