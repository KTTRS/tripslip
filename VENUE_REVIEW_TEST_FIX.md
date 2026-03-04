# Venue Review Test Fix Summary

## Problem
The `venue-review-service.test.ts` test suite was failing with "email rate limit exceeded" errors. This happened because the tests were creating a new user on every run using `auth.signUp()`, which triggers Supabase to send confirmation emails. After a few test runs, Supabase's email rate limit was hit.

## Solution
Refactored the tests to use a fixed test user that is created once and reused across all test runs.

## Changes Made

### 1. Test File Refactoring
**File**: `packages/database/src/__tests__/venue-review-service.test.ts`

- Changed from creating unique users to using a fixed email: `venue-review-test-user@example.com`
- Modified `beforeAll` to sign in with existing user instead of creating new ones
- Removed user deletion from `afterAll` to preserve the user
- Added helpful error message if test user doesn't exist

### 2. Test User Creation Script
**File**: `scripts/create-test-users.ts`

Created a script that uses the Supabase Admin API to create test users without triggering email confirmations. This requires the `SUPABASE_SERVICE_ROLE_KEY` environment variable.

### 3. Documentation
**File**: `docs/TEST_USER_SETUP.md`

Comprehensive guide explaining:
- Why test users are needed
- How to get the service role key
- How to create test users (automated and manual methods)
- Troubleshooting common issues

### 4. Package Script
**File**: `package.json`

Added `npm run create-test-users` command for easy test user creation.

## What You Need to Do

### Option 1: Automated (Recommended)

1. Get your Supabase service role key:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to Settings > API
   - Copy the `service_role` key

2. Add it to your `.env` file:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Run the script:
   ```bash
   npm run create-test-users
   ```

### Option 2: Manual

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Create a user with:
   - Email: `venue-review-test-user@example.com`
   - Password: `testpassword123`
   - Auto Confirm User: ✅ (checked)

## Verification

After creating the test user, run the tests:

```bash
cd packages/database
npm test -- venue-review-service.test.ts
```

All 29 tests should pass! ✅

## Why This Approach?

1. **Avoids Rate Limiting**: Test user is created once, not on every test run
2. **Faster Tests**: No need to create/delete users during test execution
3. **More Reliable**: Tests won't fail due to email service issues
4. **Best Practice**: Matches how other test frameworks handle test users

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `SUPABASE_SERVICE_ROLE_KEY` to git
- The service role key has admin access to your database
- Only use test users in development/staging environments
- The `.env` file is already in `.gitignore`

## Next Steps

Once the test user is created, all venue review service tests will pass. The same pattern can be applied to other test suites that need authenticated users.
