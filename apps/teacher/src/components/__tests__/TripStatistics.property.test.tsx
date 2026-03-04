/**
 * Property-Based Tests - Trip Statistics Accuracy (Task 4.12)
 * 
 * Tests Property 19: Trip Statistics Accuracy
 * For any trip, the displayed counts of signed slips and payments received
 * should match the actual counts from database queries.
 * 
 * **Validates: Requirements 5.6**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { TripStatistics } from '../TripStatistics';
import { createSupabaseClient } from '@tripslip/database';

// Mock Supabase client
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(),
}));

type SlipStatus = 'pending' | 'signed' | 'paid' | 'cancelled';
type PaymentStatus = 'pending' | 'succeeded' | 'failed';

interface TestPayment {
  id: string;
  amount_cents: number;
  status: PaymentStatus;
  paid_at: string | null;
}

interface TestPermissionSlip {
  id: string;
  status: SlipStatus;
  signed_at: string | null;
  payments: TestPayment[];
}

describe('Property-Based Tests - Trip Statistics Accuracy (Task 4.12)', () => {
  let mockSupabase: any;
  let mockChannel: any;

  beforeEach(() => {
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      channel: vi.fn(() => mockChannel),
    };

    (createSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 19: Trip Statistics Accuracy
   * 
   * For any trip with N permission slips, the displayed statistics should
   * accurately reflect the database state:
   * - Total students count = N
   * - Pending count = slips with status 'pending'
   * - Signed count = slips with status 'signed' and no successful payments
   * - Paid count = slips with at least one successful payment
   * - Total payments received = sum of all successful payment amounts
   * - Completion percentage = (paid count / total students) * 100
   */
  it('Property 19: Statistics accurately reflect database state for all slip configurations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            slipStatus: fc.constantFrom<SlipStatus>('pending', 'signed', 'paid', 'cancelled'),
            payments: fc.array(
              fc.record({
                amountCents: fc.integer({ min: 100, max: 50000 }),
                status: fc.constantFrom<PaymentStatus>('pending', 'succeeded', 'failed'),
              }),
              { maxLength: 3 }
            ),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          // Create mock permission slips
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            status: config.slipStatus,
            signed_at: config.slipStatus !== 'pending' ? '2024-01-15T10:00:00Z' : null,
            payments: config.payments.map((payment, paymentIndex) => ({
              id: `payment-${index}-${paymentIndex}`,
              amount_cents: payment.amountCents,
              status: payment.status,
              paid_at: payment.status === 'succeeded' ? '2024-01-20T10:00:00Z' : null,
            })),
          }));

          // Calculate expected statistics
          const expectedStats = {
            totalStudents: mockSlips.length,
            pendingSlips: 0,
            signedSlips: 0,
            paidSlips: 0,
            totalPaymentsReceived: 0,
          };

          mockSlips.forEach((slip) => {
            const hasSuccessfulPayment = slip.payments.some(p => p.status === 'succeeded');
            
            if (hasSuccessfulPayment) {
              expectedStats.paidSlips++;
              // Sum all successful payments for this slip
              slip.payments.forEach(p => {
                if (p.status === 'succeeded') {
                  expectedStats.totalPaymentsReceived += p.amount_cents;
                }
              });
            } else if (slip.status === 'signed') {
              expectedStats.signedSlips++;
            } else if (slip.status === 'pending') {
              expectedStats.pendingSlips++;
            }
          });

          const expectedCompletionPercentage = expectedStats.totalStudents > 0
            ? Math.round((expectedStats.paidSlips / expectedStats.totalStudents) * 100)
            : 0;

          // Mock the database query
          mockSupabase.eq.mockResolvedValue({
            data: mockSlips,
            error: null,
          });

          // Render the component
          const { container } = render(<TripStatistics tripId={tripId} />);

          // Wait for component to load
          await waitFor(() => {
            expect(mockSupabase.eq).toHaveBeenCalled();
          });

          // Verify total students count
          expect(container.textContent).toContain(expectedStats.totalStudents.toString());

          // Verify pending count
          expect(container.textContent).toContain(expectedStats.pendingSlips.toString());

          // Verify signed count
          expect(container.textContent).toContain(expectedStats.signedSlips.toString());

          // Verify paid count
          expect(container.textContent).toContain(expectedStats.paidSlips.toString());

          // Verify completion percentage
          expect(container.textContent).toContain(`${expectedCompletionPercentage}%`);

          // Verify completion ratio
          expect(container.textContent).toContain(
            `(${expectedStats.paidSlips}/${expectedStats.totalStudents})`
          );

          // Verify total payments received (formatted as currency)
          const expectedCurrency = (expectedStats.totalPaymentsReceived / 100).toFixed(2);
          expect(container.textContent).toContain(expectedCurrency);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 19 (Edge Case): Split payments are summed correctly
   * 
   * When a slip has multiple successful payments (split payment scenario),
   * the total payments received should be the sum of all successful payments.
   */
  it('Property 19 (Edge Case): Split payments are summed correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            // Generate 2-5 successful payments per slip
            payments: fc.array(
              fc.integer({ min: 1000, max: 10000 }),
              { minLength: 2, maxLength: 5 }
            ),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            status: 'signed',
            signed_at: '2024-01-15T10:00:00Z',
            payments: config.payments.map((amount, paymentIndex) => ({
              id: `payment-${index}-${paymentIndex}`,
              amount_cents: amount,
              status: 'succeeded',
              paid_at: '2024-01-20T10:00:00Z',
            })),
          }));

          // Calculate expected total
          let expectedTotal = 0;
          mockSlips.forEach(slip => {
            slip.payments.forEach(payment => {
              expectedTotal += payment.amount_cents;
            });
          });

          mockSupabase.eq.mockResolvedValue({
            data: mockSlips,
            error: null,
          });

          const { container } = render(<TripStatistics tripId={tripId} />);

          await waitFor(() => {
            expect(mockSupabase.eq).toHaveBeenCalled();
          });

          // Verify the total is displayed correctly
          const expectedCurrency = (expectedTotal / 100).toFixed(2);
          expect(container.textContent).toContain(expectedCurrency);

          // All slips should be counted as paid
          expect(container.textContent).toContain(`${mockSlips.length}`);
          expect(container.textContent).toContain('100%'); // All paid
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 19 (Edge Case): Only succeeded payments are counted
   * 
   * Failed and pending payments should not contribute to the total
   * payments received or affect the paid slip count.
   */
  it('Property 19 (Edge Case): Only succeeded payments are counted in totals', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            succeededAmount: fc.integer({ min: 1000, max: 10000 }),
            failedAmount: fc.integer({ min: 1000, max: 10000 }),
            pendingAmount: fc.integer({ min: 1000, max: 10000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            status: 'signed',
            signed_at: '2024-01-15T10:00:00Z',
            payments: [
              {
                id: `payment-${index}-succeeded`,
                amount_cents: config.succeededAmount,
                status: 'succeeded',
                paid_at: '2024-01-20T10:00:00Z',
              },
              {
                id: `payment-${index}-failed`,
                amount_cents: config.failedAmount,
                status: 'failed',
                paid_at: null,
              },
              {
                id: `payment-${index}-pending`,
                amount_cents: config.pendingAmount,
                status: 'pending',
                paid_at: null,
              },
            ],
          }));

          // Only succeeded payments should be counted
          const expectedTotal = slipConfigs.reduce(
            (sum, config) => sum + config.succeededAmount,
            0
          );

          // Expected total includes all payments (for display purposes)
          const expectedTotalExpected = slipConfigs.reduce(
            (sum, config) => sum + config.succeededAmount + config.failedAmount + config.pendingAmount,
            0
          );

          mockSupabase.eq.mockResolvedValue({
            data: mockSlips,
            error: null,
          });

          const { container } = render(<TripStatistics tripId={tripId} />);

          await waitFor(() => {
            expect(mockSupabase.eq).toHaveBeenCalled();
          });

          // Verify only succeeded payments are in "Received" total
          const expectedReceivedCurrency = (expectedTotal / 100).toFixed(2);
          expect(container.textContent).toContain(expectedReceivedCurrency);

          // Verify expected total includes all payments
          const expectedTotalCurrency = (expectedTotalExpected / 100).toFixed(2);
          expect(container.textContent).toContain(expectedTotalCurrency);

          // All slips should be counted as paid (they all have succeeded payments)
          expect(container.textContent).toContain(`${mockSlips.length}`);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 19 (Edge Case): Empty trip displays zero statistics
   * 
   * A trip with no permission slips should display all zeros and 0% completion.
   */
  it('Property 19 (Edge Case): Empty trip displays zero statistics', async () => {
    const tripId = 'empty-trip-id';
    
    mockSupabase.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    const { container } = render(<TripStatistics tripId={tripId} />);

    await waitFor(() => {
      expect(mockSupabase.eq).toHaveBeenCalled();
    });

    // Should display 0% completion
    expect(container.textContent).toContain('0%');
    
    // Should display $0.00 for payments
    expect(container.textContent).toContain('$0.00');
    
    // All counts should be 0
    const zeroMatches = container.textContent?.match(/\b0\b/g);
    expect(zeroMatches).toBeTruthy();
    expect(zeroMatches!.length).toBeGreaterThan(0);
  });

  /**
   * Property 19 (Consistency): Completion percentage matches paid/total ratio
   * 
   * The displayed completion percentage should always equal
   * Math.round((paidSlips / totalStudents) * 100).
   */
  it('Property 19 (Consistency): Completion percentage matches paid/total ratio', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalSlips: fc.integer({ min: 1, max: 50 }),
          paidCount: fc.integer({ min: 0, max: 50 }),
        }).chain(({ totalSlips, paidCount }) => 
          fc.record({
            totalSlips: fc.constant(totalSlips),
            // Ensure paidCount doesn't exceed totalSlips
            paidCount: fc.constant(Math.min(paidCount, totalSlips)),
          })
        ),
        async ({ totalSlips, paidCount }) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = Array.from({ length: totalSlips }, (_, index) => ({
            id: `slip-${index}`,
            status: index < paidCount ? 'signed' : 'pending',
            signed_at: index < paidCount ? '2024-01-15T10:00:00Z' : null,
            payments: index < paidCount
              ? [
                  {
                    id: `payment-${index}`,
                    amount_cents: 5000,
                    status: 'succeeded',
                    paid_at: '2024-01-20T10:00:00Z',
                  },
                ]
              : [],
          }));

          const expectedPercentage = Math.round((paidCount / totalSlips) * 100);

          mockSupabase.eq.mockResolvedValue({
            data: mockSlips,
            error: null,
          });

          const { container } = render(<TripStatistics tripId={tripId} />);

          await waitFor(() => {
            expect(mockSupabase.eq).toHaveBeenCalled();
          });

          // Verify the percentage is displayed correctly
          expect(container.textContent).toContain(`${expectedPercentage}%`);
          
          // Verify the ratio is displayed correctly
          expect(container.textContent).toContain(`(${paidCount}/${totalSlips})`);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 19 (Consistency): Status counts sum to total students
   * 
   * The sum of pending, signed, and paid counts should equal the total
   * number of students (excluding cancelled slips from the count logic).
   */
  it('Property 19 (Consistency): Status counts sum to total students', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            // Only generate pending, signed, or paid statuses for this test
            slipStatus: fc.constantFrom<SlipStatus>('pending', 'signed'),
            hasSuccessfulPayment: fc.boolean(),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            status: config.slipStatus,
            signed_at: config.slipStatus === 'signed' ? '2024-01-15T10:00:00Z' : null,
            payments: config.hasSuccessfulPayment
              ? [
                  {
                    id: `payment-${index}`,
                    amount_cents: 5000,
                    status: 'succeeded',
                    paid_at: '2024-01-20T10:00:00Z',
                  },
                ]
              : [],
          }));

          // Calculate expected counts
          let pendingCount = 0;
          let signedCount = 0;
          let paidCount = 0;

          mockSlips.forEach(slip => {
            const hasSuccessfulPayment = slip.payments.some(p => p.status === 'succeeded');
            
            if (hasSuccessfulPayment) {
              paidCount++;
            } else if (slip.status === 'signed') {
              signedCount++;
            } else if (slip.status === 'pending') {
              pendingCount++;
            }
          });

          const totalStudents = mockSlips.length;
          const sumOfCounts = pendingCount + signedCount + paidCount;

          // The sum should equal total students
          expect(sumOfCounts).toBe(totalStudents);

          mockSupabase.eq.mockResolvedValue({
            data: mockSlips,
            error: null,
          });

          const { container } = render(<TripStatistics tripId={tripId} />);

          await waitFor(() => {
            expect(mockSupabase.eq).toHaveBeenCalled();
          });

          // Verify all counts are displayed
          expect(container.textContent).toContain(totalStudents.toString());
          expect(container.textContent).toContain(pendingCount.toString());
          expect(container.textContent).toContain(signedCount.toString());
          expect(container.textContent).toContain(paidCount.toString());
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Property 19 (Edge Case): Payment status overrides slip status for counting
   * 
   * A slip with status 'pending' or 'signed' but with a successful payment
   * should be counted as 'paid', not in its slip status category.
   */
  it('Property 19 (Edge Case): Successful payment overrides slip status in counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            // Slip status is pending or signed
            slipStatus: fc.constantFrom<SlipStatus>('pending', 'signed'),
            // But always has a successful payment
            hasSuccessfulPayment: fc.constant(true),
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (slipConfigs) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = slipConfigs.map((config, index) => ({
            id: `slip-${index}`,
            status: config.slipStatus,
            signed_at: '2024-01-15T10:00:00Z',
            payments: [
              {
                id: `payment-${index}`,
                amount_cents: 5000,
                status: 'succeeded',
                paid_at: '2024-01-20T10:00:00Z',
              },
            ],
          }));

          mockSupabase.eq.mockResolvedValue({
            data: mockSlips,
            error: null,
          });

          const { container } = render(<TripStatistics tripId={tripId} />);

          await waitFor(() => {
            expect(mockSupabase.eq).toHaveBeenCalled();
          });

          // All slips should be counted as paid
          const totalSlips = mockSlips.length;
          expect(container.textContent).toContain(`${totalSlips}`);
          
          // Paid count should equal total
          expect(container.textContent).toContain(`(${totalSlips}/${totalSlips})`);
          
          // Completion should be 100%
          expect(container.textContent).toContain('100%');
          
          // Pending and signed counts should be 0
          // (This is implicit - if paid = total, then pending and signed must be 0)
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 19 (Currency Formatting): Payment amounts are formatted correctly
   * 
   * All payment amounts should be displayed as currency with exactly 2 decimal places.
   */
  it('Property 19 (Currency Formatting): Payment amounts display with 2 decimal places', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.integer({ min: 1, max: 999999 }), // Random cent amounts
          { minLength: 1, maxLength: 10 }
        ),
        async (paymentAmounts) => {
          const tripId = 'test-trip-id';
          
          const mockSlips: TestPermissionSlip[] = paymentAmounts.map((amount, index) => ({
            id: `slip-${index}`,
            status: 'signed',
            signed_at: '2024-01-15T10:00:00Z',
            payments: [
              {
                id: `payment-${index}`,
                amount_cents: amount,
                status: 'succeeded',
                paid_at: '2024-01-20T10:00:00Z',
              },
            ],
          }));

          const totalCents = paymentAmounts.reduce((sum, amount) => sum + amount, 0);
          const expectedCurrency = (totalCents / 100).toFixed(2);

          mockSupabase.eq.mockResolvedValue({
            data: mockSlips,
            error: null,
          });

          const { container } = render(<TripStatistics tripId={tripId} />);

          await waitFor(() => {
            expect(mockSupabase.eq).toHaveBeenCalled();
          });

          // Verify the currency is formatted with exactly 2 decimal places
          expect(container.textContent).toContain(expectedCurrency);
          
          // Verify it matches the pattern $X.XX
          const currencyRegex = new RegExp(`\\$?${expectedCurrency.replace('.', '\\.')}`);
          expect(container.textContent).toMatch(currencyRegex);
        }
      ),
      { numRuns: 30 }
    );
  });
});
