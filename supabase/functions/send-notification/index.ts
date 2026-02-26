import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

// Email templates
const templates = {
  permission_slip_created: {
    en: {
      subject: 'New Permission Slip for {tripTitle}',
      body: `Hello {parentName},

A new permission slip has been created for {studentName}'s field trip to {tripTitle} on {tripDate}.

Please click the link below to view and sign the permission slip:
{magicLink}

Trip Details:
- Date: {tripDate}
- Cost: ${tripCost}
- Deadline: {deadline}

If you have any questions, please contact {teacherName} at {teacherEmail}.

Thank you,
TripSlip Team`
    },
    es: {
      subject: 'Nuevo Permiso para {tripTitle}',
      body: `Hola {parentName},

Se ha creado un nuevo permiso para la excursión de {studentName} a {tripTitle} el {tripDate}.

Haga clic en el enlace a continuación para ver y firmar el permiso:
{magicLink}

Detalles del viaje:
- Fecha: {tripDate}
- Costo: ${tripCost}
- Fecha límite: {deadline}

Si tiene alguna pregunta, comuníquese con {teacherName} en {teacherEmail}.

Gracias,
Equipo TripSlip`
    },
    ar: {
      subject: 'إذن جديد لـ {tripTitle}',
      body: `مرحبا {parentName}،

تم إنشاء إذن جديد لرحلة {studentName} إلى {tripTitle} في {tripDate}.

يرجى النقر على الرابط أدناه لعرض وتوقيع الإذن:
{magicLink}

تفاصيل الرحلة:
- التاريخ: {tripDate}
- التكلفة: ${tripCost}
- الموعد النهائي: {deadline}

إذا كان لديك أي أسئلة، يرجى الاتصال بـ {teacherName} على {teacherEmail}.

شكرا لك،
فريق TripSlip`
    }
  },
  payment_confirmed: {
    en: {
      subject: 'Payment Confirmed for {tripTitle}',
      body: `Hello {parentName},

Your payment of ${amount} for {studentName}'s field trip to {tripTitle} has been confirmed.

Receipt: {receiptUrl}

Thank you,
TripSlip Team`
    },
    es: {
      subject: 'Pago Confirmado para {tripTitle}',
      body: `Hola {parentName},

Su pago de ${amount} para la excursión de {studentName} a {tripTitle} ha sido confirmado.

Recibo: {receiptUrl}

Gracias,
Equipo TripSlip`
    },
    ar: {
      subject: 'تم تأكيد الدفع لـ {tripTitle}',
      body: `مرحبا {parentName}،

تم تأكيد دفعتك بمبلغ ${amount} لرحلة {studentName} إلى {tripTitle}.

الإيصال: {receiptUrl}

شكرا لك،
فريق TripSlip`
    }
  },
  trip_cancelled: {
    en: {
      subject: 'Trip Cancelled: {tripTitle}',
      body: `Hello {parentName},

Unfortunately, the field trip to {tripTitle} scheduled for {tripDate} has been cancelled.

{refundMessage}

We apologize for any inconvenience.

TripSlip Team`
    },
    es: {
      subject: 'Viaje Cancelado: {tripTitle}',
      body: `Hola {parentName},

Desafortunadamente, la excursión a {tripTitle} programada para {tripDate} ha sido cancelada.

{refundMessage}

Pedimos disculpas por cualquier inconveniente.

Equipo TripSlip`
    },
    ar: {
      subject: 'تم إلغاء الرحلة: {tripTitle}',
      body: `مرحبا {parentName}،

للأسف، تم إلغاء الرحلة إلى {tripTitle} المقررة في {tripDate}.

{refundMessage}

نعتذر عن أي إزعاج.

فريق TripSlip`
    }
  },
  trip_approved: {
    en: {
      subject: 'Trip Approved: {tripTitle}',
      body: `Hello {teacherName},

Your field trip to {tripTitle} on {tripDate} has been approved by {administratorName}.

{comments}

You can now proceed with your trip preparations.

Best regards,
TripSlip School Administration`
    },
    es: {
      subject: 'Viaje Aprobado: {tripTitle}',
      body: `Hola {teacherName},

Su excursión a {tripTitle} el {tripDate} ha sido aprobada por {administratorName}.

{comments}

Ahora puede proceder con los preparativos del viaje.

Saludos cordiales,
Administración Escolar TripSlip`
    },
    ar: {
      subject: 'تمت الموافقة على الرحلة: {tripTitle}',
      body: `مرحبا {teacherName}،

تمت الموافقة على رحلتك إلى {tripTitle} في {tripDate} من قبل {administratorName}.

{comments}

يمكنك الآن المضي قدمًا في استعدادات رحلتك.

مع أطيب التحيات،
إدارة مدرسة TripSlip`
    }
  },
  trip_rejected: {
    en: {
      subject: 'Trip Rejected: {tripTitle}',
      body: `Hello {teacherName},

Your field trip to {tripTitle} on {tripDate} has been rejected by {administratorName}.

Reason: {reason}

Please contact the school administration if you have any questions.

Best regards,
TripSlip School Administration`
    },
    es: {
      subject: 'Viaje Rechazado: {tripTitle}',
      body: `Hola {teacherName},

Su excursión a {tripTitle} el {tripDate} ha sido rechazada por {administratorName}.

Razón: {reason}

Comuníquese con la administración escolar si tiene alguna pregunta.

Saludos cordiales,
Administración Escolar TripSlip`
    },
    ar: {
      subject: 'تم رفض الرحلة: {tripTitle}',
      body: `مرحبا {teacherName}،

تم رفض رحلتك إلى {tripTitle} في {tripDate} من قبل {administratorName}.

السبب: {reason}

يرجى الاتصال بإدارة المدرسة إذا كان لديك أي أسئلة.

مع أطيب التحيات،
إدارة مدرسة TripSlip`
    }
  },
  custom: {
    en: {
      subject: '{subject}',
      body: '{body}'
    },
    es: {
      subject: '{subject}',
      body: '{body}'
    },
    ar: {
      subject: '{subject}',
      body: '{body}'
    }
  }
}

function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] || '')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, userType, channel, templateName, language, data, isCritical } = await req.json()

    // Get user preferences
    const { data: user } = await supabase
      .from(userType === 'parent' ? 'parents' : userType === 'teacher' ? 'teachers' : 'venue_users')
      .select('email, phone, language')
      .eq('user_id', userId)
      .single()

    if (!user) {
      throw new Error('User not found')
    }

    const userLanguage = language || user.language || 'en'
    const template = templates[templateName]?.[userLanguage] || templates[templateName]?.en

    if (!template) {
      throw new Error('Template not found')
    }

    const subject = interpolate(template.subject, data)
    const body = interpolate(template.body, data)

    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        user_type: userType,
        channel: channel,
        subject: subject,
        body: body,
        is_critical: isCritical || false,
        status: 'pending',
        metadata: data
      })
      .select()
      .single()

    if (notificationError) {
      throw notificationError
    }

    // Send based on channel
    if (channel === 'email') {
      // In production, integrate with email service (SendGrid, Resend, etc.)
      console.log('Sending email to:', user.email)
      console.log('Subject:', subject)
      console.log('Body:', body)
      
      // Mark as sent
      await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id)
    } else if (channel === 'sms') {
      // In production, integrate with SMS service (Twilio, etc.)
      console.log('Sending SMS to:', user.phone)
      console.log('Message:', body)
      
      await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id)
    } else if (channel === 'in_app') {
      // In-app notifications are already created, just mark as sent
      await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id)
    }

    return new Response(
      JSON.stringify({ notification }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
