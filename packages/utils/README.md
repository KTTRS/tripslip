# @tripslip/utils

Shared utility functions for TripSlip platform applications.

## Overview

Provides utilities for:
- Date formatting and timezone handling
- Input validation (email, phone, URL, etc.)
- Error handling and custom error types
- Retry logic with exponential backoff

## Usage

### Date Utilities

```tsx
import {
  formatDate,
  formatDateTime,
  formatRelativeDate,
  formatInTimezone,
  nowUTC,
  isPast,
  isFuture,
  addDays,
  daysBetween,
} from '@tripslip/utils';

// Format dates
formatDate('2023-04-29', 'PPP', 'en'); // 'April 29, 2023'
formatDate('2023-04-29', 'PPP', 'es'); // '29 de abril de 2023'
formatDateTime('2023-04-29T14:30:00Z', 'PPP p'); // 'April 29, 2023 at 2:30 PM'

// Relative dates
formatRelativeDate('2023-04-27'); // '2 days ago'

// Timezone handling
formatInTimezone('2023-04-29T14:30:00Z', 'America/New_York', 'PPP p');
// 'April 29, 2023 at 10:30 AM'

// UTC timestamps
const now = nowUTC(); // '2023-04-29T14:30:00.000Z'

// Date comparisons
isPast('2023-04-27'); // true
isFuture('2023-05-01'); // true

// Date math
const futureDate = addDays(new Date(), 7); // 7 days from now
const days = daysBetween('2023-04-29', '2023-05-06'); // 7
```

### Validation Utilities

```tsx
import {
  isValidEmail,
  isValidPhone,
  formatPhone,
  isValidUrl,
  isRequired,
  minLength,
  maxLength,
  inRange,
  isValidFileType,
  isValidFileSize,
  sanitizeHtml,
} from '@tripslip/utils';

// Email validation
isValidEmail('user@example.com'); // true
isValidEmail('invalid'); // false

// Phone validation
isValidPhone('+1 (555) 123-4567', 'US'); // true
formatPhone('+15551234567', 'US'); // '+1 (555) 123-4567'

// URL validation
isValidUrl('https://tripslip.com'); // true

// Required fields
isRequired('value'); // true
isRequired(''); // false

// String length
minLength('password', 8); // true if >= 8 chars
maxLength('text', 100); // true if <= 100 chars

// Number range
inRange(5, 1, 10); // true

// File validation
isValidFileType(file, ['image/jpeg', 'image/png']); // true if JPEG or PNG
isValidFileSize(file, 5 * 1024 * 1024); // true if <= 5MB

// HTML sanitization
sanitizeHtml('<script>alert("xss")</script>'); // '&lt;script&gt;...'
```

### Error Handling

```tsx
import {
  TripSlipError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  PaymentError,
  isTripSlipError,
  getUserFriendlyMessage,
  retryWithBackoff,
  withErrorHandling,
  logError,
} from '@tripslip/utils';

// Throw custom errors
throw new AuthenticationError('Invalid credentials');
throw new ValidationError('Invalid input', {
  email: 'Email is required',
  phone: 'Invalid phone number',
});
throw new NotFoundError('Trip not found');
throw new PaymentError('Card declined');

// Check error type
try {
  // ...
} catch (error) {
  if (isTripSlipError(error)) {
    console.log(error.code, error.statusCode);
  }
  
  // Get user-friendly message
  const message = getUserFriendlyMessage(error, 'en');
}

// Retry with exponential backoff
const result = await retryWithBackoff(
  async () => {
    return await fetchData();
  },
  3, // max attempts
  1000 // base delay (1s, 2s, 4s)
);

// Wrap function with error handling
const safeFetch = withErrorHandling(async (url: string) => {
  const response = await fetch(url);
  return response.json();
});

// Log errors with context
try {
  // ...
} catch (error) {
  logError(error, {
    userId: '123',
    action: 'create_trip',
  });
}
```

## Error Types

### TripSlipError (Base)
- `code`: Error code string
- `statusCode`: HTTP status code
- `message`: Error message

### AuthenticationError (401)
- Authentication failed
- Invalid credentials
- Session expired

### AuthorizationError (403)
- Insufficient permissions
- Access denied

### ValidationError (400)
- Invalid input
- `fieldErrors`: Object with field-specific errors

### NotFoundError (404)
- Resource not found

### ConflictError (409)
- Resource conflict
- Duplicate entry

### RateLimitError (429)
- Rate limit exceeded

### PaymentError (402)
- Payment processing failed
- Card declined

### NetworkError (503)
- Network request failed
- Service unavailable

## Date Format Strings

Common format strings for `formatDate` and `formatDateTime`:

- `'PPP'` - April 29, 2023
- `'PP'` - Apr 29, 2023
- `'P'` - 04/29/2023
- `'p'` - 2:30 PM
- `'PPP p'` - April 29, 2023 at 2:30 PM
- `'EEEE, MMMM do'` - Saturday, April 29th
- `'yyyy-MM-dd'` - 2023-04-29

See [date-fns format documentation](https://date-fns.org/docs/format) for all options.

## Timezone Support

All timestamps should be stored in UTC in the database. Use timezone utilities to display in user's local time:

```tsx
// Store in UTC
const timestamp = nowUTC(); // '2023-04-29T14:30:00.000Z'

// Display in user's timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const localTime = formatInTimezone(timestamp, userTimezone, 'PPP p');
```

## Validation Patterns

### Form Validation Example

```tsx
import { isValidEmail, isRequired, minLength, createValidationResult } from '@tripslip/utils';

function validateForm(data: FormData) {
  const errors = [];
  
  if (!isRequired(data.email)) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }
  
  if (!isRequired(data.password)) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (!minLength(data.password, 8)) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }
  
  return createValidationResult(errors);
}
```
