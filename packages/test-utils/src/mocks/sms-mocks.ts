import { vi } from 'vitest';

/**
 * Mock SMS services for testing
 * Provides comprehensive mocking for SMS notification operations
 */

// Mock SMS templates
export const mockSmsTemplates = {
  'permission-slip-reminder': {
    en: 'Hi {{parentName}}, please sign the permission slip for {{tripTitle}}. Link: {{signUrl}}',
    es: 'Hola {{parentName}}, por favor firme la autorización para {{tripTitle}}. Enlace: {{signUrl}}',
    ar: 'مرحبا {{parentName}}، يرجى توقيع إذن الرحلة {{tripTitle}}. الرابط: {{signUrl}}',
  },
  'payment-reminder': {
    en: 'Payment of ${{amount}} is due for {{tripTitle}}. Pay now: {{paymentUrl}}',
    es: 'El pago de ${{amount}} vence para {{tripTitle}}. Pagar ahora: {{paymentUrl}}',
    ar: 'مطلوب دفع {{amount}}$ لرحلة {{tripTitle}}. ادفع الآن: {{paymentUrl}}',
  },
  'trip-confirmation': {
    en: 'Trip confirmed! {{tripTitle}} on {{tripDate}} at {{tripTime}}. Details: {{detailsUrl}}',
    es: 'Viaje confirmado! {{tripTitle}} el {{tripDate}} a las {{tripTime}}. Detalles: {{detailsUrl}}',
    ar: 'تم تأكيد الرحلة! {{tripTitle}} في {{tripDate}} الساعة {{tripTime}}. التفاصيل: {{detailsUrl}}',
  },
  'verification-code': {
    en: 'Your TripSlip verification code is: {{code}}',
    es: 'Su código de verificación de TripSlip es: {{code}}',
    ar: 'رمز التحقق الخاص بك في TripSlip هو: {{code}}',
  },
};

// Mock SMS service responses
export const mockSmsResponses = {
  success: (messageId: string = 'SM_test_123') => ({
    success: true,
    messageId,
    status: 'sent',
    to: '+15550123456',
  }),
  
  error: (message: string = 'Failed to send SMS') => ({
    success: false,
    error: {
      message,
      code: 'SMS_SEND_FAILED',
    },
  }),
  
  invalidNumber: (phoneNumber: string) => ({
    success: false,
    error: {
      message: `Invalid phone number: ${phoneNumber}`,
      code: 'INVALID_PHONE_NUMBER',
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
  
  optedOut: (phoneNumber: string) => ({
    success: false,
    error: {
      message: `Phone number ${phoneNumber} has opted out of SMS`,
      code: 'OPTED_OUT',
    },
  }),
};

// Mock Twilio API
export const mockTwilio = {
  messages: {
    create: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  verify: {
    v2: {
      services: vi.fn(() => ({
        verifications: {
          create: vi.fn(),
        },
        verificationChecks: {
          create: vi.fn(),
        },
      })),
    },
  },
};

// Mock SMS Edge Function
export const mockSmsEdgeFunction = vi.fn();

// Helper to set up SMS mocks
export const setupSmsMocks = () => {
  mockTwilio.messages.create.mockClear();
  mockTwilio.messages.create.mockResolvedValue({
    sid: 'SM_test_123',
    status: 'sent',
    to: '+15550123456',
    from: '+15550987654',
    body: 'Test message',
    dateCreated: new Date(),
    dateSent: new Date(),
    dateUpdated: new Date(),
    direction: 'outbound-api',
    errorCode: null,
    errorMessage: null,
    numMedia: '0',
    numSegments: '1',
    price: '-0.0075',
    priceUnit: 'USD',
    uri: '/2010-04-01/Accounts/test/Messages/SM_test_123.json',
  });
  
  return mockTwilio;
};

// Helper to simulate SMS sending scenarios
export const simulateSmsSending = {
  success: () => {
    mockTwilio.messages.create.mockResolvedValueOnce({
      sid: 'SM_test_123',
      status: 'sent',
      to: '+15550123456',
      from: '+15550987654',
      body: 'Test message',
      dateCreated: new Date(),
      dateSent: new Date(),
    });
  },
  
  failure: (error?: string) => {
    const errorMessage = error || 'Failed to send SMS';
    mockTwilio.messages.create.mockRejectedValueOnce(new Error(errorMessage));
  },
  
  invalidNumber: () => {
    const error = new Error('Invalid phone number');
    (error as any).code = 21211;
    mockTwilio.messages.create.mockRejectedValueOnce(error);
  },
  
  optedOut: () => {
    const error = new Error('Phone number has opted out');
    (error as any).code = 21610;
    mockTwilio.messages.create.mockRejectedValueOnce(error);
  },
  
  rateLimited: () => {
    const error = new Error('Rate limit exceeded');
    (error as any).code = 20429;
    mockTwilio.messages.create.mockRejectedValueOnce(error);
  },
};

// Helper to simulate phone verification
export const simulatePhoneVerification = {
  sendCode: {
    success: () => {
      const mockService = mockTwilio.verify.v2.services();
      mockService.verifications.create.mockResolvedValueOnce({
        sid: 'VE_test_123',
        status: 'pending',
        to: '+15550123456',
        channel: 'sms',
        dateCreated: new Date(),
        dateUpdated: new Date(),
      });
    },
    
    failure: (error?: string) => {
      const mockService = mockTwilio.verify.v2.services();
      const errorMessage = error || 'Failed to send verification code';
      mockService.verifications.create.mockRejectedValueOnce(new Error(errorMessage));
    },
  },
  
  verifyCode: {
    success: () => {
      const mockService = mockTwilio.verify.v2.services();
      mockService.verificationChecks.create.mockResolvedValueOnce({
        sid: 'VE_test_123',
        status: 'approved',
        to: '+15550123456',
        channel: 'sms',
        dateCreated: new Date(),
        dateUpdated: new Date(),
      });
    },
    
    failure: (error?: string) => {
      const mockService = mockTwilio.verify.v2.services();
      const errorMessage = error || 'Invalid verification code';
      mockService.verificationChecks.create.mockRejectedValueOnce(new Error(errorMessage));
    },
    
    expired: () => {
      const mockService = mockTwilio.verify.v2.services();
      mockService.verificationChecks.create.mockResolvedValueOnce({
        sid: 'VE_test_123',
        status: 'expired',
        to: '+15550123456',
        channel: 'sms',
        dateCreated: new Date(),
        dateUpdated: new Date(),
      });
    },
  },
};

// Mock SMS data generators
export const mockSmsData = {
  permissionSlipReminder: (overrides: any = {}) => ({
    to: '+15550123456',
    templateId: 'permission-slip-reminder',
    language: 'en',
    data: {
      parentName: 'Jane',
      tripTitle: 'Science Museum',
      signUrl: 'https://parent.tripslip.com/sign/abc123',
    },
    ...overrides,
  }),
  
  paymentReminder: (overrides: any = {}) => ({
    to: '+15550123456',
    templateId: 'payment-reminder',
    language: 'en',
    data: {
      amount: '15.00',
      tripTitle: 'Science Museum',
      paymentUrl: 'https://parent.tripslip.com/pay/xyz789',
    },
    ...overrides,
  }),
  
  tripConfirmation: (overrides: any = {}) => ({
    to: '+15550123456',
    templateId: 'trip-confirmation',
    language: 'en',
    data: {
      tripTitle: 'Science Museum',
      tripDate: 'June 15',
      tripTime: '9:00 AM',
      detailsUrl: 'https://parent.tripslip.com/trip/abc123',
    },
    ...overrides,
  }),
  
  verificationCode: (overrides: any = {}) => ({
    to: '+15550123456',
    templateId: 'verification-code',
    language: 'en',
    data: {
      code: '123456',
    },
    ...overrides,
  }),
};