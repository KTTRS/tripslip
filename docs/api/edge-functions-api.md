# Edge Functions API Documentation

**TripSlip Edge Functions** - Complete API reference for Supabase Edge Functions

## Authentication

All Edge Functions require authentication via Supabase JWT token or service role key.

### Headers

```
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
Content-Type: application/json
```

## Payment Functions

### Create Payment Intent

**Endpoint:** `POST /functions/v1/create-payment-intent`

Creates a Stripe payment intent for a permission slip payment.

**Request Body:**
```json
{
  "permissionSlipId": "uuid",
  "amount": 5000,
  "currency": "usd",
  "metadata": {
    "studentName": "John Doe",
    "tripName": "Museum Visit"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 5000,
  "currency": "usd"
}
```

**Error Responses:**
- `400`: Invalid request parameters
- `401`: Unauthorized
- `500`: Payment intent creation failed

### Stripe Webhook

**Endpoint:** `POST /functions/v1/stripe-webhook`

Handles Stripe webhook events for payment processing.

**Headers:**
```
stripe-signature: <webhook_signature>
```

**Supported Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `refund.created`
- `charge.refunded`

**Response:**
```json
{
  "received": true
}
```

### Create Stripe Connect Link

**Endpoint:** `POST /functions/v1/create-stripe-connect-link`

Creates a Stripe Connect onboarding link for venues.

**Request Body:**
```json
{
  "venueId": "uuid",
  "refreshUrl": "https://venue.tripslip.com/settings",
  "returnUrl": "https://venue.tripslip.com/settings/success"
}
```

**Response:**
```json
{
  "url": "https://connect.stripe.com/setup/...",
  "expiresAt": 1234567890
}
```

## Notification Functions

### Send Email

**Endpoint:** `POST /functions/v1/send-email`

Sends email notifications using configured email provider.

**Request Body:**
```json
{
  "to": "parent@example.com",
  "template": "permission_slip_created",
  "data": {
    "studentName": "John Doe",
    "tripName": "Museum Visit",
    "magicLink": "https://parent.tripslip.com/slip/xxx"
  },
  "language": "en"
}
```

**Supported Templates:**
- `permission_slip_created`
- `permission_slip_reminder`
- `payment_received`
- `payment_failed`
- `trip_cancelled`
- `trip_updated`

**Supported Languages:**
- `en` - English
- `es` - Spanish
- `ar` - Arabic

**Response:**
```json
{
  "success": true,
  "messageId": "msg_xxx",
  "status": "sent"
}
```

**Error Responses:**
- `400`: Invalid email or template
- `401`: Unauthorized
- `500`: Email delivery failed

### Send SMS

**Endpoint:** `POST /functions/v1/send-sms`

Sends SMS notifications using Twilio.

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Your child's permission slip is ready",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SM_xxx",
  "status": "sent"
}
```

**Error Responses:**
- `400`: Invalid phone number
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: SMS delivery failed

## Data Export Functions

### Export Student Data

**Endpoint:** `POST /functions/v1/export-student-data`

Exports student data for FERPA compliance requests.

**Request Body:**
```json
{
  "studentId": "uuid",
  "format": "csv",
  "includeHistory": true
}
```

**Supported Formats:**
- `csv` - Comma-separated values
- `json` - JSON format

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://storage.supabase.co/...",
  "expiresAt": 1234567890,
  "format": "csv"
}
```

**Authorization:**
- Requires parent/guardian authentication
- Or school administrator with proper permissions
- Audit log created for all exports

## Rate Limiting

All Edge Functions implement rate limiting:

- **Default**: 100 requests per minute per IP
- **Payment Functions**: 10 requests per minute per user
- **Email/SMS**: 20 requests per minute per user
- **Export Functions**: 5 requests per minute per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Security

### Request Validation

All requests are validated for:
- Valid JWT token
- Proper authorization
- Input sanitization
- CSRF protection

### Data Protection

- All data encrypted in transit (TLS 1.3)
- Sensitive data encrypted at rest
- PII handling follows FERPA guidelines
- Audit logging for all operations

## Testing

### Test Mode

Use test API keys for development:

```
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_ANON_KEY=test_anon_key
STRIPE_SECRET_KEY=sk_test_xxx
```

### Test Webhooks

Use Stripe CLI for webhook testing:

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Monitoring

### Health Check

**Endpoint:** `GET /functions/v1/health`

Returns health status of Edge Functions.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "version": "1.0.0"
}
```

### Metrics

Monitor via Supabase Dashboard:
- Request count
- Error rate
- Response time
- Success rate

## Support

For API support:
- Email: api@tripslip.com
- Documentation: docs.tripslip.com
- Status: status.tripslip.com
