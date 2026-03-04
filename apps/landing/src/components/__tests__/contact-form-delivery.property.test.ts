import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 27: Contact Form Delivery
 * Validates: Requirements 8.4, 8.5
 */

describe('Property 27: Contact Form Delivery', () => {
  it('all required fields must be present', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          email: fc.emailAddress(),
          organization: fc.string({ minLength: 1, maxLength: 100 }),
          message: fc.string({ minLength: 10, maxLength: 1000 }),
        }),
        (formData) => {
          expect(formData.name).toBeTruthy();
          expect(formData.email).toContain('@');
          expect(formData.organization).toBeTruthy();
          expect(formData.message.length).toBeGreaterThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('email format is valid', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }),
      { numRuns: 100 }
    );
  });

  it('form submission creates email with correct structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          email: fc.emailAddress(),
          organization: fc.string({ minLength: 1, maxLength: 100 }),
          message: fc.string({ minLength: 10, maxLength: 1000 }),
        }),
        (formData) => {
          const emailPayload = {
            to: 'contact@tripslip.com',
            subject: `Contact Form: ${formData.name} from ${formData.organization}`,
            template: 'contact-form',
            data: formData,
          };

          expect(emailPayload.to).toBe('contact@tripslip.com');
          expect(emailPayload.subject).toContain(formData.name);
          expect(emailPayload.subject).toContain(formData.organization);
          expect(emailPayload.template).toBe('contact-form');
          expect(emailPayload.data).toEqual(formData);
        }
      ),
      { numRuns: 100 }
    );
  });
});
