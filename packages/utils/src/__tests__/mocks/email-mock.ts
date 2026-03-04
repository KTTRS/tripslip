import { vi } from 'vitest';

export interface MockEmailPayload {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export const createMockEmailService = () => {
  const sentEmails: MockEmailPayload[] = [];

  return {
    send: vi.fn().mockImplementation(async (payload: MockEmailPayload) => {
      sentEmails.push(payload);
      return { success: true, messageId: `msg_${Date.now()}` };
    }),
    getSentEmails: () => sentEmails,
    clearSentEmails: () => {
      sentEmails.length = 0;
    },
    getLastEmail: () => sentEmails[sentEmails.length - 1],
  };
};

export const mockEmailTemplates = {
  'permission-slip-signed': {
    subject: 'Permission Slip Signed',
    body: 'Your permission slip has been signed.',
  },
  'payment-confirmation': {
    subject: 'Payment Confirmed',
    body: 'Your payment has been processed.',
  },
  'trip-reminder': {
    subject: 'Trip Reminder',
    body: 'Your trip is coming up soon.',
  },
  'teacher-invitation': {
    subject: 'Invitation to Join TripSlip',
    body: 'You have been invited to join TripSlip.',
  },
  'trip-approval': {
    subject: 'Trip Approved',
    body: 'Your trip has been approved.',
  },
  'trip-rejection': {
    subject: 'Trip Requires Revision',
    body: 'Your trip requires revision.',
  },
  'contact-form': {
    subject: 'Contact Form Submission',
    body: 'New contact form submission.',
  },
};
