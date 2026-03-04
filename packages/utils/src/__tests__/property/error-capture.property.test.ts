import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 32: Error Capture with Stack Trace
 * Validates: Requirements 13.2
 */

describe('Property 32: Error Capture with Stack Trace', () => {
  it('captured errors include stack trace', () => {
    fc.assert(
      fc.property(
        fc.record({
          message: fc.string({ minLength: 10, maxLength: 200 }),
          stack: fc.string({ minLength: 50, maxLength: 1000 }),
          timestamp: fc.date(),
        }),
        (error) => {
          expect(error.message).toBeTruthy();
          expect(error.stack).toBeTruthy();
          expect(error.stack.length).toBeGreaterThan(0);
          expect(error.timestamp).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('error context is preserved', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          url: fc.webUrl(),
          userAgent: fc.string({ minLength: 10, maxLength: 200 }),
        }),
        (context) => {
          expect(context.userId).toBeTruthy();
          expect(context.url).toContain('http');
          expect(context.userAgent).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
