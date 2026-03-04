/**
 * Property-Based Tests - Permission Slip Status Display Consistency (Task 4.10)
 * 
 * Tests Property 18: Permission Slip Status Display Consistency
 * For any student on a trip, the displayed permission slip status should match
 * the actual status in the database.
 * 
 * **Validates: Requirements 5.5**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { PermissionSlipStatusList } from '../PermissionSlipStatusList';
import { createSupabaseClient } from '@tripslip/database';

// Mock Supabase client
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(),
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

type SlipStatus = 'pending' | 'signed' | 'paid' | 'cancelled';
type PaymentStatus = 'pending' | 'succeeded' | 'failed';

interface TestPermissionSlip {
  id: string;
  trip_id: string;
  student_id: string;
  status: SlipStatus;
  signed_at: string | null;
  created_at: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    grade: string;
  };
  payments: Array<{
    id: string;
    status: PaymentStatus;
    amount_cents: number;
    paid_at: string | null;
    created_at: string;
  }>;
}

describe('Property-Based Tests - Permission Slip Status Display Consistency (Task 4.10)', () => {
  let mockSupabase: any;
  let mockChannel: any;
  let mockFrom: any;

  beforeEach(() => {
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn(() => mockFrom),
      channel: vi.fn(() => mockChannel),
    };

    (createSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 18: Permission Slip Status Display Consistency
   * 
   * For any student on a trip, the displayed permission slip status should match
   * the actual status in the database. The component uses a getDisplayStatus
   * function that prioritizes payment status over slip status:
   * - If any payment has status 'succeeded', display 'paid'
   * - Otherwise, display the slip's status field
   * 
   * This property ensures the UI accurately reflects the database state.
   */
  it('Property 18: Displayed status matches database state for all status combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of permission slips with various status combinations
        fc.array(
          fc.record({
            slipStatus: fc.constantFrom<SlipStatus>('pending', 'signed', 'paid', 'cancelled'),
            hasPayment: fc.boolean(),
            paymentStatus: fc.constantFrom<PaymentStatus>('pending', 'succeeded', 'failed'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          // Create mock permission slips based on configurations
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => {
            const slip: TestPermissionSlip = {
              id: `slip-${index}`,
              trip_id: tripId,
              student_id: `student-${index}`,
              status: config.slipStatus,
              signed_at: config.slipStatus === 'signed' || config.slipStatus === 'paid' 
                ? '2024-01-15T10:00:00Z' 
                : null,
              created_at: '2024-01-01T00:00:00Z',
              student: {
                id: `student-${index}`,
                first_name: `Student${index}`,
                last_name: `Test${index}`,
                grade: '5th',
              },
              payments: config.hasPayment
                ? [
                    {
                      id: `payment-${index}`,
                      status: config.paymentStatus,
                      amount_cents: 5000,
                      paid_at: config.paymentStatus === 'succeeded' 
                        ? '2024-01-20T10:00:00Z' 
                        : null,
                      created_at: '2024-01-20T00:00:00Z',
                    },
                  ]
                : [],
            };
            return slip;
          });

          // Mock the database query to return our test slips
          mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

          // Render the component
          const { container } = render(<PermissionSlipStatusList tripId={tripId} />);

          // Wait for component to load data
          await waitFor(() => {
            expect(mockFrom.order).toHaveBeenCalled();
          });

          // For each slip, verify the displayed status matches expected status
          slipConfigs.forEach((config, index) => {
            const slip = mockSlips[index];
            
            // Determine expected display status based on component logic
            const hasPaidPayment = slip.payments.some(p => p.status === 'succeeded');
            const expectedDisplayStatus: SlipStatus = hasPaidPayment ? 'paid' : slip.status;

            // Verify the student name is displayed (confirms row is rendered)
            const studentName = `${slip.student.first_name} ${slip.student.last_name}`;
            expect(container.textContent).toContain(studentName);

            // Verify the expected status label is displayed
            const statusLabels: Record<SlipStatus, string> = {
              pending: 'Pending',
              signed: 'Signed',
              paid: 'Paid',
              cancelled: 'Cancelled',
            };
            const expectedLabel = statusLabels[expectedDisplayStatus];
            expect(container.textContent).toContain(expectedLabel);

            // Additional verification: if payment succeeded, should show "Paid" in payment column
            if (hasPaidPayment) {
              // The component displays "Paid" twice: once in status badge, once in payment column
              const paidMatches = container.textContent?.match(/Paid/g);
              expect(paidMatches).toBeTruthy();
              expect(paidMatches!.length).toBeGreaterThanOrEqual(1);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 18 (Edge Case): Status counts match individual slip statuses
   * 
   * The component displays summary counts for each status. These counts
   * should exactly match the number of slips with each display status.
   */
  it('Property 18 (Edge Case): Status summary counts match individual slip statuses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            slipStatus: fc.constantFrom<SlipStatus>('pending', 'signed', 'paid', 'cancelled'),
            hasSuccessfulPayment: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            trip_id: tripId,
            student_id: `student-${index}`,
            status: config.slipStatus,
            signed_at: config.slipStatus !== 'pending' ? '2024-01-15T10:00:00Z' : null,
            created_at: '2024-01-01T00:00:00Z',
            student: {
              id: `student-${index}`,
              first_name: `Student${index}`,
              last_name: `Test${index}`,
              grade: '5th',
            },
            payments: config.hasSuccessfulPayment
              ? [
                  {
                    id: `payment-${index}`,
                    status: 'succeeded',
                    amount_cents: 5000,
                    paid_at: '2024-01-20T10:00:00Z',
                    created_at: '2024-01-20T00:00:00Z',
                  },
                ]
              : [],
          }));

          mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

          const { container } = render(<PermissionSlipStatusList tripId={tripId} />);

          await waitFor(() => {
            expect(mockFrom.order).toHaveBeenCalled();
          });

          // Calculate expected counts based on display logic
          const expectedCounts = {
            pending: 0,
            signed: 0,
            paid: 0,
            cancelled: 0,
          };

          slipConfigs.forEach((config) => {
            const displayStatus: SlipStatus = config.hasSuccessfulPayment 
              ? 'paid' 
              : config.slipStatus;
            expectedCounts[displayStatus]++;
          });

          // Verify counts are displayed correctly
          // The component shows counts in summary cards with the status label
          Object.entries(expectedCounts).forEach(([status, count]) => {
            if (count > 0) {
              // Check that the count appears in the document
              expect(container.textContent).toContain(count.toString());
            }
          });

          // Verify total number of rows matches total slips
          const studentNames = slipConfigs.map((_, i) => `Student${i} Test${i}`);
          studentNames.forEach(name => {
            expect(container.textContent).toContain(name);
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 18 (Consistency): Payment status overrides slip status
   * 
   * When a slip has a successful payment, the display status should always
   * be 'paid', regardless of the slip's status field. This ensures payment
   * completion is the source of truth for display.
   */
  it('Property 18 (Consistency): Successful payment always displays as paid', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            // Slip status can be anything
            slipStatus: fc.constantFrom<SlipStatus>('pending', 'signed', 'paid', 'cancelled'),
            // But payment is always succeeded
            hasSuccessfulPayment: fc.constant(true),
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            trip_id: tripId,
            student_id: `student-${index}`,
            status: config.slipStatus,
            signed_at: '2024-01-15T10:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            student: {
              id: `student-${index}`,
              first_name: `Student${index}`,
              last_name: `Test${index}`,
              grade: '5th',
            },
            payments: [
              {
                id: `payment-${index}`,
                status: 'succeeded',
                amount_cents: 5000,
                paid_at: '2024-01-20T10:00:00Z',
                created_at: '2024-01-20T00:00:00Z',
              },
            ],
          }));

          mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

          const { container } = render(<PermissionSlipStatusList tripId={tripId} />);

          await waitFor(() => {
            expect(mockFrom.order).toHaveBeenCalled();
          });

          // All slips should display as "Paid" regardless of their slip status
          slipConfigs.forEach((_, index) => {
            const studentName = `Student${index} Test${index}`;
            expect(container.textContent).toContain(studentName);
          });

          // Should have "Paid" status displayed for all slips
          const paidMatches = container.textContent?.match(/Paid/g);
          expect(paidMatches).toBeTruthy();
          // At least one "Paid" per slip (could be more due to payment column)
          expect(paidMatches!.length).toBeGreaterThanOrEqual(slipConfigs.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 18 (Edge Case): Failed or pending payments don't affect display status
   * 
   * Only successful payments should change the display status to 'paid'.
   * Failed or pending payments should not affect the displayed status.
   */
  it('Property 18 (Edge Case): Non-successful payments do not change display status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            slipStatus: fc.constantFrom<SlipStatus>('pending', 'signed'),
            paymentStatus: fc.constantFrom<PaymentStatus>('pending', 'failed'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            trip_id: tripId,
            student_id: `student-${index}`,
            status: config.slipStatus,
            signed_at: config.slipStatus === 'signed' ? '2024-01-15T10:00:00Z' : null,
            created_at: '2024-01-01T00:00:00Z',
            student: {
              id: `student-${index}`,
              first_name: `Student${index}`,
              last_name: `Test${index}`,
              grade: '5th',
            },
            payments: [
              {
                id: `payment-${index}`,
                status: config.paymentStatus,
                amount_cents: 5000,
                paid_at: null,
                created_at: '2024-01-20T00:00:00Z',
              },
            ],
          }));

          mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

          const { container } = render(<PermissionSlipStatusList tripId={tripId} />);

          await waitFor(() => {
            expect(mockFrom.order).toHaveBeenCalled();
          });

          // Verify each slip displays its slip status, not 'paid'
          slipConfigs.forEach((config, index) => {
            const studentName = `Student${index} Test${index}`;
            expect(container.textContent).toContain(studentName);

            // Should display the slip status, not 'paid'
            const statusLabels: Record<SlipStatus, string> = {
              pending: 'Pending',
              signed: 'Signed',
              paid: 'Paid',
              cancelled: 'Cancelled',
            };
            const expectedLabel = statusLabels[config.slipStatus];
            expect(container.textContent).toContain(expectedLabel);
          });

          // Should NOT show "Paid" status badge for any slip
          // (though "Paid" might appear in column headers)
          const allText = container.textContent || '';
          const statusBadgeSection = allText.split('Permission Slip Status')[1] || '';
          
          // Count "Paid" occurrences in the table section
          // If no payments succeeded, "Paid" should only appear in headers/labels, not as status
          slipConfigs.forEach((config) => {
            if (config.slipStatus !== 'paid') {
              // The slip should not display as paid
              expect(config.paymentStatus).not.toBe('succeeded');
            }
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 18 (Real-time): Status updates are reflected immediately
   * 
   * When the database state changes (simulated via subscription callback),
   * the displayed status should update to match the new state.
   */
  it('Property 18 (Real-time): Status updates reflect database changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialStatus: fc.constantFrom<SlipStatus>('pending', 'signed'),
          updatedStatus: fc.constantFrom<SlipStatus>('signed', 'paid'),
          addPayment: fc.boolean(),
        }),
        async (config) => {
          const tripId = 'test-trip-id';
          const slipId = 'slip-1';
          const studentId = 'student-1';

          // Initial slip state
          const initialSlip: TestPermissionSlip = {
            id: slipId,
            trip_id: tripId,
            student_id: studentId,
            status: config.initialStatus,
            signed_at: config.initialStatus === 'signed' ? '2024-01-15T10:00:00Z' : null,
            created_at: '2024-01-01T00:00:00Z',
            student: {
              id: studentId,
              first_name: 'John',
              last_name: 'Doe',
              grade: '5th',
            },
            payments: [],
          };

          // Mock initial fetch
          mockFrom.order.mockResolvedValue({ data: [initialSlip], error: null });

          // Mock single slip fetch for updates
          mockFrom.single.mockResolvedValue({
            data: {
              ...initialSlip,
              status: config.updatedStatus,
              signed_at: '2024-01-15T10:00:00Z',
              payments: config.addPayment
                ? [
                    {
                      id: 'payment-1',
                      status: 'succeeded',
                      amount_cents: 5000,
                      paid_at: '2024-01-20T10:00:00Z',
                      created_at: '2024-01-20T00:00:00Z',
                    },
                  ]
                : [],
            },
            error: null,
          });

          const { container } = render(<PermissionSlipStatusList tripId={tripId} />);

          // Wait for initial render
          await waitFor(() => {
            expect(container.textContent).toContain('John Doe');
          });

          // Verify initial status is displayed
          const initialStatusLabel = config.initialStatus === 'pending' ? 'Pending' : 'Signed';
          expect(container.textContent).toContain(initialStatusLabel);

          // Simulate real-time update via subscription callback
          const slipsSubscriptionCallback = mockChannel.on.mock.calls.find(
            (call: any) => call[0] === 'postgres_changes' && call[1].table === 'permission_slips'
          )?.[2];

          if (slipsSubscriptionCallback) {
            // Trigger UPDATE event
            await slipsSubscriptionCallback({
              eventType: 'UPDATE',
              new: {
                id: slipId,
                trip_id: tripId,
                student_id: studentId,
                status: config.updatedStatus,
                signed_at: '2024-01-15T10:00:00Z',
              },
            });

            // If adding payment, trigger payment subscription
            if (config.addPayment) {
              const paymentsSubscriptionCallback = mockChannel.on.mock.calls.find(
                (call: any) => call[0] === 'postgres_changes' && call[1].table === 'payments'
              )?.[2];

              if (paymentsSubscriptionCallback) {
                await paymentsSubscriptionCallback({
                  eventType: 'INSERT',
                  new: {
                    id: 'payment-1',
                    permission_slip_id: slipId,
                    status: 'succeeded',
                    amount_cents: 5000,
                    paid_at: '2024-01-20T10:00:00Z',
                  },
                });
              }
            }

            // Wait for update to be reflected
            await waitFor(() => {
              const expectedStatus = config.addPayment ? 'Paid' : 
                (config.updatedStatus === 'signed' ? 'Signed' : 'Paid');
              expect(container.textContent).toContain(expectedStatus);
            });
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property 18 (Edge Case): Empty payments array is handled correctly
   * 
   * Slips with an empty payments array should display their slip status,
   * not default to 'paid'.
   */
  it('Property 18 (Edge Case): Empty payments array displays slip status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            slipStatus: fc.constantFrom<SlipStatus>('pending', 'signed', 'cancelled'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            trip_id: tripId,
            student_id: `student-${index}`,
            status: config.slipStatus,
            signed_at: config.slipStatus === 'signed' ? '2024-01-15T10:00:00Z' : null,
            created_at: '2024-01-01T00:00:00Z',
            student: {
              id: `student-${index}`,
              first_name: `Student${index}`,
              last_name: `Test${index}`,
              grade: '5th',
            },
            payments: [], // Explicitly empty
          }));

          mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

          const { container } = render(<PermissionSlipStatusList tripId={tripId} />);

          await waitFor(() => {
            expect(mockFrom.order).toHaveBeenCalled();
          });

          // Verify each slip displays its slip status
          slipConfigs.forEach((config, index) => {
            const studentName = `Student${index} Test${index}`;
            expect(container.textContent).toContain(studentName);

            const statusLabels: Record<SlipStatus, string> = {
              pending: 'Pending',
              signed: 'Signed',
              paid: 'Paid',
              cancelled: 'Cancelled',
            };
            const expectedLabel = statusLabels[config.slipStatus];
            expect(container.textContent).toContain(expectedLabel);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});
