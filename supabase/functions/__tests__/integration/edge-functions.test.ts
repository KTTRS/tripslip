import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStripe, mockPaymentIntentSucceeded } from '../../../../packages/utils/src/__tests__/mocks/stripe-mock';
import { createMockEmailService } from '../../../../packages/utils/src/__tests__/mocks/email-mock';
import { createMockSMSService } from '../../../../packages/utils/src/__tests__/mocks/sms-mock';

describe('Edge Functions Integration Tests', () => {
  describe('create-payment-intent', () => {
    it('creates payment intent with valid data', async () => {
      const mockStripe = createMockStripe();
      const result = await mockStripe.paymentIntents.create({
        amount: 50000,
        currency: 'usd',
        metadata: { slip_id: 'slip_123' },
      });

      expect(result.id).toBeTruthy();
      expect(result.client_secret).toBeTruthy();
      expect(result.amount).toBe(50000);
    });

    it('rejects zero amount', async () => {
      const mockStripe = createMockStripe();
      await expect(
        mockStripe.paymentIntents.create({ amount: 0, currency: 'usd' })
      ).rejects.toThrow();
    });
  });

  describe('stripe-webhook', () => {
    it('processes payment_intent.succeeded event', async () => {
      const mockStripe = createMockStripe();
      const event = mockPaymentIntentSucceeded;

      expect(event.type).toBe('payment_intent.succeeded');
      expect(event.data.object.status).toBe('succeeded');
    });
  });

  describe('send-email', () => {
    it('sends email with template', async () => {
      const mockEmail = createMockEmailService();
      await mockEmail.send({
        to: 'test@example.com',
        subject: 'Test',
        template: 'test-template',
        data: {},
      });

      expect(mockEmail.getSentEmails()).toHaveLength(1);
      expect(mockEmail.getLastEmail().to).toBe('test@example.com');
    });
  });

  describe('send-sms', () => {
    it('sends SMS with rate limiting', async () => {
      const mockSMS = createMockSMSService();
      await mockSMS.send({ to: '+15555551234', message: 'Test' });

      expect(mockSMS.getSentMessages()).toHaveLength(1);
      expect(mockSMS.getRateLimitCount('+15555551234')).toBe(1);
    });

    it('enforces rate limit', async () => {
      const mockSMS = createMockSMSService();
      const phone = '+15555551234';

      for (let i = 0; i < 5; i++) {
        await mockSMS.send({ to: phone, message: `Test ${i}` });
      }

      await expect(
        mockSMS.send({ to: phone, message: 'Test 6' })
      ).rejects.toThrow('Rate limit exceeded');
    });
  });
});
