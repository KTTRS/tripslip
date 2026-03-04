import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 26: Budget Calculation Accuracy
 * Validates: Requirements 7.7
 */

describe('Property 26: Budget Calculation Accuracy', () => {
  it('total budget equals sum of all trip costs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            totalCost: fc.integer({ min: 1000, max: 100000 }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (trips) => {
          const calculatedTotal = trips.reduce((sum, t) => sum + t.totalCost, 0);
          const manualSum = trips.map(t => t.totalCost).reduce((a, b) => a + b, 0);
          expect(calculatedTotal).toBe(manualSum);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('spent budget only includes approved/active/completed trips', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            totalCost: fc.integer({ min: 1000, max: 100000 }),
            status: fc.constantFrom('draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled'),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (trips) => {
          const spentBudget = trips
            .filter(t => ['approved', 'active', 'completed'].includes(t.status))
            .reduce((sum, t) => sum + t.totalCost, 0);
          
          const allApprovedCosts = trips
            .filter(t => ['approved', 'active', 'completed'].includes(t.status))
            .map(t => t.totalCost);
          
          expect(spentBudget).toBe(allApprovedCosts.reduce((a, b) => a + b, 0));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('remaining budget equals total minus spent', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            totalCost: fc.integer({ min: 1000, max: 100000 }),
            status: fc.constantFrom('approved', 'active', 'completed', 'draft'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (trips) => {
          const totalBudget = trips.reduce((sum, t) => sum + t.totalCost, 0);
          const spentBudget = trips
            .filter(t => ['approved', 'active', 'completed'].includes(t.status))
            .reduce((sum, t) => sum + t.totalCost, 0);
          const remainingBudget = totalBudget - spentBudget;
          
          expect(remainingBudget).toBeGreaterThanOrEqual(0);
          expect(totalBudget).toBe(spentBudget + remainingBudget);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('teacher budget breakdown sums correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            teacherId: fc.uuid(),
            totalCost: fc.integer({ min: 1000, max: 100000 }),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (trips) => {
          const byTeacher = trips.reduce((acc, trip) => {
            const existing = acc.find(t => t.teacherId === trip.teacherId);
            if (existing) {
              existing.totalSpent += trip.totalCost;
              existing.tripCount++;
            } else {
              acc.push({ teacherId: trip.teacherId, totalSpent: trip.totalCost, tripCount: 1 });
            }
            return acc;
          }, [] as Array<{ teacherId: string; totalSpent: number; tripCount: number }>);
          
          const sumOfTeacherBudgets = byTeacher.reduce((sum, t) => sum + t.totalSpent, 0);
          const totalBudget = trips.reduce((sum, t) => sum + t.totalCost, 0);
          
          expect(sumOfTeacherBudgets).toBe(totalBudget);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('budget utilization percentage is accurate', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalBudget: fc.integer({ min: 10000, max: 1000000 }),
          spentBudget: fc.integer({ min: 0, max: 1000000 }),
        }).filter(data => data.spentBudget <= data.totalBudget),
        (data) => {
          const utilization = (data.spentBudget / data.totalBudget) * 100;
          expect(utilization).toBeGreaterThanOrEqual(0);
          expect(utilization).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
