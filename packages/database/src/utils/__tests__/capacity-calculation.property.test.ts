/**
 * Property-Based Tests - Capacity Calculation (Task 6.7)
 * 
 * Tests Property 22: Capacity Calculation
 * 
 * **Validates: Requirements 6.9**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateCapacity,
  wouldExceedCapacity,
  getCapacityWarning,
} from '../capacity-utils';

describe('Property-Based Tests - Capacity Calculation (Task 6.7)', () => {
  it('Property 22: Remaining capacity equals total capacity minus booked count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 500 }), // totalCapacity
        fc.integer({ min: 0, max: 500 }), // bookedCount
        async (totalCapacity, bookedCount) => {
          // Ensure bookedCount doesn't exceed totalCapacity for valid test cases
          const validBookedCount = Math.min(bookedCount, totalCapacity);
          
          const result = calculateCapacity(totalCapacity, validBookedCount);
          
          // Core property: remaining = total - booked
          expect(result.remainingCapacity).toBe(totalCapacity - validBookedCount);
          expect(result.totalCapacity).toBe(totalCapacity);
          expect(result.bookedCount).toBe(validBookedCount);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('Property 22: Remaining capacity is never negative', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 500 }), // totalCapacity
        fc.integer({ min: 0, max: 1000 }), // bookedCount (can exceed capacity)
        async (totalCapacity, bookedCount) => {
          const result = calculateCapacity(totalCapacity, bookedCount);
          
          // Remaining capacity should never be negative
          expect(result.remainingCapacity).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('Property 22: Percentage booked is calculated correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 500 }), // totalCapacity
        fc.integer({ min: 0, max: 500 }), // bookedCount
        async (totalCapacity, bookedCount) => {
          const validBookedCount = Math.min(bookedCount, totalCapacity);
          
          const result = calculateCapacity(totalCapacity, validBookedCount);
          
          const expectedPercentage = (validBookedCount / totalCapacity) * 100;
          expect(result.percentageBooked).toBeCloseTo(expectedPercentage, 2);
          expect(result.percentageBooked).toBeGreaterThanOrEqual(0);
          expect(result.percentageBooked).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('Property 22: Overbooking is prevented - wouldExceedCapacity returns true when booking would exceed capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 500 }), // totalCapacity
        fc.integer({ min: 0, max: 500 }), // currentBookedCount
        fc.integer({ min: 1, max: 100 }), // requestedCount
        async (totalCapacity, currentBookedCount, requestedCount) => {
          const validCurrentBooked = Math.min(currentBookedCount, totalCapacity);
          
          const wouldExceed = wouldExceedCapacity(
            totalCapacity,
            validCurrentBooked,
            requestedCount
          );
          
          const expectedExceed = (validCurrentBooked + requestedCount) > totalCapacity;
          expect(wouldExceed).toBe(expectedExceed);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('Property 22: Low availability warning is triggered at 80% capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 500 }), // totalCapacity (min 10 for meaningful percentages)
        async (totalCapacity) => {
          // Test at exactly 80% capacity - use ceil to ensure we're at or above 80%
          const bookedAt80Percent = Math.ceil(totalCapacity * 0.8);
          const result = calculateCapacity(totalCapacity, bookedAt80Percent);
          
          // Verify the percentage is actually >= 80%
          expect(result.percentageBooked).toBeGreaterThanOrEqual(80);
          expect(result.isLowAvailability).toBe(true);
          expect(getCapacityWarning(result)).toContain('spots remaining');
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('Property 22: Fully booked status is set when remaining capacity is zero', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 500 }), // totalCapacity
        async (totalCapacity) => {
          // Book to full capacity
          const result = calculateCapacity(totalCapacity, totalCapacity);
          
          expect(result.isFullyBooked).toBe(true);
          expect(result.remainingCapacity).toBe(0);
          expect(getCapacityWarning(result)).toBe('This experience is fully booked');
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('Property 22: No warning when capacity is below 80%', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 500 }), // totalCapacity
        async (totalCapacity) => {
          // Book to 50% capacity (well below 80%)
          const bookedAt50Percent = Math.floor(totalCapacity * 0.5);
          const result = calculateCapacity(totalCapacity, bookedAt50Percent);
          
          expect(result.isLowAvailability).toBe(false);
          expect(result.isFullyBooked).toBe(false);
          expect(getCapacityWarning(result)).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('Property 22: Capacity calculation is deterministic and consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 500 }), // totalCapacity
        fc.integer({ min: 0, max: 500 }), // bookedCount
        async (totalCapacity, bookedCount) => {
          const validBookedCount = Math.min(bookedCount, totalCapacity);
          
          // Calculate twice with same inputs
          const result1 = calculateCapacity(totalCapacity, validBookedCount);
          const result2 = calculateCapacity(totalCapacity, validBookedCount);
          
          // Results should be identical
          expect(result1).toEqual(result2);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('Property 22: Edge case - zero capacity always results in fully booked', async () => {
    const result = calculateCapacity(0, 0);
    
    expect(result.totalCapacity).toBe(0);
    expect(result.bookedCount).toBe(0);
    expect(result.remainingCapacity).toBe(0);
    expect(result.isFullyBooked).toBe(true);
  });

  it('Property 22: Edge case - booking count exceeding capacity is handled gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // totalCapacity
        fc.integer({ min: 101, max: 500 }), // bookedCount (exceeds capacity)
        async (totalCapacity, bookedCount) => {
          const result = calculateCapacity(totalCapacity, bookedCount);
          
          // Should handle gracefully with zero remaining
          expect(result.remainingCapacity).toBe(0);
          expect(result.isFullyBooked).toBe(true);
          expect(result.percentageBooked).toBeGreaterThan(100);
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);
});
