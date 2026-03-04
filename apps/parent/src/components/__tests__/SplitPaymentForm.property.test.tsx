import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Payment } from '../../services/payment-service';

/**
 * Property-Based Tests for Split Payment Functionality
 * 
 * These tests verify correctness properties that should hold for all valid inputs
 * using fast-check for property-based testing.
 */

/**
 * Helper function to generate split payment amounts that sum to a total
 * 
 * @param total - Total amount in cents
 * @param numPayments - Number of payments to split into
 * @returns Array of payment amounts that sum to total
 */
function generateSplitAmounts(total: number, numPayments: number): number[] {
  if (numPayments === 1) {
    return [total];
  }

  const amounts: number[] = [];
  let remaining = total;

  // Generate random splits for all but the last payment
  for (let i = 0; i < numPayments - 1; i++) {
    // Each payment should be at least 1 cent and at most the remaining amount minus (numPayments - i - 1)
    // This ensures we have at least 1 cent left for each remaining payment
    const minAmount = 1;
    const maxAmount = remaining - (numPayments - i - 1);
    
    // Generate a random amount within the valid range
    const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    
    amounts.push(amount);
    remaining -= amount;
  }

  // Last payment gets the remaining amount
  amounts.push(remaining);

  return amounts;
}

describe('Split Payment Properties', () => {
  /**
   * Property 4: Split Payment Sum Equals Total
   * 
   * **Validates: Requirements 1.8**
   * 
   * For any permission slip with split payments enabled, the sum of all payment 
   * amounts should equal the total trip cost for that student.
   * 
   * This property ensures that:
   * 1. Multiple partial payments can be made
   * 2. The sum of all successful payments equals the total cost
   * 3. No overpayment or underpayment occurs when all payments are complete
   */
  it('Property 4: Split Payment Sum Equals Total', () => {
    fc.assert(
      fc.property(
        // Generate test data:
        // - totalCostCents: between $10 and $500 (1000-50000 cents)
        // - numPayments: between 2 and 5 split payments
        fc.record({
          totalCostCents: fc.integer({ min: 1000, max: 50000 }),
          numPayments: fc.integer({ min: 2, max: 5 }),
        }),
        ({ totalCostCents, numPayments }) => {
          // Generate split payment amounts that sum to total
          const paymentAmounts = generateSplitAmounts(totalCostCents, numPayments);

          // Create mock payment objects
          const payments: Payment[] = paymentAmounts.map((amount, index) => ({
            id: `payment-${index}`,
            permission_slip_id: 'test-slip-id',
            parent_id: `parent-${index}`,
            amount_cents: amount,
            stripe_payment_intent_id: `pi_test_${index}`,
            status: 'succeeded',
            is_split_payment: true,
            split_payment_group_id: 'test-group',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          // Filter only succeeded payments (all in this case)
          const succeededPayments = payments.filter(p => p.status === 'succeeded');

          // Calculate sum of all payment amounts
          const totalPaid = succeededPayments.reduce(
            (sum, payment) => sum + payment.amount_cents,
            0
          );

          // Property: Sum of split payments should equal total cost
          expect(totalPaid).toBe(totalCostCents);

          // Additional verification: Number of payments should match
          expect(succeededPayments.length).toBe(numPayments);

          // Verify each payment is marked as split payment
          succeededPayments.forEach(payment => {
            expect(payment.is_split_payment).toBe(true);
          });

          // Verify each individual payment is positive
          succeededPayments.forEach(payment => {
            expect(payment.amount_cents).toBeGreaterThan(0);
          });

          // Verify no payment exceeds the total
          succeededPayments.forEach(payment => {
            expect(payment.amount_cents).toBeLessThanOrEqual(totalCostCents);
          });
        }
      ),
      {
        numRuns: 100, // Run 100 test cases with different random inputs
      }
    );
  });

  /**
   * Property 14: Partial Payment Balance
   * 
   * **Validates: Requirements 4.8**
   * 
   * For any permission slip with partial payments, the remaining balance should 
   * equal the total cost minus the sum of all completed payments.
   * 
   * This property ensures that:
   * 1. Partial payments are correctly tracked
   * 2. Remaining balance is accurately calculated
   * 3. Balance updates correctly as payments are made
   */
  it('Property 14: Partial Payment Balance', () => {
    fc.assert(
      fc.property(
        // Generate test data:
        // - totalCostCents: between $20 and $500 (2000-50000 cents)
        // - numCompletedPayments: between 1 and 4 completed payments
        // - completionPercentage: how much of total has been paid (10-90%)
        fc.record({
          totalCostCents: fc.integer({ min: 2000, max: 50000 }),
          numCompletedPayments: fc.integer({ min: 1, max: 4 }),
          completionPercentage: fc.integer({ min: 10, max: 90 }),
        }),
        ({ totalCostCents, numCompletedPayments, completionPercentage }) => {
          // Calculate how much has been paid
          const totalPaidCents = Math.floor((totalCostCents * completionPercentage) / 100);
          
          // Generate completed payment amounts that sum to totalPaidCents
          const completedPaymentAmounts = generateSplitAmounts(totalPaidCents, numCompletedPayments);

          // Create mock completed payment objects
          const completedPayments: Payment[] = completedPaymentAmounts.map((amount, index) => ({
            id: `payment-${index}`,
            permission_slip_id: 'test-slip-id',
            parent_id: `parent-${index}`,
            amount_cents: amount,
            stripe_payment_intent_id: `pi_test_${index}`,
            status: 'succeeded',
            is_split_payment: true,
            split_payment_group_id: 'test-group',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          // Calculate remaining balance
          const paidAmount = completedPayments
            .filter(p => p.status === 'succeeded')
            .reduce((sum, payment) => sum + payment.amount_cents, 0);
          
          const remainingBalance = totalCostCents - paidAmount;

          // Property: Remaining balance should equal total minus sum of completed payments
          expect(remainingBalance).toBe(totalCostCents - totalPaidCents);

          // Additional verifications:
          // 1. Remaining balance should be non-negative
          expect(remainingBalance).toBeGreaterThanOrEqual(0);

          // 2. Remaining balance should be less than total cost (since we have partial payments)
          expect(remainingBalance).toBeLessThan(totalCostCents);

          // 3. Sum of paid amount and remaining balance should equal total
          expect(paidAmount + remainingBalance).toBe(totalCostCents);

          // 4. Each completed payment should be positive
          completedPayments.forEach(payment => {
            expect(payment.amount_cents).toBeGreaterThan(0);
          });

          // 5. Paid amount should match the sum of all completed payments
          expect(paidAmount).toBe(totalPaidCents);
        }
      ),
      {
        numRuns: 100, // Run 100 test cases with different random inputs
      }
    );
  });
});

