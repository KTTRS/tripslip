/**
 * Property-Based Tests - Add-On Cost Calculation (Task 3.4)
 * 
 * Tests Property 13: Add-On Cost Calculation
 * For any base price and any set of selected add-ons, the total cost 
 * should always equal the base price plus the sum of all selected add-on prices.
 * 
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { AddOnSelector, AdditionalFee } from '../AddOnSelector';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
    i18n: { language: 'en' },
  }),
}));

describe('Property-Based Tests - Add-On Cost Calculation (Task 3.4)', () => {
  /**
   * Property 13: Add-On Cost Calculation
   * 
   * For any permission slip with selected add-ons, the displayed total cost 
   * should equal the base trip cost plus the sum of all selected add-on costs.
   * 
   * This property ensures accurate cost calculation regardless of the number
   * or combination of add-ons selected.
   */
  it('Property 13: Total cost equals base price plus sum of selected add-ons', () => {
    fc.assert(
      fc.property(
        // Generate base price (in cents, between $0 and $10,000)
        fc.integer({ min: 0, max: 1000000 }),
        // Generate array of add-ons (0 to 10 add-ons)
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).map((s, index) => `${s}_${index}`),
            amountCents: fc.integer({ min: 0, max: 100000 }),
            required: fc.boolean(),
          }),
          { minLength: 0, maxLength: 10 }
        ).map((addOns, index) => 
          addOns.map((addon, i) => ({ ...addon, name: `${addon.name}_${i}` }))
        ),
        (basePriceCents, addOns) => {
          // Track the total passed to onTotalChange
          let capturedTotal: number | null = null;
          let capturedSelectedAddOns: AdditionalFee[] = [];

          const onTotalChange = vi.fn((total: number, selected: AdditionalFee[]) => {
            capturedTotal = total;
            capturedSelectedAddOns = selected;
          });

          // Render component
          render(
            <AddOnSelector
              addOns={addOns}
              basePriceCents={basePriceCents}
              onTotalChange={onTotalChange}
            />
          );

          // Wait for useEffect to trigger
          expect(onTotalChange).toHaveBeenCalled();
          expect(capturedTotal).not.toBeNull();

          // Calculate expected total
          // Required add-ons are automatically selected
          const selectedAddOnAmounts = addOns
            .filter(addon => addon.required)
            .map(addon => addon.amountCents);

          const expectedTotal = basePriceCents + selectedAddOnAmounts.reduce((sum, amount) => sum + amount, 0);

          // Verify the property: total = base + sum(selected add-ons)
          expect(capturedTotal).toBe(expectedTotal);

          // Verify that only required add-ons are initially selected
          expect(capturedSelectedAddOns.length).toBe(addOns.filter(a => a.required).length);
          capturedSelectedAddOns.forEach(addon => {
            expect(addon.required).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13 (Commutativity): Order of add-ons doesn't affect total
   * 
   * The total cost should be the same regardless of the order in which
   * add-ons are provided, demonstrating that addition is commutative.
   */
  it('Property 13 (Commutativity): Add-on order does not affect total cost', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            amountCents: fc.integer({ min: 0, max: 100000 }),
            required: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (basePriceCents, addOns) => {
          let total1: number | null = null;
          let total2: number | null = null;

          const onTotalChange1 = vi.fn((total: number) => {
            total1 = total;
          });

          const onTotalChange2 = vi.fn((total: number) => {
            total2 = total;
          });

          // Render with original order
          render(
            <AddOnSelector
              addOns={addOns}
              basePriceCents={basePriceCents}
              onTotalChange={onTotalChange1}
            />
          );

          // Render with reversed order
          const reversedAddOns = [...addOns].reverse();
          render(
            <AddOnSelector
              addOns={reversedAddOns}
              basePriceCents={basePriceCents}
              onTotalChange={onTotalChange2}
            />
          );

          // Both should produce the same total
          expect(total1).toBe(total2);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 13 (Non-negativity): Total cost is never negative
   * 
   * For any valid inputs (non-negative base price and add-on amounts),
   * the total cost should always be non-negative.
   */
  it('Property 13 (Non-negativity): Total cost is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            amountCents: fc.integer({ min: 0, max: 100000 }),
            required: fc.boolean(),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (basePriceCents, addOns) => {
          let capturedTotal: number | null = null;

          const onTotalChange = vi.fn((total: number) => {
            capturedTotal = total;
          });

          render(
            <AddOnSelector
              addOns={addOns}
              basePriceCents={basePriceCents}
              onTotalChange={onTotalChange}
            />
          );

          expect(capturedTotal).not.toBeNull();
          expect(capturedTotal!).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13 (Monotonicity): Adding add-ons never decreases total
   * 
   * When add-ons are added (required or optional), the total cost should
   * never decrease - it should either stay the same or increase.
   */
  it('Property 13 (Monotonicity): Adding add-ons never decreases total cost', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            amountCents: fc.integer({ min: 0, max: 100000 }),
            required: fc.constant(false), // All optional for this test
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (basePriceCents, addOns) => {
          let totalWithoutAddOns: number | null = null;
          let totalWithAddOns: number | null = null;

          const onTotalChange1 = vi.fn((total: number) => {
            totalWithoutAddOns = total;
          });

          const onTotalChange2 = vi.fn((total: number) => {
            totalWithAddOns = total;
          });

          // Render with no add-ons
          render(
            <AddOnSelector
              addOns={[]}
              basePriceCents={basePriceCents}
              onTotalChange={onTotalChange1}
            />
          );

          // Render with add-ons (all required to ensure they're selected)
          const requiredAddOns = addOns.map(a => ({ ...a, required: true }));
          render(
            <AddOnSelector
              addOns={requiredAddOns}
              basePriceCents={basePriceCents}
              onTotalChange={onTotalChange2}
            />
          );

          // Total with add-ons should be >= total without add-ons
          expect(totalWithAddOns!).toBeGreaterThanOrEqual(totalWithoutAddOns!);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 13 (Zero base price): Works correctly with zero base price
   * 
   * When base price is zero, the total should equal the sum of selected add-ons.
   * This is an important edge case for free trips with paid add-ons.
   */
  it('Property 13 (Zero base price): Total equals sum of add-ons when base is zero', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            amountCents: fc.integer({ min: 1, max: 100000 }),
            required: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (addOns) => {
          let capturedTotal: number | null = null;

          const onTotalChange = vi.fn((total: number) => {
            capturedTotal = total;
          });

          render(
            <AddOnSelector
              addOns={addOns}
              basePriceCents={0}
              onTotalChange={onTotalChange}
            />
          );

          // Calculate expected total (only required add-ons)
          const expectedTotal = addOns
            .filter(addon => addon.required)
            .reduce((sum, addon) => sum + addon.amountCents, 0);

          expect(capturedTotal).toBe(expectedTotal);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 13 (All required): All required add-ons are included in total
   * 
   * When all add-ons are marked as required, the total should include
   * all of them, regardless of their count or amounts.
   */
  it('Property 13 (All required): Total includes all required add-ons', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            amountCents: fc.integer({ min: 0, max: 100000 }),
            required: fc.constant(true), // All required
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (basePriceCents, addOns) => {
          let capturedTotal: number | null = null;

          const onTotalChange = vi.fn((total: number) => {
            capturedTotal = total;
          });

          render(
            <AddOnSelector
              addOns={addOns}
              basePriceCents={basePriceCents}
              onTotalChange={onTotalChange}
            />
          );

          // Expected total should include all add-ons since they're all required
          const expectedTotal = basePriceCents + addOns.reduce((sum, addon) => sum + addon.amountCents, 0);

          expect(capturedTotal).toBe(expectedTotal);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 13 (No add-ons): Component renders nothing when no add-ons exist
   * 
   * When there are no add-ons, the component should return null and not render.
   * This is an important edge case for trips without any add-ons.
   */
  it('Property 13 (No add-ons): Component renders nothing when add-ons array is empty', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        (basePriceCents) => {
          const onTotalChange = vi.fn();

          const { container } = render(
            <AddOnSelector
              addOns={[]}
              basePriceCents={basePriceCents}
              onTotalChange={onTotalChange}
            />
          );

          // Component returns null when no add-ons, so nothing should be rendered
          expect(container.firstChild).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 13 (Idempotency): Multiple renders with same props produce same total
   * 
   * Rendering the component multiple times with identical props should
   * always produce the same total cost, demonstrating deterministic behavior.
   */
  it('Property 13 (Idempotency): Same inputs always produce same total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            amountCents: fc.integer({ min: 0, max: 100000 }),
            required: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (basePriceCents, addOns) => {
          const totals: number[] = [];

          // Render component 3 times with same props
          for (let i = 0; i < 3; i++) {
            let capturedTotal: number | null = null;
            
            const onTotalChange = vi.fn((total: number) => {
              // Only capture the first call (initial render)
              if (capturedTotal === null) {
                capturedTotal = total;
              }
            });

            render(
              <AddOnSelector
                addOns={addOns}
                basePriceCents={basePriceCents}
                onTotalChange={onTotalChange}
              />
            );
            
            if (capturedTotal !== null) {
              totals.push(capturedTotal);
            }
          }

          // All totals should be identical
          expect(totals.length).toBe(3);
          expect(totals[0]).toBe(totals[1]);
          expect(totals[1]).toBe(totals[2]);
        }
      ),
      { numRuns: 50 }
    );
  });
});
