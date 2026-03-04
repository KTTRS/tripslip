# Authentication Package Tests

This package includes comprehensive test coverage for the authentication and RBAC system.

## Test Structure

```
src/__tests__/
├── setup.ts                          # Test setup and mocks
├── unit/                             # Unit tests (Task 25)
│   ├── rbac-service.signup.test.ts
│   ├── rbac-service.login.test.ts
│   ├── rbac-service.email-verification.test.ts
│   ├── rbac-service.password-reset.test.ts
│   ├── rbac-service.session.test.ts
│   └── rbac-service.role-switching.test.ts
├── property/                         # Property-based tests (Tasks 27-31)
│   ├── auth-properties.test.ts
│   ├── role-management-properties.test.ts
│   ├── data-access-properties.test.ts
│   ├── dashboard-properties.test.ts
│   └── authorization-properties.test.ts
└── integration/                      # Integration tests (Task 32)
    └── auth-flows.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run only unit tests
```bash
npm run test:unit
```

### Run only property-based tests
```bash
npm run test:property
```

### Run only integration tests
```bash
npm run test:integration
```

### Run tests with UI
```bash
npx vitest --ui
```

## Test Coverage

### Unit Tests (Task 25)
- ✅ Signup flow validation
- ✅ Login flow validation
- ✅ Email verification
- ✅ Password reset
- ✅ Session management
- ✅ Role switching

### Property-Based Tests (Tasks 27-31)
- ✅ Property 9: Signup Role Assignment
- ✅ Property 10: Valid Credentials Authentication
- ✅ Property 11: Session Invalidation on Logout
- ✅ Property 12: Token Expiration Enforcement
- ✅ Property 13: Duplicate Email Rejection
- ✅ Property 14: Email Verification State Transition
- ✅ Property 15: Password Validation Consistency
- ✅ Property 16: Email Format Validation
- ✅ Property 17: Invalid Credentials Rejection
- ✅ Property 18: Password Reset Token Single Use
- ✅ Property 19: Verification Email Creation
- ✅ Property 20: Multiple Role Support
- ✅ Property 21: Role Context Switching
- ✅ Property 22: Active Role Persistence
- ✅ Property 23: Venue Admin Write Access Restriction
- ✅ Property 24: TripSlip Admin Unrestricted Access
- ✅ Property 25: Admin Action Audit Logging
- ✅ Property 26: School App Role Authorization
- ✅ Property 27: Session Validity Check
- ✅ Property 28: Client Token Cleanup
- ✅ Property 29: Self-Role-Modification Prevention
- ✅ Property 30: Role Assignment Validation
- ✅ Property 1-6: Role-Based Data Access Filtering

### Integration Tests (Task 32)
- ✅ Complete signup → verify email → login flow
- ✅ Login → switch role → access data flow
- ✅ Forgot password → reset → login flow
- ✅ Protected route access with various auth states

## RLS Policy Tests (Task 26)

RLS policy tests are SQL-based and located in `supabase/tests/`:
- `rls-policies.test.sql` - Trips table policies
- `rls-students.test.sql` - Students table policies
- `rls-schools.test.sql` - Schools table policies
- `rls-experiences.test.sql` - Experiences table policies
- `rls-teachers.test.sql` - Teachers table policies

To run RLS tests:
```bash
# Using Supabase CLI
supabase test db
```

## Test Dependencies

- **vitest**: Test runner
- **@vitest/ui**: Visual test UI
- **fast-check**: Property-based testing library
- **jsdom**: DOM environment for React component testing

## Writing New Tests

### Unit Tests
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RBACServiceImpl } from '../../rbac-service-impl';
import { mockSupabaseClient } from '../setup';

describe('My Feature', () => {
  let authService: RBACServiceImpl;

  beforeEach(() => {
    authService = new RBACServiceImpl(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    mockSupabaseClient.auth.signIn.mockResolvedValue({...});
    
    // Act
    const result = await authService.signIn('email', 'password');
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Property-Based Tests
```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('My Property', () => {
  it('should always hold true', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        (email, password) => {
          // Property assertion
          expect(email).toContain('@');
        }
      ),
      { numRuns: 10 }
    );
  });
});
```

## Continuous Integration

Tests are automatically run in CI/CD pipelines. All tests must pass before merging.

## Troubleshooting

### Tests failing with "Cannot find module"
```bash
npm install
```

### Mock not working
Ensure you're calling `vi.clearAllMocks()` in `beforeEach`

### Property tests timing out
Reduce `numRuns` in `fc.assert` options
