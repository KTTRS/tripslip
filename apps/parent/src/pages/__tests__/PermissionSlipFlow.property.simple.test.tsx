import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import * as fc from 'fast-check';
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
        'permissionSlip.paymentRequired': 'Payment Required',
        'permissionSlip.errorTitle': 'Unable to Load Permission Slip',
        'permissionSlip.invalidLink': 'Invalid permission slip link',
        'common.loading': 'Loading...',
        'common.goHome': 'Go to Home',
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

describe('PermissionSlipPage Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Simple generators for test data
  const validSlipDataGenerator = fc.record({
    id: fc.uuid(),
    student_id: fc.uuid(),
    trip_id: fc.uuid(),
    status: fc.constantFrom('pending', 'signed', 'signed_pending_payment', 'paid'),
    magic_link_token: fc.uuid(),
    students: fc.record({
      first_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      last_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      grade_level: fc.constantFrom('K', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade'),
    }),
    trips: fc.record({
      title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      trip_date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }).map(d => d.toISOString().split('T')[0]),
      departure_time: fc.constantFrom('8:00 AM', '9:00 AM', '10:00 AM'),
      return_time: fc.constantFrom('2:00 PM', '3:00 PM', '4:00 PM'),
      estimated_cost_cents: fc.integer({ min: 0, max: 10000 }),
      experiences: fc.record({
        title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
      }),
      venues: fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        address: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        city: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        state: fc.constantFrom('CA', 'NY', 'TX', 'FL', 'IL'),
      }),
    }),
  });

  /**
   * **Validates: Requirements FR-9.1, FR-9.2, FR-9.3**
   * Property: Permission slip data should always be displayed correctly
   */
  it('should display permission slip data correctly for any valid slip data', () => {
    fc.assert(fc.property(
      validSlipDataGenerator.filter(data => data.status === 'pending'),
      (slipData) => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
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
          
          return true;
        });
      }
    ), { numRuns: 10 });
  });

  /**
   * **Validates: Requirements FR-9.8**
   * Property: Payment notice should be shown if and only if cost > 0
   */
  it('should show payment notice if and only if trip has cost', () => {
    fc.assert(fc.property(
      validSlipDataGenerator.filter(data => data.status === 'pending'),
      (slipData) => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
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
    ), { numRuns: 15 });
  });

  /**
   * **Validates: Requirements FR-9.1**
   * Property: Already processed slips should always redirect appropriately
   */
  it('should redirect correctly for already processed permission slips', () => {
    const processedStatusGenerator = fc.constantFrom('signed', 'signed_pending_payment', 'paid');

    fc.assert(fc.property(
      validSlipDataGenerator,
      processedStatusGenerator,
      (slipData, status) => {
        const processedSlipData = { ...slipData, status };
        
        mockSupabase.from().select().eq().single.mockResolvedValue({
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
    ), { numRuns: 10 });
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
        mockSupabase.from().select().eq().single.mockResolvedValue({
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
    ), { numRuns: 8 });
  });
});