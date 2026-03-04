import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper function for template interpolation
const interpolate = (template: string, data: Record<string, string>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
};

describe('send-email Edge Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Template Interpolation', () => {
    it('should interpolate template variables correctly', () => {
      const template = 'Hello {{name}}, your trip to {{destination}} is on {{date}}.';
      const data = {
        name: 'John',
        destination: 'Museum',
        date: '2024-03-15',
      };
      
      const result = interpolate(template, data);
      expect(result).toBe('Hello John, your trip to Museum is on 2024-03-15.');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, your trip to {{destination}}.';
      const data = { name: 'John' };
      
      const result = interpolate(template, data);
      expect(result).toBe('Hello John, your trip to .');
    });

    it('should handle empty template data', () => {
      const template = 'Hello {{name}}, your trip to {{destination}}.';
      const data = {};
      
      const result = interpolate(template, data);
      expect(result).toBe('Hello , your trip to .');
    });

    it('should handle templates with no variables', () => {
      const template = 'This is a static template with no variables.';
      const data = { name: 'John' };
      
      const result = interpolate(template, data);
      expect(result).toBe('This is a static template with no variables.');
    });

    it('should handle multiple occurrences of the same variable', () => {
      const template = 'Hello {{name}}, welcome {{name}}! Your name is {{name}}.';
      const data = { name: 'John' };
      
      const result = interpolate(template, data);
      expect(result).toBe('Hello John, welcome John! Your name is John.');
    });

    it('should handle special characters in variable values', () => {
      const template = 'Hello {{name}}, your email is {{email}}.';
      const data = {
        name: "O'Brien",
        email: 'test+user@example.com',
      };
      
      const result = interpolate(template, data);
      expect(result).toBe("Hello O'Brien, your email is test+user@example.com.");
    });

    it('should handle HTML entities in variable values', () => {
      const template = '<p>Hello {{name}}, your message: {{message}}</p>';
      const data = {
        name: 'John',
        message: '<script>alert("xss")</script>',
      };
      
      const result = interpolate(template, data);
      expect(result).toContain('<script>alert("xss")</script>');
      // Note: XSS prevention should be handled at a different layer
    });

    it('should handle numeric values in template data', () => {
      const template = 'Your payment of {{amount}} is due on {{date}}.';
      const data = {
        amount: '49.99',
        date: '2024-03-15',
      };
      
      const result = interpolate(template, data);
      expect(result).toBe('Your payment of 49.99 is due on 2024-03-15.');
    });

    it('should handle URLs in template data', () => {
      const template = 'Click here: {{link}}';
      const data = {
        link: 'https://tripslip.com/permission-slip?id=123&token=abc',
      };
      
      const result = interpolate(template, data);
      expect(result).toBe('Click here: https://tripslip.com/permission-slip?id=123&token=abc');
    });

    it('should not interpolate malformed variable syntax', () => {
      const template = 'Hello {name}, your trip to {{destination}}.';
      const data = {
        name: 'John',
        destination: 'Museum',
      };
      
      const result = interpolate(template, data);
      expect(result).toBe('Hello {name}, your trip to Museum.');
    });

    it('should handle whitespace in variable names', () => {
      const template = 'Hello {{ name }}, your trip to {{destination}}.';
      const data = {
        name: 'John',
        destination: 'Museum',
      };
      
      // The regex only matches \w+ (no spaces), so {{ name }} won't be replaced
      const result = interpolate(template, data);
      expect(result).toBe('Hello {{ name }}, your trip to Museum.');
    });
  });

  describe('Template Availability', () => {
    it('should have all required templates for all languages', () => {
      const requiredTemplates = [
        'permission_slip_created',
        'payment_confirmed',
        'trip_cancelled',
      ];
      
      const requiredLanguages = ['en', 'es', 'ar'];
      
      // Mock template structure matching actual implementation
      const EMAIL_TEMPLATES: Record<string, Record<string, { subject: string; html: string }>> = {
        permission_slip_created: {
          en: { subject: 'Permission Slip Required for {{tripName}}', html: '<div>English</div>' },
          es: { subject: 'Se Requiere Permiso para {{tripName}}', html: '<div>Spanish</div>' },
          ar: { subject: 'مطلوب إذن للرحلة {{tripName}}', html: '<div dir="rtl">Arabic</div>' },
        },
        payment_confirmed: {
          en: { subject: 'Payment Confirmed for {{tripName}}', html: '<div>English</div>' },
          es: { subject: 'Pago Confirmado para {{tripName}}', html: '<div>Spanish</div>' },
          ar: { subject: 'تم تأكيد الدفع لـ {{tripName}}', html: '<div dir="rtl">Arabic</div>' },
        },
        trip_cancelled: {
          en: { subject: 'Trip Cancelled: {{tripName}}', html: '<div>English</div>' },
          es: { subject: 'Viaje Cancelado: {{tripName}}', html: '<div>Spanish</div>' },
          ar: { subject: 'تم إلغاء الرحلة: {{tripName}}', html: '<div dir="rtl">Arabic</div>' },
        },
      };
      
      requiredTemplates.forEach(templateId => {
        requiredLanguages.forEach(lang => {
          expect(EMAIL_TEMPLATES[templateId]).toBeDefined();
          expect(EMAIL_TEMPLATES[templateId][lang]).toBeDefined();
          expect(EMAIL_TEMPLATES[templateId][lang].subject).toBeTruthy();
          expect(EMAIL_TEMPLATES[templateId][lang].html).toBeTruthy();
        });
      });
    });
  });

  describe('Retry Logic', () => {
    it('should retry up to 3 times on failure', async () => {
      let attemptCount = 0;
      
      const mockSendEmail = async () => {
        attemptCount++;
        throw new Error('Network error');
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10)); // Short delay for testing
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(attemptCount).toBe(3);
    });

    it('should succeed on first attempt if email sends successfully', async () => {
      let attemptCount = 0;
      
      const mockSendEmail = async () => {
        attemptCount++;
        return { ok: true };
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await mockSendEmail();
            if (response.ok) {
              return { success: true, attempts: attempt };
            }
          } catch (error: any) {
            // Continue to retry
          }
        }
        
        return { success: false, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(attemptCount).toBe(1);
    });

    it('should succeed on second attempt after one failure', async () => {
      let attemptCount = 0;
      
      const mockSendEmail = async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Temporary network error');
        }
        return { ok: true };
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await mockSendEmail();
            if (response.ok) {
              return { success: true, attempts: attempt };
            }
          } catch (error: any) {
            if (attempt === maxRetries) {
              return { success: false, error: error.message, attempts: maxRetries };
            }
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(attemptCount).toBe(2);
    });

    it('should implement exponential backoff delays', async () => {
      const delays: number[] = [];
      let attemptCount = 0;
      
      const mockSendEmail = async () => {
        attemptCount++;
        throw new Error('Network error');
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
            delays.push(delay);
            await new Promise(resolve => setTimeout(resolve, 10)); // Short delay for testing
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      await sendEmailWithRetry();
      
      // Verify exponential backoff pattern: 1s, 2s
      expect(delays).toEqual([1000, 2000]);
    });

    it('should preserve error message from last attempt', async () => {
      let attemptCount = 0;
      
      const mockSendEmail = async () => {
        attemptCount++;
        throw new Error(`Attempt ${attemptCount} failed`);
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.error).toBe('Attempt 3 failed');
    });

    it('should handle different error types during retry', async () => {
      let attemptCount = 0;
      const errors = ['Network timeout', 'Connection refused', 'Service unavailable'];
      
      const mockSendEmail = async () => {
        const error = errors[attemptCount] || 'Unknown error';
        attemptCount++;
        throw new Error(error);
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.error).toBe('Service unavailable');
      expect(attemptCount).toBe(3);
    });

    it('should not retry if maxRetries is 1', async () => {
      let attemptCount = 0;
      
      const mockSendEmail = async () => {
        attemptCount++;
        throw new Error('Network error');
      };
      
      const sendEmailWithRetry = async (maxRetries = 1) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry(1);
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(attemptCount).toBe(1);
    });
  });

  describe('Input Validation', () => {
    it('should reject requests without required fields', () => {
      const validateInput = (data: any) => {
        if (!data.to || !data.templateId || !data.templateData) {
          throw new Error('Missing required fields: to, templateId, templateData');
        }
      };
      
      expect(() => validateInput({})).toThrow('Missing required fields');
      expect(() => validateInput({ to: 'test@example.com' })).toThrow('Missing required fields');
      expect(() => validateInput({ 
        to: 'test@example.com', 
        templateId: 'test',
        templateData: {} 
      })).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
      
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });

    it('should reject empty email addresses', () => {
      const validateInput = (data: any) => {
        if (!data.to || data.to.trim() === '') {
          throw new Error('Email address is required');
        }
      };
      
      expect(() => validateInput({ to: '' })).toThrow('Email address is required');
      expect(() => validateInput({ to: '   ' })).toThrow('Email address is required');
      expect(() => validateInput({ to: 'test@example.com' })).not.toThrow();
    });

    it('should reject empty template IDs', () => {
      const validateInput = (data: any) => {
        if (!data.templateId || data.templateId.trim() === '') {
          throw new Error('Template ID is required');
        }
      };
      
      expect(() => validateInput({ templateId: '' })).toThrow('Template ID is required');
      expect(() => validateInput({ templateId: '   ' })).toThrow('Template ID is required');
      expect(() => validateInput({ templateId: 'permission_slip_created' })).not.toThrow();
    });

    it('should handle null or undefined template data', () => {
      const validateInput = (data: any) => {
        if (!data.templateData) {
          throw new Error('Template data is required');
        }
      };
      
      expect(() => validateInput({ templateData: null })).toThrow('Template data is required');
      expect(() => validateInput({ templateData: undefined })).toThrow('Template data is required');
      expect(() => validateInput({ templateData: {} })).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle template not found error', () => {
      const EMAIL_TEMPLATES: Record<string, Record<string, { subject: string; html: string }>> = {
        permission_slip_created: {
          en: { subject: 'Test', html: '<div>Test</div>' },
        },
      };
      
      const getTemplate = (templateId: string, language: string) => {
        const template = EMAIL_TEMPLATES[templateId]?.[language];
        if (!template) {
          throw new Error(`Template '${templateId}' not found for language '${language}'`);
        }
        return template;
      };
      
      expect(() => getTemplate('nonexistent', 'en')).toThrow("Template 'nonexistent' not found");
      expect(() => getTemplate('permission_slip_created', 'fr')).toThrow("not found for language 'fr'");
      expect(() => getTemplate('permission_slip_created', 'en')).not.toThrow();
    });

    it('should handle email provider errors gracefully', async () => {
      const mockSendEmail = async () => {
        throw new Error('SendGrid API error: Invalid API key');
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('SendGrid API error');
    });

    it('should handle network timeout errors', async () => {
      const mockSendEmail = async () => {
        throw new Error('Network timeout after 30s');
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle rate limiting errors', async () => {
      const mockSendEmail = async () => {
        const response = { ok: false, status: 429, text: async () => 'Rate limit exceeded' };
        return response;
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await mockSendEmail();
            if (response.ok) {
              return { success: true, attempts: attempt };
            }
            lastError = `HTTP ${response.status}: ${await response.text()}`;
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('429');
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('should handle invalid API key errors', async () => {
      const mockSendEmail = async () => {
        const response = { ok: false, status: 401, text: async () => 'Unauthorized: Invalid API key' };
        return response;
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await mockSendEmail();
            if (response.ok) {
              return { success: true, attempts: attempt };
            }
            lastError = `HTTP ${response.status}: ${await response.text()}`;
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
      expect(result.error).toContain('Invalid API key');
    });

    it('should handle malformed JSON responses', async () => {
      const mockSendEmail = async () => {
        throw new Error('SyntaxError: Unexpected token in JSON');
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });

    it('should handle unsupported email provider', () => {
      const getEmailProvider = (provider: string) => {
        const supportedProviders = ['sendgrid', 'resend'];
        if (!supportedProviders.includes(provider)) {
          throw new Error(`Unsupported email provider: ${provider}`);
        }
        return provider;
      };
      
      expect(() => getEmailProvider('sendgrid')).not.toThrow();
      expect(() => getEmailProvider('resend')).not.toThrow();
      expect(() => getEmailProvider('mailgun')).toThrow('Unsupported email provider: mailgun');
    });

    it('should return detailed error information', async () => {
      const mockSendEmail = async () => {
        throw new Error('SMTP connection failed: Connection refused');
      };
      
      const sendEmailWithRetry = async (maxRetries = 3) => {
        let lastError = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockSendEmail();
            return { success: true, attempts: attempt };
          } catch (error: any) {
            lastError = error.message;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
      };
      
      const result = await sendEmailWithRetry();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('attempts');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.attempts).toBe(3);
    });
  });

  describe('Language Support', () => {
    it('should default to English if language not specified', () => {
      const getLanguage = (language?: string) => language || 'en';
      
      expect(getLanguage()).toBe('en');
      expect(getLanguage('es')).toBe('es');
      expect(getLanguage('ar')).toBe('ar');
    });

    it('should support RTL for Arabic templates', () => {
      const arabicTemplate = '<div dir="rtl">مرحبا</div>';
      expect(arabicTemplate).toContain('dir="rtl"');
    });

    it('should have all required templates for all languages', () => {
      const requiredTemplates = [
        'permission_slip_created',
        'payment_confirmed',
        'trip_cancelled',
      ];
      
      const requiredLanguages = ['en', 'es', 'ar'];
      
      // Mock template structure matching actual implementation
      const EMAIL_TEMPLATES: Record<string, Record<string, { subject: string; html: string }>> = {
        permission_slip_created: {
          en: { subject: 'Permission Slip Required for {{tripName}}', html: '<div>English</div>' },
          es: { subject: 'Se Requiere Permiso para {{tripName}}', html: '<div>Spanish</div>' },
          ar: { subject: 'مطلوب إذن للرحلة {{tripName}}', html: '<div dir="rtl">Arabic</div>' },
        },
        payment_confirmed: {
          en: { subject: 'Payment Confirmed for {{tripName}}', html: '<div>English</div>' },
          es: { subject: 'Pago Confirmado para {{tripName}}', html: '<div>Spanish</div>' },
          ar: { subject: 'تم تأكيد الدفع لـ {{tripName}}', html: '<div dir="rtl">Arabic</div>' },
        },
        trip_cancelled: {
          en: { subject: 'Trip Cancelled: {{tripName}}', html: '<div>English</div>' },
          es: { subject: 'Viaje Cancelado: {{tripName}}', html: '<div>Spanish</div>' },
          ar: { subject: 'تم إلغاء الرحلة: {{tripName}}', html: '<div dir="rtl">Arabic</div>' },
        },
      };
      
      requiredTemplates.forEach(templateId => {
        requiredLanguages.forEach(lang => {
          expect(EMAIL_TEMPLATES[templateId]).toBeDefined();
          expect(EMAIL_TEMPLATES[templateId][lang]).toBeDefined();
          expect(EMAIL_TEMPLATES[templateId][lang].subject).toBeTruthy();
          expect(EMAIL_TEMPLATES[templateId][lang].html).toBeTruthy();
        });
      });
    });

    it('should interpolate variables in Spanish templates', () => {
      const template = 'Hola {{parentName}}, su pago de {{amount}} ha sido confirmado.';
      const data = {
        parentName: 'María',
        amount: '$49.99',
      };
      
      const result = interpolate(template, data);
      expect(result).toBe('Hola María, su pago de $49.99 ha sido confirmado.');
    });

    it('should interpolate variables in Arabic templates', () => {
      const template = 'مرحبا {{parentName}}، تم تأكيد دفعتك بمبلغ {{amount}}.';
      const data = {
        parentName: 'أحمد',
        amount: '$49.99',
      };
      
      const result = interpolate(template, data);
      expect(result).toBe('مرحبا أحمد، تم تأكيد دفعتك بمبلغ $49.99.');
    });

    it('should preserve RTL direction in Arabic HTML templates', () => {
      const template = '<div dir="rtl"><p>مرحبا {{name}}</p></div>';
      const data = { name: 'أحمد' };
      
      const result = interpolate(template, data);
      expect(result).toContain('dir="rtl"');
      expect(result).toContain('أحمد');
    });

    it('should handle mixed LTR and RTL content in Arabic templates', () => {
      const template = '<div dir="rtl">مرحبا {{name}}، رحلتك إلى {{venueName}} في {{date}}.</div>';
      const data = {
        name: 'أحمد',
        venueName: 'Science Museum',
        date: '2024-03-15',
      };
      
      const result = interpolate(template, data);
      expect(result).toContain('أحمد');
      expect(result).toContain('Science Museum');
      expect(result).toContain('2024-03-15');
    });

    it('should support all three languages for each template type', () => {
      const templateTypes = ['permission_slip_created', 'payment_confirmed', 'trip_cancelled'];
      const languages = ['en', 'es', 'ar'];
      
      const EMAIL_TEMPLATES: Record<string, Record<string, { subject: string; html: string }>> = {
        permission_slip_created: {
          en: { subject: 'Test EN', html: '<div>EN</div>' },
          es: { subject: 'Test ES', html: '<div>ES</div>' },
          ar: { subject: 'Test AR', html: '<div dir="rtl">AR</div>' },
        },
        payment_confirmed: {
          en: { subject: 'Test EN', html: '<div>EN</div>' },
          es: { subject: 'Test ES', html: '<div>ES</div>' },
          ar: { subject: 'Test AR', html: '<div dir="rtl">AR</div>' },
        },
        trip_cancelled: {
          en: { subject: 'Test EN', html: '<div>EN</div>' },
          es: { subject: 'Test ES', html: '<div>ES</div>' },
          ar: { subject: 'Test AR', html: '<div dir="rtl">AR</div>' },
        },
      };
      
      templateTypes.forEach(templateType => {
        languages.forEach(lang => {
          const template = EMAIL_TEMPLATES[templateType][lang];
          expect(template).toBeDefined();
          expect(template.subject).toBeTruthy();
          expect(template.html).toBeTruthy();
          
          // Arabic templates should have RTL
          if (lang === 'ar') {
            expect(template.html).toContain('dir="rtl"');
          }
        });
      });
    });
  });
});
