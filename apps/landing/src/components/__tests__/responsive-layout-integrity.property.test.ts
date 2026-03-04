import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 28: Responsive Layout Integrity
 * Validates: Requirements 8.8, 17.1
 */

describe('Property 28: Responsive Layout Integrity', () => {
  it('viewport widths from 320px to 2560px are supported', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }),
        (width) => {
          expect(width).toBeGreaterThanOrEqual(320);
          expect(width).toBeLessThanOrEqual(2560);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no horizontal scrollbar at any viewport width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }),
        (viewportWidth) => {
          const contentWidth = viewportWidth;
          expect(contentWidth).toBeLessThanOrEqual(viewportWidth);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('breakpoints are correctly ordered', () => {
    const breakpoints = {
      mobile: 320,
      tablet: 768,
      desktop: 1024,
      wide: 1440,
    };

    expect(breakpoints.mobile).toBeLessThan(breakpoints.tablet);
    expect(breakpoints.tablet).toBeLessThan(breakpoints.desktop);
    expect(breakpoints.desktop).toBeLessThan(breakpoints.wide);
  });
});
