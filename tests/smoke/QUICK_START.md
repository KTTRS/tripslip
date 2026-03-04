# Smoke Tests - Quick Start Guide

## What Are Smoke Tests?

Smoke tests are **fast, critical-path tests** that verify the most important user flows work end-to-end. They run in **< 2 minutes** and catch major regressions before the full test suite runs.

## Running Smoke Tests

### Local Development

```bash
# Run all smoke tests
npm run test:smoke

# Run specific test
npx vitest run tests/smoke/auth-flow.test.ts
npx vitest run tests/smoke/trip-creation-flow.test.ts
npx vitest run tests/smoke/payment-flow.test.ts
```

### First Time Setup

1. **Copy environment template**:
   ```bash
   cp .env.test.example .env.test
   ```

2. **Fill in test credentials** in `.env.test`:
   ```bash
   VITE_SUPABASE_URL=https://your-test-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-test-anon-key
   TEST_USER_EMAIL=test@tripslip.com
   TEST_USER_PASSWORD=TestPassword123!
   TEST_TEACHER_EMAIL=teacher@tripslip.com
   TEST_TEACHER_PASSWORD=TestPassword123!
   TEST_PARENT_EMAIL=parent@tripslip.com
   TEST_PARENT_PASSWORD=TestPassword123!
   ```

3. **Create test users** in your test database:
   ```bash
   npm run create-test-users
   ```

4. **Run smoke tests**:
   ```bash
   npm run test:smoke
   ```

## What's Tested?

### 🔐 Authentication Flow (`auth-flow.test.ts`)
- ✅ Sign in with valid credentials
- ✅ Session validation
- ✅ User retrieval
- ✅ Sign out
- ✅ Invalid credentials handling

### 🚌 Trip Creation Flow (`trip-creation-flow.test.ts`)
- ✅ Venue search
- ✅ Experience selection
- ✅ Trip creation
- ✅ Trip retrieval with relations
- ✅ Status updates

### 💳 Payment Flow (`payment-flow.test.ts`)
- ✅ Payment intent creation
- ✅ Payment recording
- ✅ Status updates
- ✅ Permission slip updates
- ✅ Payment history
- ✅ Refund handling

## When Do They Run?

### Automatically in CI/CD
1. **On every push** to main/develop
2. **After staging deployment**
3. **Before full test suite**

### Manually
- Run `npm run test:smoke` anytime
- Recommended before pushing code
- Recommended after major changes

## Troubleshooting

### ❌ "Missing required environment variables"
**Solution**: Create `.env.test` file with required variables (see setup above)

### ❌ "Failed to sign in test user"
**Solution**: Verify test users exist in test database with correct credentials

### ❌ Tests timeout
**Solution**: Check database connection, verify test environment is accessible

### ❌ Edge Function not available
**Solution**: Tests will mock Edge Functions if not deployed (expected in local dev)

## Need More Info?

See the full documentation: [`tests/smoke/README.md`](./README.md)

## Quick Tips

- 💡 Smoke tests use **real database** connections (test environment)
- 💡 External services (Stripe, email, SMS) are **mocked**
- 💡 Tests **clean up** after themselves (delete test data)
- 💡 Each test runs **independently** (no shared state)
- 💡 Tests should complete in **< 10 seconds each**

## Adding New Smoke Tests

Only add smoke tests for **critical user flows**. See template in [`README.md`](./README.md#template).

**Good candidates**:
- ✅ Core authentication flows
- ✅ Primary business workflows
- ✅ Payment/financial operations
- ✅ Data integrity operations

**Not for smoke tests**:
- ❌ Edge cases (use unit tests)
- ❌ UI interactions (use E2E tests)
- ❌ Performance testing (separate suite)
- ❌ Property-based testing (use property tests)
