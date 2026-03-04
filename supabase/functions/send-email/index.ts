import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  templateId: string;
  templateData: Record<string, string>;
  language?: 'en' | 'es' | 'ar';
}

interface EmailTemplate {
  subject: string;
  html: string;
}

type TemplateMap = Record<string, Record<'en' | 'es' | 'ar', EmailTemplate>>;

// Email templates with HTML formatting following TripSlip design system
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
            <a href="{{magicLink}}" style="
              display: inline-block;
              background: #F5C518;
              color: #0A0A0A;
              padding: 14px 28px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              border: 2px solid #0A0A0A;
              box-shadow: 4px 4px 0px #0A0A0A;
              margin: 24px 0;
              transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
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
            <a href="{{magicLink}}" style="
              display: inline-block;
              background: #F5C518;
              color: #0A0A0A;
              padding: 14px 28px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              border: 2px solid #0A0A0A;
              box-shadow: 4px 4px 0px #0A0A0A;
              margin: 24px 0;
            ">
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
            <a href="{{magicLink}}" style="
              display: inline-block;
              background: #F5C518;
              color: #0A0A0A;
              padding: 14px 28px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              border: 2px solid #0A0A0A;
              box-shadow: 4px 4px 0px #0A0A0A;
              margin: 24px 0;
            ">
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
  employee_invitation: {
    en: {
      subject: 'You\'ve been invited to join {{venueName}} on TripSlip',
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">You're Invited!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Hello {{employeeName}},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">{{inviterName}} has invited you to join <strong>{{venueName}}</strong> on TripSlip as a {{role}}.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">TripSlip is a digital field trip management platform that helps venues connect with schools and manage field trip experiences.</p>
            <a href="{{invitationLink}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">Accept Invitation</a>
            <p style="font-size: 14px; line-height: 1.5; color: #6B7280; margin: 16px 0 0 0;">This invitation expires in 7 days. If you have any questions, please contact {{inviterName}}.</p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. All rights reserved.</p>
          </div>
        </div>
      `,
    },
    es: {
      subject: 'Has sido invitado a unirte a {{venueName}} en TripSlip',
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">¡Estás Invitado!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">Hola {{employeeName}},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">{{inviterName}} te ha invitado a unirte a <strong>{{venueName}}</strong> en TripSlip como {{role}}.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">TripSlip es una plataforma digital de gestión de excursiones que ayuda a los lugares a conectarse con las escuelas.</p>
            <a href="{{invitationLink}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">Aceptar Invitación</a>
            <p style="font-size: 14px; line-height: 1.5; color: #6B7280; margin: 16px 0 0 0;">Esta invitación expira en 7 días.</p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    },
    ar: {
      subject: 'تمت دعوتك للانضمام إلى {{venueName}} على TripSlip',
      html: `
        <div dir="rtl" style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
          <div style="background: #F5C518; padding: 24px; border: 2px solid #0A0A0A;">
            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; margin: 0; color: #0A0A0A;">TripSlip</h1>
          </div>
          <div style="padding: 32px 24px; border: 2px solid #0A0A0A; border-top: none;">
            <h2 style="font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 16px 0;">أنت مدعو!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">مرحبا {{employeeName}}،</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">دعاك {{inviterName}} للانضمام إلى <strong>{{venueName}}</strong> على TripSlip كـ {{role}}.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #0A0A0A; margin: 0 0 16px 0;">TripSlip هي منصة رقمية لإدارة الرحلات المدرسية.</p>
            <a href="{{invitationLink}}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; margin: 24px 0;">قبول الدعوة</a>
            <p style="font-size: 14px; line-height: 1.5; color: #6B7280; margin: 16px 0 0 0;">تنتهي صلاحية هذه الدعوة خلال 7 أيام.</p>
          </div>
          <div style="padding: 16px 24px; background: #F9FAFB; border: 2px solid #0A0A0A; border-top: none; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">© 2024 TripSlip. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      `,
    },
  },
};

// Template interpolation function
function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

// Retry logic with exponential backoff
async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  maxRetries = 3
): Promise<{ success: boolean; error?: string; attempts: number }> {
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const emailProvider = Deno.env.get('EMAIL_PROVIDER') || 'sendgrid';
      
      if (emailProvider === 'sendgrid') {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { 
              email: Deno.env.get('FROM_EMAIL') || 'notifications@tripslip.com', 
              name: 'TripSlip' 
            },
            subject,
            content: [{ type: 'text/html', value: html }],
          }),
        });
        
        if (response.ok) {
          return { success: true, attempts: attempt };
        }
        
        const errorText = await response.text();
        lastError = `SendGrid error (${response.status}): ${errorText}`;
      } else if (emailProvider === 'resend') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('FROM_EMAIL') || 'notifications@tripslip.com',
            to: [to],
            subject,
            html,
          }),
        });
        
        if (response.ok) {
          return { success: true, attempts: attempt };
        }
        
        const errorText = await response.text();
        lastError = `Resend error (${response.status}): ${errorText}`;
      } else {
        throw new Error(`Unsupported email provider: ${emailProvider}`);
      }
    } catch (error: any) {
      lastError = error.message;
    }
    
    // Wait before retry with exponential backoff (1s, 2s, 4s)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  return { success: false, error: lastError, attempts: maxRetries };
}

// Log email delivery status
async function logEmailDelivery(
  to: string,
  templateId: string,
  status: 'sent' | 'failed',
  attempts: number,
  error?: string
) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  await supabase.from('email_logs').insert({
    to_email: to,
    template_id: templateId,
    status,
    attempts,
    error_message: error,
    sent_at: new Date().toISOString(),
  });
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, templateId, templateData, language = 'en' } = await req.json() as EmailRequest;
    
    // Validate input
    if (!to || !templateId || !templateData) {
      throw new Error('Missing required fields: to, templateId, templateData');
    }
    
    // Get template
    const template = EMAIL_TEMPLATES[templateId]?.[language];
    if (!template) {
      throw new Error(`Template '${templateId}' not found for language '${language}'`);
    }
    
    // Interpolate template
    const subject = interpolate(template.subject, templateData);
    const html = interpolate(template.html, templateData);
    
    // Send email with retry logic
    const result = await sendEmailWithRetry(to, subject, html);
    
    // Log delivery status
    await logEmailDelivery(
      to,
      templateId,
      result.success ? 'sent' : 'failed',
      result.attempts,
      result.error
    );
    
    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          attempts: result.attempts 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          attempts: result.attempts 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  } catch (error: any) {
    console.error('Email send error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
