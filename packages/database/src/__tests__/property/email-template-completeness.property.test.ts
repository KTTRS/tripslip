/**
 * Property-Based Tests - Email Template Completeness (Task 1.11)
 * 
 * Tests Property 7: Email Template Completeness
 * For any email notification type and any supported language (en, es, ar), 
 * a template should exist and render without errors.
 * 
 * **Validates: Requirements 2.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'ar'] as const;
type Language = typeof SUPPORTED_LANGUAGES[number];

// Known template IDs from the send-email function
const TEMPLATE_IDS = [
  'permission_slip_created',
  'payment_confirmed',
  'trip_cancelled',
] as const;
type TemplateId = typeof TEMPLATE_IDS[number];

interface EmailTemplate {
  subject: string;
  html: string;
}

type TemplateMap = Record<TemplateId, Record<Language, EmailTemplate>>;

// Email templates (copied from send-email function for testing)
const EMAIL_TEMPLATES: TemplateMap = {
  permission_slip_created: {
    en: {
      subject: 'Permission Slip Required for {{tripName}}',
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">
              TripSlip
            </h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">
              Permission Slip Required
            </h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">
              Hello {{parentName}},
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">
              {{teacherName}} has created a permission slip for {{studentName}} for the upcoming field trip to {{venueName}} on {{tripDate}}.
            </p>
            <a href="{{magicLink}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">
              Sign Permission Slip
            </a>
            <p style="font-size: 14px; line-height: 1.5; color: #6B7280; margin: 16px 0 0 0;">
              This link expires in 7 days. If you have any questions, please contact {{teacherName}}.
            </p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">
              © 2024 TripSlip. All rights reserved.
            </p>
          </div>
        </div>
      `,
    },
    es: {
      subject: 'Se Requiere Permiso para {{tripName}}',
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">
              TripSlip
            </h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">
              Se Requiere Permiso
            </h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">
              Hola {{parentName}},
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">
              {{teacherName}} ha creado un permiso para {{studentName}} para la próxima excursión a {{venueName}} el {{tripDate}}.
            </p>
            <a href="{{magicLink}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">
              Firmar Permiso
            </a>
            <p style="font-size: 14px; line-height: 1.5; color: #6B7280; margin: 16px 0 0 0;">
              Este enlace expira en 7 días. Si tiene alguna pregunta, comuníquese con {{teacherName}}.
            </p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">
              © 2024 TripSlip. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    },
    ar: {
      subject: 'مطلوب إذن للرحلة {{tripName}}',
      html: `
        <div dir="rtl" style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">
              TripSlip
            </h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">
              مطلوب إذن
            </h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">
              مرحبا {{parentName}}،
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">
              قام {{teacherName}} بإنشاء إذن لـ {{studentName}} للرحلة القادمة إلى {{venueName}} في {{tripDate}}.
            </p>
            <a href="{{magicLink}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">
              توقيع الإذن
            </a>
            <p style="font-size: 14px; line-height: 1.5; color: #6B7280; margin: 16px 0 0 0;">
              تنتهي صلاحية هذا الرابط خلال 7 أيام. إذا كان لديك أي أسئلة، يرجى الاتصال بـ {{teacherName}}.
            </p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">
              © 2024 TripSlip. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      `,
    },
  },
  payment_confirmed: {
    en: {
      subject: 'Payment Confirmed for {{tripName}}',
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">Payment Confirmed</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Hello {{parentName}},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Your payment of {{amount}} for {{studentName}}'s field trip to {{tripName}} has been confirmed.</p>
            <a href="{{receiptUrl}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">View Receipt</a>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. All rights reserved.</p>
          </div>
        </div>
      `,
    },
    es: {
      subject: 'Pago Confirmado para {{tripName}}',
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">Pago Confirmado</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Hola {{parentName}},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Su pago de {{amount}} para la excursión de {{studentName}} a {{tripName}} ha sido confirmado.</p>
            <a href="{{receiptUrl}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">Ver Recibo</a>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    },
    ar: {
      subject: 'تم تأكيد الدفع لـ {{tripName}}',
      html: `
        <div dir="rtl" style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">تم تأكيد الدفع</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">مرحبا {{parentName}}،</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">تم تأكيد دفعتك بمبلغ {{amount}} لرحلة {{studentName}} إلى {{tripName}}.</p>
            <a href="{{receiptUrl}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">عرض الإيصال</a>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      `,
    },
  },
  trip_cancelled: {
    en: {
      subject: 'Trip Cancelled: {{tripName}}',
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">Trip Cancelled</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Hello {{parentName}},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Unfortunately, the field trip to {{tripName}} scheduled for {{tripDate}} has been cancelled.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">{{refundMessage}}</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0;">We apologize for any inconvenience.</p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. All rights reserved.</p>
          </div>
        </div>
      `,
    },
    es: {
      subject: 'Viaje Cancelado: {{tripName}}',
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">Viaje Cancelado</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Hola {{parentName}},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Desafortunadamente, la excursión a {{tripName}} programada para {{tripDate}} ha sido cancelada.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">{{refundMessage}}</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0;">Pedimos disculpas por cualquier inconveniente.</p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    },
    ar: {
      subject: 'تم إلغاء الرحلة: {{tripName}}',
      html: `
        <div dir="rtl" style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">تم إلغاء الرحلة</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">مرحبا {{parentName}}،</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">للأسف، تم إلغاء الرحلة إلى {{tripName}} المقررة في {{tripDate}}.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">{{refundMessage}}</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0;">نعتذر عن أي إزعاج.</p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      `,
    },
  },
};

// Template variable extraction helper
function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return matches.map(m => m.replace(/\{\{|\}\}/g, ''));
}

// Template interpolation helper (same as in send-email function)
function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

// Arbitrary generators for template data
const templateDataArbitrary = fc.record({
  parentName: fc.string({ minLength: 1, maxLength: 50 }),
  teacherName: fc.string({ minLength: 1, maxLength: 50 }),
  studentName: fc.string({ minLength: 1, maxLength: 50 }),
  venueName: fc.string({ minLength: 1, maxLength: 100 }),
  tripName: fc.string({ minLength: 1, maxLength: 100 }),
  tripDate: fc.date().map(d => d.toISOString().split('T')[0]),
  magicLink: fc.webUrl(),
  amount: fc.integer({ min: 1, max: 10000 }).map(n => `$${(n / 100).toFixed(2)}`),
  receiptUrl: fc.webUrl(),
  refundMessage: fc.string({ minLength: 10, maxLength: 200 }),
});

describe('Property-Based Tests - Email Template Completeness (Task 1.11)', () => {
  /**
   * Property 7.1: Template Existence for All Languages
   * 
   * For any template ID, templates should exist for all supported languages (en, es, ar).
   * This ensures complete internationalization coverage.
   */
  it('Property 7.1: All template IDs have templates for all supported languages', () => {
    for (const templateId of TEMPLATE_IDS) {
      for (const language of SUPPORTED_LANGUAGES) {
        const template = EMAIL_TEMPLATES[templateId]?.[language];
        
        expect(template).toBeDefined();
        expect(template).toHaveProperty('subject');
        expect(template).toHaveProperty('html');
        expect(template.subject).toBeTruthy();
        expect(template.html).toBeTruthy();
      }
    }
  });

  /**
   * Property 7.2: Template Rendering Without Errors
   * 
   * For any template ID, language, and valid template data, 
   * rendering the template should not throw errors and should produce non-empty output.
   */
  it('Property 7.2: Templates render without errors for valid data', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TEMPLATE_IDS),
        fc.constantFrom(...SUPPORTED_LANGUAGES),
        templateDataArbitrary,
        (templateId, language, templateData) => {
          const template = EMAIL_TEMPLATES[templateId][language];
          
          // Rendering should not throw
          let renderedSubject: string;
          let renderedHtml: string;
          
          expect(() => {
            renderedSubject = interpolate(template.subject, templateData);
            renderedHtml = interpolate(template.html, templateData);
          }).not.toThrow();
          
          // Rendered output should be non-empty
          renderedSubject = interpolate(template.subject, templateData);
          renderedHtml = interpolate(template.html, templateData);
          
          expect(renderedSubject.length).toBeGreaterThan(0);
          expect(renderedHtml.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.3: Template Variable Substitution
   * 
   * For any template with variables, providing data for those variables 
   * should result in the variables being replaced (no {{variable}} patterns remaining).
   */
  it('Property 7.3: Templates substitute all variables when data is provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TEMPLATE_IDS),
        fc.constantFrom(...SUPPORTED_LANGUAGES),
        templateDataArbitrary,
        (templateId, language, templateData) => {
          const template = EMAIL_TEMPLATES[templateId][language];
          
          // Extract variables from template
          const subjectVars = extractVariables(template.subject);
          const htmlVars = extractVariables(template.html);
          const allVars = [...new Set([...subjectVars, ...htmlVars])];
          
          // Create complete data with all required variables
          const completeData: Record<string, string> = { ...templateData };
          for (const varName of allVars) {
            if (!completeData[varName]) {
              completeData[varName] = `test_${varName}`;
            }
          }
          
          // Render templates
          const renderedSubject = interpolate(template.subject, completeData);
          const renderedHtml = interpolate(template.html, completeData);
          
          // Verify no unreplaced variables remain
          expect(renderedSubject).not.toMatch(/\{\{\w+\}\}/);
          expect(renderedHtml).not.toMatch(/\{\{\w+\}\}/);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 7.4: Template Structure Consistency
   * 
   * All templates should contain required structural elements:
   * - TripSlip branding
   * - Main content area
   * - Footer with copyright
   */
  it('Property 7.4: All templates contain required structural elements', () => {
    for (const templateId of TEMPLATE_IDS) {
      for (const language of SUPPORTED_LANGUAGES) {
        const template = EMAIL_TEMPLATES[templateId][language];
        
        // Check for TripSlip branding
        expect(template.html).toContain('TripSlip');
        
        // Check for design system colors
        expect(template.html).toContain('#F5C518'); // Primary yellow
        expect(template.html).toContain('#0A0A0A'); // Black
        
        // Check for copyright footer
        expect(template.html).toContain('2024 TripSlip');
        
        // Check for proper font families
        expect(template.html).toContain('Plus Jakarta Sans');
        expect(template.html).toContain('Fraunces');
      }
    }
  });

  /**
   * Property 7.5: Arabic Templates Have RTL Support
   * 
   * All Arabic templates should include dir="rtl" for proper right-to-left rendering.
   */
  it('Property 7.5: Arabic templates include RTL direction', () => {
    for (const templateId of TEMPLATE_IDS) {
      const arabicTemplate = EMAIL_TEMPLATES[templateId].ar;
      
      expect(arabicTemplate.html).toContain('dir="rtl"');
    }
  });

  /**
   * Property 7.6: Template Variable Consistency Across Languages
   * 
   * For any template ID, all language versions should use the same set of variables.
   * This ensures consistency in template data requirements.
   */
  it('Property 7.6: All language versions of a template use the same variables', () => {
    for (const templateId of TEMPLATE_IDS) {
      const templates = EMAIL_TEMPLATES[templateId];
      
      // Extract variables from each language version
      const enVars = new Set([
        ...extractVariables(templates.en.subject),
        ...extractVariables(templates.en.html),
      ]);
      const esVars = new Set([
        ...extractVariables(templates.es.subject),
        ...extractVariables(templates.es.html),
      ]);
      const arVars = new Set([
        ...extractVariables(templates.ar.subject),
        ...extractVariables(templates.ar.html),
      ]);
      
      // All language versions should use the same variables
      expect(Array.from(enVars).sort()).toEqual(Array.from(esVars).sort());
      expect(Array.from(enVars).sort()).toEqual(Array.from(arVars).sort());
    }
  });

  /**
   * Property 7.7: Template Rendering is Idempotent
   * 
   * Rendering a template multiple times with the same data should produce identical results.
   */
  it('Property 7.7: Template rendering is idempotent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TEMPLATE_IDS),
        fc.constantFrom(...SUPPORTED_LANGUAGES),
        templateDataArbitrary,
        (templateId, language, templateData) => {
          const template = EMAIL_TEMPLATES[templateId][language];
          
          const render1Subject = interpolate(template.subject, templateData);
          const render1Html = interpolate(template.html, templateData);
          
          const render2Subject = interpolate(template.subject, templateData);
          const render2Html = interpolate(template.html, templateData);
          
          expect(render1Subject).toBe(render2Subject);
          expect(render1Html).toBe(render2Html);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 7.8: Templates Handle Missing Variables Gracefully
   * 
   * When template data is missing some variables, the template should still render
   * without throwing errors (variables are replaced with empty strings).
   */
  it('Property 7.8: Templates handle missing variables gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TEMPLATE_IDS),
        fc.constantFrom(...SUPPORTED_LANGUAGES),
        fc.record({
          parentName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          teacherName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          studentName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        }),
        (templateId, language, partialData) => {
          const template = EMAIL_TEMPLATES[templateId][language];
          
          // Filter out undefined values
          const cleanData: Record<string, string> = {};
          for (const [key, value] of Object.entries(partialData)) {
            if (value !== undefined) {
              cleanData[key] = value;
            }
          }
          
          // Rendering should not throw even with missing data
          expect(() => {
            interpolate(template.subject, cleanData);
            interpolate(template.html, cleanData);
          }).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 7.9: Template Subject Lines Are Concise
   * 
   * All template subject lines should be reasonably short (under 100 characters)
   * to ensure they display properly in email clients.
   */
  it('Property 7.9: Template subject lines are concise', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TEMPLATE_IDS),
        fc.constantFrom(...SUPPORTED_LANGUAGES),
        templateDataArbitrary,
        (templateId, language, templateData) => {
          const template = EMAIL_TEMPLATES[templateId][language];
          const renderedSubject = interpolate(template.subject, templateData);
          
          // Subject should be under 100 characters for good email client display
          expect(renderedSubject.length).toBeLessThan(100);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 7.10: Templates Contain Valid HTML Structure
   * 
   * All template HTML should contain basic valid HTML structure elements.
   */
  it('Property 7.10: Templates contain valid HTML structure', () => {
    for (const templateId of TEMPLATE_IDS) {
      for (const language of SUPPORTED_LANGUAGES) {
        const template = EMAIL_TEMPLATES[templateId][language];
        
        // Check for basic HTML structure
        expect(template.html).toContain('<div');
        expect(template.html).toContain('</div>');
        
        // Check for proper style attributes
        expect(template.html).toContain('style=');
        
        // Verify no unclosed tags (basic check)
        const openDivs = (template.html.match(/<div/g) || []).length;
        const closeDivs = (template.html.match(/<\/div>/g) || []).length;
        expect(openDivs).toBe(closeDivs);
      }
    }
  });
});
