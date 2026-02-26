# @tripslip/auth

Authentication utilities and session management for TripSlip platform applications.

## Overview

This package provides authentication services supporting multiple patterns:
- **Required authentication** (venues) - Email/password
- **Optional authentication** (teachers, parents) - Magic links/OTP
- **Direct link access** (teachers) - Token-based read-only access
- **Magic link access** (parents) - Time-limited permission slip access

## Usage

### Creating an Auth Service

```tsx
import { createSupabaseClient } from '@tripslip/database';
import { createAuthService } from '@tripslip/auth';

const supabase = createSupabaseClient(url, key);
const auth = createAuthService(supabase);
```

### Venue Authentication (Required)

```tsx
// Sign in with email/password
const { user, session } = await auth.signInWithPassword(
  'venue@example.com',
  'password'
);

// Sign out
await auth.signOut();
```

### Teacher/Parent Authentication (Optional)

```tsx
// Send magic link
await auth.signInWithOtp('teacher@example.com');

// Verify OTP from email
const { user, session } = await auth.verifyOtp(
  'teacher@example.com',
  '123456'
);
```

### Direct Link Access (Teachers)

```tsx
// Verify direct link token
const { tripId, data } = await auth.verifyDirectLink(token);

// Access trip data without authentication
console.log('Trip:', data);
```

### Magic Link Access (Parents)

```tsx
// Verify magic link token
const { slipId, data } = await auth.verifyMagicLink(token);

// Access permission slip without authentication
console.log('Permission Slip:', data);
```

### Session Management

```tsx
import { sessionStorage } from '@tripslip/auth';

// Save session
sessionStorage.save(session);

// Load session
const session = sessionStorage.load();

// Check if expired
if (sessionStorage.isExpired(session)) {
  await auth.refreshSession();
}

// Remove session
sessionStorage.remove();
```

### Temporary Session Storage

For unauthenticated users (teachers using direct links):

```tsx
import { tempSessionStorage } from '@tripslip/auth';

// Save temporary data
tempSessionStorage.save({ tripId, students: [...] });

// Load temporary data
const data = tempSessionStorage.load();

// Convert to permanent account
const { user, session } = await auth.signUp(email, password);
// Migrate temp data to user account
```

### Token Generation

```tsx
import {
  generateMagicLinkToken,
  generateDirectLinkToken,
  isValidTokenFormat,
  isTokenExpired,
} from '@tripslip/auth';

// Generate magic link token (7-day expiration)
const { token, expiresAt } = generateMagicLinkToken();

// Generate direct link token (non-expiring)
const directToken = generateDirectLinkToken();

// Validate token format
if (isValidTokenFormat(token)) {
  // Token is valid format
}

// Check if expired
if (isTokenExpired(expiresAt)) {
  // Token has expired
}
```

### Rate Limiting

```tsx
import { magicLinkRateLimiter } from '@tripslip/auth';

// Check rate limit before generating magic link
if (magicLinkRateLimiter.isRateLimited(userEmail)) {
  throw new Error('Too many magic link requests. Please try again later.');
}

// Generate magic link...
```

## Authentication Patterns

### Venue App (Required Auth)
1. User visits venue.tripslip.com
2. Redirected to login if not authenticated
3. Sign in with email/password
4. Session persisted in localStorage
5. Auto-refresh on expiration

### Teacher App (Optional Auth)
1. **Direct Link**: Access via shareable link, data in sessionStorage
2. **Account**: Sign in with magic link, data persisted to database
3. **Conversion**: Convert direct link session to permanent account

### Parent App (Optional Auth)
1. **Magic Link**: One-time access to specific permission slip
2. **Account**: Create account to view all children's slips
3. **Conversion**: Link magic link slip to account

## Security Features

- Cryptographically secure token generation (32+ characters)
- Magic link expiration (7 days default)
- Rate limiting (10 magic links per hour)
- Session auto-refresh
- Secure session storage
- Token format validation

## API Reference

### AuthService Interface

```tsx
interface AuthService {
  signInWithPassword(email: string, password: string): Promise<{ user: User; session: Session }>;
  signInWithOtp(email: string): Promise<void>;
  verifyOtp(email: string, token: string): Promise<{ user: User; session: Session }>;
  verifyDirectLink(token: string): Promise<{ tripId: string; data: any }>;
  verifyMagicLink(token: string): Promise<{ slipId: string; data: any }>;
  getSession(): Promise<Session | null>;
  getUser(): Promise<User | null>;
  signOut(): Promise<void>;
  refreshSession(): Promise<Session>;
  signUp(email: string, password: string): Promise<{ user: User; session: Session }>;
}
```
