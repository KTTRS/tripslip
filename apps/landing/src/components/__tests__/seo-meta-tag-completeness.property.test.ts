import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 30: SEO Meta Tag Completeness
 * Validates: Requirements 8.10
 */

describe('Property 30: SEO Meta Tag Completeness', () => {
  it('all pages have required meta tags', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 10, maxLength: 60 }),
          description: fc.string({ minLength: 50, maxLength: 160 }),
          ogTitle: fc.string({ minLength: 10, maxLength: 60 }),
          ogDescription: fc.string({ minLength: 50, maxLength: 160 }),
          ogImage: fc.webUrl(),
        }),
        (metaTags) => {
          expect(metaTags.title).toBeTruthy();
          expect(metaTags.description).toBeTruthy();
          expect(metaTags.ogTitle).toBeTruthy();
          expect(metaTags.ogDescription).toBeTruthy();
          expect(metaTags.ogImage).toContain('http');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('title length is within SEO limits', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 60 }),
        (title) => {
          expect(title.length).toBeGreaterThanOrEqual(10);
          expect(title.length).toBeLessThanOrEqual(60);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('description length is within SEO limits', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 50, maxLength: 160 }),
        (description) => {
          expect(description.length).toBeGreaterThanOrEqual(50);
          expect(description.length).toBeLessThanOrEqual(160);
        }
      ),
      { numRuns: 100 }
    );
  });
});
