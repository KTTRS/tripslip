/**
 * Example usage of the send-email Edge Function
 * 
 * This file demonstrates how to call the send-email function
 * from other parts of the TripSlip platform.
 */

// Example 1: Send permission slip created notification
async function sendPermissionSlipNotification() {
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: 'parent@example.com',
        templateId: 'permission_slip_created',
        templateData: {
          parentName: 'John Doe',
          studentName: 'Jane Doe',
          teacherName: 'Ms. Smith',
          venueName: 'Science Museum',
          tripDate: 'March 15, 2024',
          magicLink: 'https://parent.tripslip.com/slip/abc123',
        },
        language: 'en', // Optional: defaults to 'en'
      }),
    }
  );

  const result = await response.json();
  console.log('Email sent:', result);
  // { success: true, message: "Email sent successfully", attempts: 1 }
}

// Example 2: Send payment confirmation in Spanish
async function sendPaymentConfirmationSpanish() {
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: 'padre@ejemplo.com',
        templateId: 'payment_confirmed',
        templateData: {
          parentName: 'Juan Pérez',
          studentName: 'María Pérez',
          tripName: 'Museo de Ciencias',
          amount: '$45.00',
          receiptUrl: 'https://parent.tripslip.com/receipt/xyz789',
        },
        language: 'es',
      }),
    }
  );

  const result = await response.json();
  console.log('Email enviado:', result);
}

// Example 3: Send trip cancellation in Arabic
async function sendTripCancellationArabic() {
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: 'والد@مثال.com',
        templateId: 'trip_cancelled',
        templateData: {
          parentName: 'أحمد محمد',
          tripName: 'متحف العلوم',
          tripDate: '15 مارس 2024',
          refundMessage: 'سيتم رد المبلغ خلال 5-7 أيام عمل.',
        },
        language: 'ar',
      }),
    }
  );

  const result = await response.json();
  console.log('تم إرسال البريد الإلكتروني:', result);
}

// Example 4: Batch send to multiple parents
async function sendBatchNotifications(parents: Array<{ email: string; name: string; studentName: string }>) {
  const results = await Promise.all(
    parents.map(async (parent) => {
      const response = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            to: parent.email,
            templateId: 'permission_slip_created',
            templateData: {
              parentName: parent.name,
              studentName: parent.studentName,
              teacherName: 'Ms. Smith',
              venueName: 'Science Museum',
              tripDate: 'March 15, 2024',
              magicLink: `https://parent.tripslip.com/slip/${parent.email}`,
            },
            language: 'en',
          }),
        }
      );

      return response.json();
    })
  );

  console.log('Batch send results:', results);
  const successCount = results.filter(r => r.success).length;
  console.log(`Successfully sent ${successCount} out of ${results.length} emails`);
}

// Example 5: Error handling
async function sendEmailWithErrorHandling() {
  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          to: 'parent@example.com',
          templateId: 'permission_slip_created',
          templateData: {
            parentName: 'John Doe',
            studentName: 'Jane Doe',
            teacherName: 'Ms. Smith',
            venueName: 'Science Museum',
            tripDate: 'March 15, 2024',
            magicLink: 'https://parent.tripslip.com/slip/abc123',
          },
        }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      console.error('Email failed to send:', result.error);
      console.error('Attempts made:', result.attempts);
      
      // Handle failure (e.g., queue for retry, notify admin, etc.)
      // ...
    } else {
      console.log('Email sent successfully');
    }
  } catch (error) {
    console.error('Network error:', error);
    // Handle network errors
  }
}

export {
  sendPermissionSlipNotification,
  sendPaymentConfirmationSpanish,
  sendTripCancellationArabic,
  sendBatchNotifications,
  sendEmailWithErrorHandling,
};
