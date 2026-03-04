# Send SMS Edge Function

This Supabase Edge Function sends SMS notifications via Twilio with multi-language support, opt-out instructions, and rate limiting.

## Features

- **Twilio Integration**: Sends SMS messages via Twilio API
- **Multi-Language Support**: Supports English, Spanish, and Arabic opt-out instructions
- **Opt-In Enforcement**: Checks user notification preferences before sending
- **Rate Limiting**: Limits SMS sends to 10 per hour per user to prevent abuse and control costs
- **Automatic Opt-Out Instructions**: Appends "Reply STOP to unsubscribe" in the user's language
- **Delivery Logging**: Logs all SMS attempts to `sms_logs` table

## Environment Variables

Required environment variables:

```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Request Format

```typescript
POST /functions/v1/send-sms

{
  "to": "+1234567890",           // Required: Recipient phone number (E.164 format)
  "message": "Your trip reminder", // Required: SMS message content
  "language": "en",               // Optional: 'en' | 'es' | 'ar' (default: 'en')
  "userId": "uuid"                // Optional: User ID for opt-in check and rate limiting
}
```

## Response Format

### Success (200)
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "messageId": "SM1234567890abcdef",
  "rateLimitRemaining": 9
}
```

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "rateLimitRemaining": 0
}
```

### Opt-In Required (403)
```json
{
  "success": false,
  "error": "User has not opted in to SMS notifications"
}
```

### Error (400/500)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Rate Limiting

- **Limit**: 10 SMS per hour per user
- **Window**: 1 hour rolling window
- **Scope**: Per userId (if provided)
- **Purpose**: Prevent abuse and control Twilio costs

## Opt-Out Instructions

The function automatically appends opt-out instructions in the user's language:

- **English**: "Reply STOP to unsubscribe"
- **Spanish**: "Responda STOP para cancelar"
- **Arabic**: "رد STOP لإلغاء الاشتراك"

## Database Schema

The function expects the following tables:

### `notification_preferences`
```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  preferences JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `sms_logs`
```sql
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone TEXT NOT NULL,
  message_preview TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  twilio_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);
```

## Usage Examples

### Send Trip Reminder
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    to: '+1234567890',
    message: 'Reminder: Field trip to Science Museum tomorrow at 9 AM',
    language: 'en',
    userId: 'user-uuid',
  }),
});

const data = await response.json();
console.log(data);
```

### Send Payment Confirmation (Spanish)
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    to: '+1234567890',
    message: 'Su pago de $50.00 ha sido confirmado para la excursión.',
    language: 'es',
    userId: 'user-uuid',
  }),
});
```

### Send Urgent Update (Arabic)
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    to: '+1234567890',
    message: 'تحديث عاجل: تم تغيير موعد الرحلة إلى الغد الساعة 10 صباحاً',
    language: 'ar',
    userId: 'user-uuid',
  }),
});
```

## Testing

### Local Testing with Supabase CLI
```bash
# Start local Supabase
supabase start

# Deploy function locally
supabase functions deploy send-sms --no-verify-jwt

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "to": "+1234567890",
    "message": "Test message",
    "language": "en"
  }'
```

## Compliance

- **TCPA Compliance**: Always includes opt-out instructions
- **Opt-In Required**: Checks user preferences before sending
- **Rate Limiting**: Prevents spam and abuse
- **Logging**: All SMS attempts are logged for audit purposes

## Error Handling

The function handles various error scenarios:

1. **Missing Credentials**: Returns 400 if Twilio credentials not configured
2. **Invalid Phone Number**: Twilio will reject invalid E.164 format numbers
3. **Opt-Out**: Returns 403 if user has not opted in
4. **Rate Limit**: Returns 429 if user exceeds 10 SMS per hour
5. **Twilio Errors**: Returns 500 with Twilio error message

## Cost Considerations

- Twilio charges per SMS sent (typically $0.0075-$0.01 per message)
- Rate limiting helps control costs
- Consider implementing additional cost controls for production
- Monitor `sms_logs` table for usage patterns

## Security

- Uses Supabase service role key for database access
- Validates user opt-in status before sending
- Rate limiting prevents abuse
- CORS headers configured for security
- Phone numbers and messages logged for audit trail
