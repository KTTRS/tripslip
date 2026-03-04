# Smoke Tests

Smoke tests are fast, critical-path tests that verify the most important user flows work end-to-end. They run before the full test suite to catch major regressions quickly.

## Overview

**Purpose**: Catch breaking changes in critical user flows before running the full test suite.

**Execution Time**: < 2 minutes total

**Environment**: Uses real database connections (test environment) but mocks external services.

## Test Files

### 1. `auth-flow.test.ts`
Tests the authentication flow from login to logout.

**Flow**:
1. Sign in with valid credentials
2. Validate session exists
3. Retrieve current user
4. Sign out successfully
5. Verify invalid credentials fail

**Duration**: ~30 seconds

**Requirements**:
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### 2. `trip-creation-flow.test.ts`
Tests the trip creation flow from venue search to trip confirmation.

**Flow**:
1. Search for active venues
2. Retrieve experiences for selected venue
3. Create new trip with selected experience
4. Retrieve created trip with relations
5. Update trip status

**Duration**: ~45 seconds

**Requirements**:
- `TEST_TEACHER_EMAIL` - Test teacher email
- `TEST_TEACHER_PASSWORD` - Test teacher password
- Active venues and experiences in test database

### 3. `payment-flow.test.ts`
Tests the payment flow from payment intent creation to confirmation.

**Flow**:
1. Create payment intent via Edge Function
2. Record payment in database
3. Update payment status to succeeded
4. Update permission slip after payment
5. Retrieve payment history
6. Handle refund creation

**Duration**: ~45 seconds

**Requirements**:
- `TEST_PARENT_EMAIL` - Test parent email
- `TEST_PARENT_PASSWORD` - Test parent password
- Stripe Edge Functions deployed (or mocked)

## Running Smoke Tests

### Local Development

```bash
# Run all smoke tests
npm run test:smoke

# Run specific smoke test
npx vitest run tests/smoke/auth-flow.test.ts
```

### CI/CD Pipeline

Smoke tests run automatically in the CI/CD pipeline:
1. **Before full test suite** - Catches major issues early
2. **After deployment to staging** - Verifies deployment success
3. **Before production deployment** - Final safety check

## Environment Setup

### Required Environment Variables

Create a `.env.test` file with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Test User Credentials
TEST_USER_EMAIL=test@tripslip.com
TEST_USER_PASSWORD=TestPassword123!
TEST_TEACHER_EMAIL=teacher@tripslip.com
TEST_TEACHER_PASSWORD=TestPassword123!
TEST_PARENT_EMAIL=parent@tripslip.com
TEST_PARENT_PASSWORD=TestPassword123!

# Optional: Test Environment URL
TEST_URL=http://localhost:3000
```

### Test Database Setup

Smoke tests require a test database with:
1. Test users (teacher, parent, venue admin)
2. Active venues with experiences
3. Proper RLS policies configured
4. Edge Functions deployed (or mocked)

## Mocking Strategy

### External Services Mocked
- **Stripe API**: Payment intent creation and processing
- **Email Service**: Email notifications
- **SMS Service**: SMS notifications

### Real Services Used
- **Supabase Database**: Real database connections to test environment
- **Supabase Auth**: Real authentication flow
- **Supabase Storage**: Real file storage (test bucket)

## Writing New Smoke Tests

### Guidelines

1. **Focus on critical paths**: Only test the most important user flows
2. **Keep tests fast**: Each test should complete in < 10 seconds
3. **Use real database**: Connect to test database, not mocks
4. **Mock external services**: Mock Stripe, email, SMS to avoid side effects
5. **Clean up after tests**: Delete created records in `afterAll`
6. **Provide clear error messages**: Help developers identify issues quickly

### Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSupabaseClient } from '@tripslip/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Smoke Test: [Flow Name]
 * Tests: [Step 1] → [Step 2] → [Step 3]
 * 
 * This test verifies the critical [flow name] path works end-to-end.
 * Uses real database connections but test environment.
 */

describe('Smoke Test - [Flow Name]', () => {
  let supabase: SupabaseClient;
  let testUserId: string;

  beforeAll(async () => {
    // Verify environment variables
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    supabase = createSupabaseClient();

    // Setup: Sign in, create test data, etc.
  });

  afterAll(async () => {
    // Cleanup: Delete test data, sign out
    await supabase.auth.signOut();
  });

  it('should [test description]', async () => {
    // Test implementation
    expect(true).toBe(true);
  }, 10000); // 10 second timeout
});
```

### Best Practices

1. **Use descriptive test names**: Clearly state what is being tested
2. **Set appropriate timeouts**: Default 10 seconds, adjust as needed
3. **Verify environment setup**: Check required env vars in `beforeAll`
4. **Handle async operations**: Use `async/await` consistently
5. **Assert meaningful values**: Don't just check for existence, verify correctness
6. **Document requirements**: List required env vars and test data
7. **Clean up thoroughly**: Remove all created records to avoid test pollution

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Missing required environment variables"
- **Solution**: Create `.env.test` file with required variables

**Issue**: Tests fail with "Failed to sign in test user"
- **Solution**: Verify test users exist in test database with correct credentials

**Issue**: Tests timeout
- **Solution**: Check database connection, increase timeout, or optimize queries

**Issue**: Tests fail intermittently
- **Solution**: Ensure proper cleanup in `afterAll`, check for race conditions

**Issue**: Edge Function not available
- **Solution**: Deploy Edge Functions to test environment or update mocks

### Debug Mode

Run tests with verbose output:

```bash
# Run with debug logging
DEBUG=* npm run test:smoke

# Run single test with full output
npx vitest run tests/smoke/auth-flow.test.ts --reporter=verbose
```

## Maintenance

### When to Update Smoke Tests

- **New critical feature**: Add smoke test for new critical user flow
- **Breaking change**: Update affected smoke tests
- **Schema change**: Update database queries and assertions
- **API change**: Update service calls and mocks

### Review Schedule

- **Weekly**: Review smoke test execution times
- **Monthly**: Review smoke test coverage
- **Quarterly**: Audit and optimize smoke test suite

## Metrics

### Success Criteria

- ✅ All smoke tests pass in < 2 minutes
- ✅ 100% pass rate in CI/CD
- ✅ Clear failure messages for debugging
- ✅ No flaky tests (intermittent failures)

### Current Coverage

- Authentication flow: ✅ Covered
- Trip creation flow: ✅ Covered
- Payment flow: ✅ Covered

### Future Coverage

- Venue onboarding flow
- Permission slip signing flow
- Booking confirmation flow
- Refund processing flow

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Smoke Testing Best Practices](https://martinfowler.com/bliki/SmokeTest.html)
