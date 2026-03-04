import { vi } from 'vitest';

/**
 * Mock email services for testing
 * Provides comprehensive mocking for email notification operations
 */

// Mock email templates
export const mockEmailTemplates = {
  'permission-slip-created': {
    en: {
      subject: 'Permission Slip Required for {{tripTitle}}',
      html: '<p>Dear {{parentName}}, please sign the permission slip for {{tripTitle}}.</p>',
      text: 'Dear {{parentName}}, please sign the permission slip for {{tripTitle}}.',
    },
    es: {
      subject: 'Autorización Requerida para {{tripTitle}}',
      html: '<p>Estimado/a {{parentName}}, por favor firme la autorización para {{tripTitle}}.</p>',
      text: 'Estimado/a {{parentName}}, por favor firme la autorización para {{tripTitle}}.',
    },
    ar: {
      subject: 'مطلوب إذن للرحلة {{tripTitle}}',
      html: '<p>عزيزي {{parentName}}، يرجى توقيع إذن الرحلة {{tripTitle}}.</p>',
      text: 'عزيزي {{parentName}}، يرجى توقيع إذن الرحلة {{tripTitle}}.',
    },
  },
  'payment-confirmation': {
    en: {
      subject: 'Payment Confirmation for {{tripTitle}}',
      html: '<p>Thank you {{parentName}}, your payment of ${{amount}} has been processed.</p>',
      text: 'Thank you {{parentName}}, your payment of ${{amount}} has been processed.',
    },
  },
  'trip-reminder': {
    en: {
      subject: 'Reminder: {{tripTitle}} is Tomorrow',
      html: '<p>Don\'t forget about {{tripTitle}} tomorrow at {{tripTime}}.</p>',
      text: 'Don\'t forget about {{tripTitle}} tomorrow at {{tripTime}}.',
    },
  },
};

// Mock email service responses
export const mockEmailResponses = {
  success: (messageId: string = 'msg_test_123') => ({
    success: true,
    messageId,
    status: 'sent',
  }),
  
  error: (message: string = 'Failed to send email') => ({
    success: false,
    error: {
      message,
      code: 'EMAIL_SEND_FAILED',
    },
  }),
  
  rateLimited: () => ({
    success: false,
    error: {
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
    },
  }),
  
  invalidEmail: (email: string) => ({
    success: false,
    error: {
      message: `Invalid email address: ${email}`,
      code: 'INVALID_EMAIL',
    },
  }),
};

// Mock SendGrid API
export const mockSendGrid = {
  send: vi.fn(),
  setApiKey: vi.fn(),
  setDefaultRequest: vi.fn(),
};

// Mock Resend API
export const mockResend = {
  emails: {
    send: vi.fn(),
  },
  apiKeys: {
    create: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  },
  domains: {
    create: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    verify: vi.fn(),
  },
};

// Mock email Edge Function
export const mockEmailEdgeFunction = vi.fn();

// Helper to set up email mocks
export const setupEmailMocks = (provider: 'sendgrid' | 'resend' = 'sendgrid') => {
  if (provider === 'sendgrid') {
    mockSendGrid.send.mockClear();
    mockSendGrid.send.mockResolvedValue([
      {
        statusCode: 202,
        body: '',
        headers: {},
      },
    ]);
    return mockSendGrid;
  } else {
    mockResend.emails.send.mockClear();
    mockResend.emails.send.mockResolvedValue({
      id: 'msg_test_123',
      from: 'notifications@tripslip.com',
      to: ['test@example.com'],
      created_at: new Date().toISOString(),
    });
    return mockResend;
  }
};

// Helper to simulate email sending scenarios
export const simulateEmailSending = {
  success: (provider: 'sendgrid' | 'resend' = 'sendgrid') => {
    if (provider === 'sendgrid') {
      mockSendGrid.send.mockResolvedValueOnce([
        { statusCode: 202, body: '', headers: {} },
      ]);
    } else {
      mockResend.emails.send.mockResolvedValueOnce({
        id: 'msg_test_123',
        from: 'notifications@tripslip.com',
        to: ['test@example.com'],
        created_at: new Date().toISOString(),
      });
    }
  },
  
  failure: (provider: 'sendgrid' | 'resend' = 'sendgrid', error?: string) => {
    const errorMessage = error || 'Failed to send email';
    if (provider === 'sendgrid') {
      mockSendGrid.send.mockRejectedValueOnce(new Error(errorMessage));
    } else {
      mockResend.emails.send.mockRejectedValueOnce(new Error(errorMessage));
    }
  },
  
  rateLimited: (provider: 'sendgrid' | 'resend' = 'sendgrid') => {
    const error = new Error('Rate limit exceeded');
    (error as any).code = 429;
    
    if (provider === 'sendgrid') {
      mockSendGrid.send.mockRejectedValueOnce(error);
    } else {
      mockResend.emails.send.mockRejectedValueOnce(error);
    }
  },
};

// Mock email data generators
export const mockEmailData = {
  permissionSlipNotification: (overrides: any = {}) => ({
    to: 'parent@example.com',
    templateId: 'permission-slip-created',
    language: 'en',
    data: {
      parentName: 'Jane Doe',
      studentName: 'John Doe',
      tripTitle: 'Science Museum Visit',
      tripDate: '2024-06-15',
      signUrl: 'https://parent.tripslip.com/sign/abc123',
    },
    ...overrides,
  }),
  
  paymentConfirmation: (overrides: any = {}) => ({
    to: 'parent@example.com',
    templateId: 'payment-confirmation',
    language: 'en',
    data: {
      parentName: 'Jane Doe',
      tripTitle: 'Science Museum Visit',
      amount: '15.00',
      receiptUrl: 'https://parent.tripslip.com/receipt/xyz789',
    },
    ...overrides,
  }),
  
  tripReminder: (overrides: any = {}) => ({
    to: 'parent@example.com',
    templateId: 'trip-reminder',
    language: 'en',
    data: {
      parentName: 'Jane Doe',
      studentName: 'John Doe',
      tripTitle: 'Science Museum Visit',
      tripDate: '2024-06-15',
      tripTime: '9:00 AM',
      venue: 'Science Museum',
      venueAddress: '123 Science St, City, ST 12345',
    },
    ...overrides,
  }),
};