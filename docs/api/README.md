# TripSlip API Documentation

## Overview

TripSlip uses Supabase for backend services, providing:
- RESTful API via PostgREST
- Real-time subscriptions via WebSockets
- Edge Functions for custom logic
- Row Level Security (RLS) for data protection

## Authentication

All API requests require authentication via Supabase Auth:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});
```

## Core Entities

### Permission Slips
```typescript
// Get permission slips
const { data } = await supabase
  .from('permission_slips')
  .select('*')
  .eq('parent_id', userId);

// Sign permission slip
const { data } = await supabase
  .from('permission_slips')
  .update({ status: 'signed', signed_at: new Date() })
  .eq('id', slipId);
```

### Trips
```typescript
// Create trip
const { data } = await supabase
  .from('trips')
  .insert({
    name: 'Science Museum Visit',
    trip_date: '2024-06-15',
    venue_id: venueId,
    teacher_id: teacherId,
  });
```

### Payments
```typescript
// Create payment intent
const { data } = await supabase.functions.invoke('create-payment-intent', {
  body: { amount: 50000, slip_id: slipId },
});
```

## Edge Functions

### create-payment-intent
Creates a Stripe payment intent.

**Request:**
```json
{
  "amount": 50000,
  "slip_id": "uuid",
  "metadata": {}
}
```

**Response:**
```json
{
  "client_secret": "pi_xxx_secret_yyy",
  "payment_id": "uuid"
}
```

### send-email
Sends templated emails.

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Permission Slip Signed",
  "template": "permission-slip-signed",
  "data": {}
}
```

### send-sms
Sends SMS notifications.

**Request:**
```json
{
  "to": "+15555551234",
  "message": "Your permission slip has been signed",
  "language": "en"
}
```

## Real-time Subscriptions

```typescript
// Subscribe to permission slip changes
const subscription = supabase
  .channel('permission-slips')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'permission_slips',
      filter: `parent_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();
```

## Rate Limits

- Authentication: 10 attempts per 15 minutes
- Password reset: 3 attempts per hour
- Magic links: 5 attempts per hour
- SMS: 5 messages per minute per phone number

## Error Handling

All errors follow this format:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Support

For API support, contact api@tripslip.com
