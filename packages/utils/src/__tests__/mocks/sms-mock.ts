import { vi } from 'vitest';

export interface MockSMSPayload {
  to: string;
  message: string;
  language?: string;
}

export const createMockSMSService = () => {
  const sentMessages: MockSMSPayload[] = [];
  const rateLimitMap = new Map<string, number[]>();

  return {
    send: vi.fn().mockImplementation(async (payload: MockSMSPayload) => {
      const now = Date.now();
      const timestamps = rateLimitMap.get(payload.to) || [];
      const recentTimestamps = timestamps.filter(t => now - t < 60000);
      
      if (recentTimestamps.length >= 5) {
        throw new Error('Rate limit exceeded');
      }

      recentTimestamps.push(now);
      rateLimitMap.set(payload.to, recentTimestamps);
      sentMessages.push(payload);
      
      return { success: true, messageId: `sms_${Date.now()}` };
    }),
    getSentMessages: () => sentMessages,
    clearSentMessages: () => {
      sentMessages.length = 0;
      rateLimitMap.clear();
    },
    getLastMessage: () => sentMessages[sentMessages.length - 1],
    getRateLimitCount: (phoneNumber: string) => {
      const timestamps = rateLimitMap.get(phoneNumber) || [];
      const now = Date.now();
      return timestamps.filter(t => now - t < 60000).length;
    },
  };
};

export const mockSMSTemplates = {
  'permission-slip-reminder': {
    en: 'Reminder: Please sign the permission slip for {{tripName}}. Reply STOP to opt out.',
    es: 'Recordatorio: Firme el permiso para {{tripName}}. Responda STOP para cancelar.',
    ar: 'تذكير: يرجى التوقيع على نموذج الإذن لـ {{tripName}}. رد STOP لإلغاء الاشتراك.',
  },
  'payment-reminder': {
    en: 'Payment due for {{tripName}}. Amount: ${{amount}}. Reply STOP to opt out.',
    es: 'Pago pendiente para {{tripName}}. Monto: ${{amount}}. Responda STOP para cancelar.',
    ar: 'الدفع المستحق لـ {{tripName}}. المبلغ: ${{amount}}. رد STOP لإلغاء الاشتراك.',
  },
  'trip-update': {
    en: 'Update for {{tripName}}: {{message}}. Reply STOP to opt out.',
    es: 'Actualización para {{tripName}}: {{message}}. Responda STOP para cancelar.',
    ar: 'تحديث لـ {{tripName}}: {{message}}. رد STOP لإلغاء الاشتراك.',
  },
};
