import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  language?: 'en' | 'es' | 'ar';
  userId?: string;
}

// Opt-out instructions in multiple languages
const OPT_OUT_TEXT = {
  en: 'Reply STOP to unsubscribe',
  es: 'Responda STOP para cancelar',
  ar: 'رد STOP لإلغاء الاشتراك',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_HOURS = 1; // 1 hour window
const RATE_LIMIT_MAX_SMS = 10; // Max 10 SMS per hour per user

// Check rate limit for a user using database
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Count SMS sent in the last hour
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('rate_limits')
    .select('id')
    .eq('identifier', `sms:${userId}`)
    .gte('created_at', oneHourAgo);
  
  if (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return { allowed: true, remaining: RATE_LIMIT_MAX_SMS };
  }
  
  const count = data?.length || 0;
  
  if (count >= RATE_LIMIT_MAX_SMS) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining: RATE_LIMIT_MAX_SMS - count };
}

// Increment rate limit counter in database
async function incrementRateLimit(userId: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  await supabase
    .from('rate_limits')
    .insert({
      identifier: `sms:${userId}`,
    });
}

// Send SMS via Twilio
async function sendSMSViaTwilio(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, messageId: data.sid };
    }
    
    const errorData = await response.json();
    return { 
      success: false, 
      error: `Twilio error (${response.status}): ${errorData.message || 'Unknown error'}` 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Log SMS delivery status
async function logSMSDelivery(
  to: string,
  message: string,
  status: 'sent' | 'failed',
  error?: string,
  messageId?: string
) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  await supabase.from('sms_logs').insert({
    to_phone: to,
    message_preview: message.substring(0, 100),
    status,
    error_message: error,
    twilio_message_id: messageId,
    sent_at: new Date().toISOString(),
  });
}

// Check if user has opted in to SMS notifications
async function checkSMSOptIn(userId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('sms_enabled')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    // Default to false if preferences not found
    return false;
  }
  
  return data.sms_enabled === true;
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, message, language = 'en', userId } = await req.json() as SMSRequest;
    
    // Validate input
    if (!to || !message) {
      throw new Error('Missing required fields: to, message');
    }
    
    // Check opt-in status if userId provided
    if (userId) {
      const hasOptedIn = await checkSMSOptIn(userId);
      if (!hasOptedIn) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'User has not opted in to SMS notifications' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }
      
      // Check rate limit
      const rateLimit = await checkRateLimit(userId);
      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded. Please try again later.',
            rateLimitRemaining: 0
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429 
          }
        );
      }
    }
    
    // Add opt-out instructions
    const optOutText = OPT_OUT_TEXT[language] || OPT_OUT_TEXT.en;
    const fullMessage = `${message}\n\n${optOutText}`;
    
    // Increment rate limit BEFORE sending (to prevent abuse via failed sends)
    if (userId) {
      await incrementRateLimit(userId);
    }
    
    // Send SMS
    const result = await sendSMSViaTwilio(to, fullMessage);
    
    // Log delivery status
    await logSMSDelivery(
      to,
      fullMessage,
      result.success ? 'sent' : 'failed',
      result.error,
      result.messageId
    );
    
    if (result.success) {
      const rateLimit = userId ? await checkRateLimit(userId) : null;
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMS sent successfully',
          messageId: result.messageId,
          rateLimitRemaining: rateLimit?.remaining
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
          error: result.error 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  } catch (error: any) {
    console.error('SMS send error:', error);
    
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
