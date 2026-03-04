/**
 * Example usage of the send-sms Edge Function
 * 
 * This file demonstrates how to call the SMS notification function
 * from various contexts within the TripSlip platform.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

/**
 * Send a trip reminder SMS
 */
async function sendTripReminder() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: '+1234567890',
      message: 'Reminder: Field trip to Science Museum tomorrow at 9 AM. Please arrive 15 minutes early.',
      language: 'en',
      userId: 'parent-user-uuid',
    }),
  });

  const data = await response.json();
  console.log('Trip reminder sent:', data);
  return data;
}

/**
 * Send payment confirmation SMS (Spanish)
 */
async function sendPaymentConfirmation() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: '+1234567890',
      message: 'Su pago de $50.00 ha sido confirmado para la excursión al Museo de Ciencias. Gracias!',
      language: 'es',
      userId: 'parent-user-uuid',
    }),
  });

  const data = await response.json();
  console.log('Payment confirmation sent:', data);
  return data;
}

/**
 * Send urgent trip update (Arabic)
 */
async function sendUrgentUpdate() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: '+1234567890',
      message: 'تحديث عاجل: تم تغيير موعد الرحلة إلى الغد الساعة 10 صباحاً بسبب الطقس.',
      language: 'ar',
      userId: 'parent-user-uuid',
    }),
  });

  const data = await response.json();
  console.log('Urgent update sent:', data);
  return data;
}

/**
 * Send trip cancellation notification
 */
async function sendTripCancellation() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: '+1234567890',
      message: 'Trip to Science Museum on March 15 has been cancelled. Full refund will be processed within 5-7 business days.',
      language: 'en',
      userId: 'parent-user-uuid',
    }),
  });

  const data = await response.json();
  console.log('Cancellation notice sent:', data);
  return data;
}

/**
 * Send permission slip reminder
 */
async function sendPermissionSlipReminder() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: '+1234567890',
      message: 'Reminder: Permission slip for Science Museum trip is due by Friday. Sign now at tripslip.com',
      language: 'en',
      userId: 'parent-user-uuid',
    }),
  });

  const data = await response.json();
  console.log('Permission slip reminder sent:', data);
  return data;
}

/**
 * Batch send SMS to multiple parents
 */
async function sendBatchSMS(parents: Array<{ phone: string; userId: string; language: string }>, message: string) {
  const results = [];
  
  for (const parent of parents) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: parent.phone,
          message,
          language: parent.language,
          userId: parent.userId,
        }),
      });

      const data = await response.json();
      results.push({ phone: parent.phone, success: data.success, data });
      
      // Add delay to avoid rate limiting from Twilio
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.push({ phone: parent.phone, success: false, error: error.message });
    }
  }
  
  console.log('Batch SMS results:', results);
  return results;
}

/**
 * Example: Send SMS from webhook handler
 * This would be called from the stripe-webhook function after payment success
 */
async function sendSMSFromWebhook(parentPhone: string, parentUserId: string, tripName: string, amount: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: parentPhone,
      message: `Payment of ${amount} confirmed for ${tripName}. Your child is all set for the trip!`,
      language: 'en',
      userId: parentUserId,
    }),
  });

  return await response.json();
}

/**
 * Example: Check rate limit before sending
 */
async function checkAndSendSMS(phone: string, userId: string, message: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: phone,
      message,
      language: 'en',
      userId,
    }),
  });

  const data = await response.json();
  
  if (response.status === 429) {
    console.log('Rate limit exceeded. SMS not sent.');
    return { success: false, rateLimited: true };
  }
  
  if (response.status === 403) {
    console.log('User has not opted in to SMS. SMS not sent.');
    return { success: false, optInRequired: true };
  }
  
  console.log(`SMS sent. Rate limit remaining: ${data.rateLimitRemaining}`);
  return data;
}

// Export functions for use in other modules
export {
  sendTripReminder,
  sendPaymentConfirmation,
  sendUrgentUpdate,
  sendTripCancellation,
  sendPermissionSlipReminder,
  sendBatchSMS,
  sendSMSFromWebhook,
  checkAndSendSMS,
};

// Run examples if executed directly
if (import.meta.main) {
  console.log('Running SMS examples...\n');
  
  // Uncomment to test specific examples:
  // await sendTripReminder();
  // await sendPaymentConfirmation();
  // await sendUrgentUpdate();
  // await sendTripCancellation();
  // await sendPermissionSlipReminder();
  
  console.log('\nExamples complete!');
}
