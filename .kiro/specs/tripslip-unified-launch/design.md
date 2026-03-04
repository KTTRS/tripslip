# Design: TripSlip Unified Launch Specification

## Architecture Overview

This design addresses both critical codebase fixes and complete platform launch requirements through a systematic, phased approach. The architecture maintains the existing TripSlip technology stack while ensuring production readiness.

## Design Principles

1. **Fix First, Then Build:** Address critical issues before adding new functionality
2. **Fail Fast:** Validate environment and configuration at startup
3. **Graceful Degradation:** Handle failures without breaking user experience
4. **Consistent Patterns:** Use same approach for similar problems
5. **Type Safety:** Leverage TypeScript for compile-time error detection
6. **Testability:** All implementations must be testable
7. **Security First:** Validate and sanitize all inputs
8. **Performance Focused:** Optimize for speed and scalability

## System Architecture

### High-Level Architecture
```
Frontend Applications (5)
├── Landing App (tripslip.com)
├── Venue App (venue.tripslip.com)
├── School App (school.tripslip.com)
├── Teacher App (teacher.tripslip.com)
└── Parent App (parent.tripslip.com)

Supabase Backend
├── PostgreSQL Database
├── Authentication Service
├── Storage Service
└── Edge Functions

External Services
├── Stripe (Payments)
├── SendGrid/Resend (Email)
├── Twilio (SMS)
└── Sentry (Monitoring)

Infrastructure
├── Vercel/Netlify (Frontend Hosting)
├── GitHub Actions (CI/CD)
└── CDN (Static Assets)
```

## Phase Implementation Strategy

### Phase 1: Critical Infrastructure Fixes

**Environment Validation System**
```typescript
// packages/utils/src/env-validation.ts
export interface EnvConfig {
  required: string[];
  optional?: string[];
}

export function validateEnv(config: EnvConfig): void {
  const missing = config.required.filter(
    key => !import.meta.env[key] || import.meta.env[key] === ''
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}`
    );
  }
}
```

**Centralized Logging System**
```typescript
// packages/utils/src/logger.ts
export class Logger {
  private isDevelopment = import.meta.env.DEV;

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.debug(message, context);
    }
    // Add breadcrumb for Sentry
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.error(message, error, context);
    }
    // Send to Sentry in production
  }
}
```

### Phase 2: Third-Party Integrations

**Stripe Payment Integration**
```typescript
// supabase/functions/create-payment-intent/index.ts
export async function createPaymentIntent(request: PaymentIntentRequest) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: request.amountCents,
    currency: 'usd',
    metadata: {
      permission_slip_id: request.permissionSlipId,
      parent_id: request.parentId,
    },
  });

  // Store payment record
  await supabase.from('payments').insert({
    permission_slip_id: request.permissionSlipId,
    stripe_payment_intent_id: paymentIntent.id,
    status: 'pending',
  });

  return { clientSecret: paymentIntent.client_secret };
}
```

**Email Notification Service**
```typescript
// supabase/functions/send-email/index.ts
export async function sendEmail(request: EmailRequest) {
  const template = EMAIL_TEMPLATES[request.templateId]?.[request.language];
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: request.to }] }],
      from: { email: 'notifications@tripslip.com' },
      subject: interpolate(template.subject, request.data),
      content: [{ type: 'text/html', value: interpolate(template.html, request.data) }],
    }),
  });

  return { success: response.ok };
}
```

This design continues with detailed implementations for each phase...