# Monitoring Service

The monitoring service provides error tracking and performance monitoring using Sentry across all TripSlip applications.

## Setup

### 1. Environment Configuration

Add your Sentry DSN to the `.env` file:

```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
```

The `VITE_SENTRY_DSN` is optional. If not provided, monitoring will be disabled (useful for local development).

### 2. Initialization

Monitoring is automatically initialized in each app's `main.tsx` file before React renders:

```typescript
import { initMonitoring } from '@tripslip/utils';

// Initialize Sentry monitoring if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  initMonitoring({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  });
}
```

## Usage

### Capturing Errors

Use `captureError` to report errors to Sentry with optional context:

```typescript
import { captureError } from '@tripslip/utils';

try {
  await processPayment(paymentData);
} catch (error) {
  captureError(error as Error, {
    paymentId: paymentData.id,
    amount: paymentData.amount,
    userId: user.id,
  });
  
  // Show user-friendly error message
  showErrorToast('Payment processing failed. Please try again.');
}
```

### Capturing Messages

Use `captureMessage` to log informational messages or warnings:

```typescript
import { captureMessage } from '@tripslip/utils';

// Log an info message
captureMessage('User completed onboarding', 'info');

// Log a warning
captureMessage('API rate limit approaching', 'warning');
```

### Setting User Context

Set user context after authentication to associate errors with specific users:

```typescript
import { setUser } from '@tripslip/utils';

// After successful login
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});
```

### Adding Breadcrumbs

Add breadcrumbs to track user actions leading up to an error:

```typescript
import { addBreadcrumb } from '@tripslip/utils';

addBreadcrumb({
  message: 'User clicked "Create Trip" button',
  level: 'info',
  category: 'ui',
  data: {
    venueId: selectedVenue.id,
    experienceId: selectedExperience.id,
  },
});
```

## Configuration

### Sample Rates

- **Production**: 10% of transactions are sampled (`tracesSampleRate: 0.1`)
- **Development**: 100% of transactions are sampled (`tracesSampleRate: 1.0`)

### Integrations

The monitoring service includes:

- **BrowserTracing**: Automatic performance monitoring for page loads and navigation
- **Replay**: Session replay for debugging (with PII masking enabled)

### Privacy

- All text is masked in session replays (`maskAllText: true`)
- All media is blocked in session replays (`blockAllMedia: true`)
- Session replay sample rate: 10% for normal sessions, 100% for error sessions

## Best Practices

1. **Always provide context**: Include relevant data when capturing errors to aid debugging
2. **Don't log sensitive data**: Never include passwords, tokens, or PII in error context
3. **Use appropriate severity levels**: Use `info` for informational messages, `warning` for warnings, `error` for errors
4. **Set user context early**: Call `setUser` immediately after authentication
5. **Add breadcrumbs for key actions**: Track important user interactions to understand error context

## Testing

Monitoring is fully tested with unit and integration tests. See:
- `packages/utils/src/__tests__/monitoring.test.ts`
- `packages/utils/src/__tests__/monitoring-integration.test.ts`

## Troubleshooting

### Monitoring not working

1. Verify `VITE_SENTRY_DSN` is set in your `.env` file
2. Check that the DSN is valid and the Sentry project exists
3. Ensure monitoring is initialized before any errors occur
4. Check browser console for Sentry initialization errors

### Too many events

If you're hitting Sentry rate limits:
1. Reduce `tracesSampleRate` in production
2. Filter out noisy errors in Sentry project settings
3. Use `beforeSend` hook to filter events (see Sentry docs)

### Missing user context

Ensure `setUser` is called after authentication and before any errors occur.
