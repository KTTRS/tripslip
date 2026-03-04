import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        'common.loading': 'Loading...',
      };
      
      let result = translations[key] || key;
      if (options && typeof options === 'object') {
        Object.keys(options).forEach(optionKey => {
          result = result.replace(`{{${optionKey}}}`, options[optionKey]);
        });
      }
      return result;
    }
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
  validateEmail: (email: string) => email.includes('@'),
  validatePhone: (phone: string) => phone.length >= 10,
}));

// Mock permission slip components
vi.mock('../../components/permission-slip/TripDetails', () => ({
  TripDetails: ({ trip }: any) => (
    <div data-testid="trip-details">
      <h2>{trip.experiences.title}</h2>
      <p>Cost: ${trip.estimated_cost_cents / 100}</p>
    </div>
  )
}));

vi.mock('../../components/permission-slip/StudentInfo', () => ({
  StudentInfo: ({ student }: any) => (
    <div data-testid="student-info">
      <p>{student.first_name} {student.last_name}</p>
    </div>
  )
}));

vi.mock('../../components/permission-slip/PermissionSlipForm', () => ({
  PermissionSlipForm: ({ onSubmit, requiresPayment }: any) => (
    <form data-testid="permission-slip-form" onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        parentFirstName: 'John',
        parentLastName: 'Doe',
        parentEmail: 'john@example.com',
        parentPhone: '555-123-4567',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '555-987-6543',
        signature: 'data:image/png;base64,test-signature'
      });
    }}>
      <button type="submit">
        {requiresPayment ? 'Sign & Proceed to Payment' : 'Submit Permission Slip'}
      </button>
    </form>
  )
}));

describe('Payment Flow Integration', () => {
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

  it('should redirect to payment page for paid trips', async () => {
    // Mock permission slip data with payment required
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
        estimated_cost_cents: 2500, // $25.00 - requires payment
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

    mockSupabaseSingle.mockResolvedValue({
      data: mockSlipData,
      error: null,
    });

    render(
      <BrowserRouter>
        <PermissionSlipPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
    });

    // Check that payment notice is displayed
    expect(screen.getByText('Payment Required')).toBeInTheDocument();
    expect(screen.getByText(/After signing, you will be redirected to pay \$25\.00/)).toBeInTheDocument();

    // Submit the form
    const form = screen.getByTestId('permission-slip-form');
    fireEvent.submit(form);

    // Wait for form submission
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/payment?slip=slip-123&token=test-token');
    });
  });

  it('should redirect to success page for free trips', async () => {
    // Mock permission slip data with no payment required
    const mockSlipData = {
      id: 'slip-456',
      student_id: 'student-456',
      trip_id: 'trip-456',
      status: 'pending',
      magic_link_token: 'test-token',
      students: {
        first_name: 'Bob',
        last_name: 'Johnson',
        grade_level: '3rd Grade',
      },
      trips: {
        title: 'Park Visit',
        trip_date: '2024-02-20',
        departure_time: '10:00 AM',
        return_time: '2:00 PM',
        estimated_cost_cents: 0, // Free trip
        experiences: {
          title: 'Nature Park Experience',
          description: 'Educational visit to the nature park',
        },
        venues: {
          name: 'Nature Park',
          address: '456 Park Ave',
          city: 'City',
          state: 'State',
        },
      },
    };

    mockSupabaseSingle.mockResolvedValue({
      data: mockSlipData,
      error: null,
    });

    render(
      <BrowserRouter>
        <PermissionSlipPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
    });

    // Check that payment notice is NOT displayed for free trips
    expect(screen.queryByText('Payment Required')).not.toBeInTheDocument();

    // Submit the form
    const form = screen.getByTestId('permission-slip-form');
    fireEvent.submit(form);

    // Wait for form submission
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/permission-slip/success?slip=slip-456&token=test-token');
    });
  });

  it('should update permission slip status correctly for paid trips', async () => {
    const mockSlipData = {
      id: 'slip-789',
      student_id: 'student-789',
      trip_id: 'trip-789',
      status: 'pending',
      magic_link_token: 'test-token',
      students: {
        first_name: 'Carol',
        last_name: 'Wilson',
        grade_level: '4th Grade',
      },
      trips: {
        title: 'Zoo Visit',
        trip_date: '2024-02-25',
        departure_time: '9:30 AM',
        return_time: '3:30 PM',
        estimated_cost_cents: 1500, // $15.00 - requires payment
        experiences: {
          title: 'Zoo Experience',
          description: 'Educational visit to the zoo',
        },
        venues: {
          name: 'City Zoo',
          address: '789 Zoo Rd',
          city: 'City',
          state: 'State',
        },
      },
    };

    mockSupabaseSingle.mockResolvedValue({
      data: mockSlipData,
      error: null,
    });

    render(
      <BrowserRouter>
        <PermissionSlipPage />
      </BrowserRouter>
    );

    // Wait for component to load and submit form
    await waitFor(() => {
      expect(screen.getByText('Field Trip Permission Slip')).toBeInTheDocument();
    });

    const form = screen.getByTestId('permission-slip-form');
    fireEvent.submit(form);

    // Verify that the permission slip was updated with correct status
    await waitFor(() => {
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({
        parent_first_name: 'John',
        parent_last_name: 'Doe',
        parent_email: 'john@example.com',
        parent_phone: '555-123-4567',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '555-987-6543',
        signature: 'data:image/png;base64,test-signature',
        signed_at: expect.any(String),
        status: 'signed_pending_payment', // Should be pending payment for paid trips
      });
    });
  });
});