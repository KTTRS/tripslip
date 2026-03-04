# Send Email Edge Function

Email notification service for TripSlip platform with multi-language support and retry logic.

## Features

- **Template Interpolation**: Dynamic variable replacement in email templates
- **Multi-Language Support**: English, Spanish, and Arabic (with RTL support)
- **Retry Logic**: Automatic retry up to 3 times with exponential backoff
- **Email Provider Support**: SendGrid and Resend
- **Delivery Logging**: Tracks email delivery status in database

## Environment Variables

Required environment variables:

```bash
# Email Provider (sendgrid or resend)
EMAIL_PROVIDER=sendgrid

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key

# Resend Configuration (alternative)
RESEND_API_KEY=your_resend_api_key

# From Email
FROM_EMAIL=notifications@tripslip.com

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Request Format

```typescript
POST /functions/v1/send-email

{
  "to": "parent@example.com",
  "templateId": "permission_slip_created",
  "templateData": {
    "parentName": "John Doe",
    "studentName": "Jane Doe",
    "teacherName": "Ms. Smith",
    "venueName": "Science Museum",
    "tripDate": "March 15, 2024",
    "magicLink": "https://parent.tripslip.com/slip/abc123"
  },
  "language": "en" // Optional: en, es, or ar (defaults to en)
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Email sent successfully",
  "attempts": 1
}
```

### Error Response

```json
{
  "success": false,
  "error": "SendGrid error (401): Unauthorized",
  "attempts": 3
}
```

## Available Templates

### permission_slip_created
Sent when a teacher creates a new permission slip.

**Required template data:**
- `parentName`: Parent's name
- `studentName`: Student's name
- `teacherName`: Teacher's name
- `venueName`: Venue name
- `tripDate`: Trip date
- `magicLink`: Link to sign permission slip

### payment_confirmed
Sent when a payment is successfully processed.

**Required template data:**
- `parentName`: Parent's name
- `studentName`: Student's name
- `tripName`: Trip name
- `amount`: Payment amount
- `receiptUrl`: Link to receipt

### trip_cancelled
Sent when a trip is cancelled.

**Required template data:**
- `parentName`: Parent's name
- `tripName`: Trip name
- `tripDate`: Original trip date
- `refundMessage`: Refund information message

## Retry Logic

The function implements exponential backoff retry logic:

1. **Attempt 1**: Immediate send
2. **Attempt 2**: Wait 1 second, retry
3. **Attempt 3**: Wait 2 seconds, retry

After 3 failed attempts, the function returns an error response and logs the failure.

## Delivery Logging

All email delivery attempts are logged to the `email_logs` table:

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent' or 'failed'
  attempts INTEGER NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Testing

Run tests with:

```bash
cd supabase/functions
npm test send-email
```

## Design System Compliance

Email templates follow the TripSlip design system:

- **Colors**: Primary Yellow (#F5C518), Black (#0A0A0A), White (#FFFFFF)
- **Typography**: Fraunces for headings, Plus Jakarta Sans for body
- **Borders**: 2px solid black borders
- **Shadows**: 4px offset shadows on buttons
- **RTL Support**: Arabic templates use `dir="rtl"` attribute

## Usage Example

```typescript
// From another Edge Function or application
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-email`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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
      language: 'en',
    }),
  }
);

const result = await response.json();
console.log(result); // { success: true, message: "Email sent successfully", attempts: 1 }
```
