# Test User Setup Guide

This guide explains how to create test users for automated testing.

## Why Do We Need Test Users?

Some test suites (like `venue-review-service.test.ts`) require authenticated users to run. Creating users via `auth.signUp()` in tests can hit Supabase's email rate limits, causing tests to fail.

The solution is to create a fixed test user once and reuse it across all test runs.

## Option 1: Using the create-test-users Script (Recommended)

### Prerequisites

You need your Supabase service role key. To get it:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings > API
4. Copy the `service_role` key (⚠️ Keep this secret! Never commit it to git)

### Steps

1. Add the service role key to your `.env` file:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

2. Run the script:
   ```bash
   npm run create-test-users
   ```

3. The script will create the following test users:
   - `venue-review-test-user@example.com` (password: `testpassword123`)

## Option 2: Manual Creation via Supabase Dashboard

If you don't have access to the service role key, you can create test users manually:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Create a user with:
   - Email: `venue-review-test-user@example.com`
   - Password: `testpassword123`
   - Auto Confirm User: ✅ (checked)

## Verifying Test Users

To verify that test users are created correctly, try running the tests:

```bash
cd packages/database
npm test -- venue-review-service.test.ts
```

If the tests pass, your test users are set up correctly!

## Troubleshooting

### "Email rate limit exceeded" Error

This means you've tried to create too many users via `auth.signUp()`. Solutions:

1. Wait 5-10 minutes for the rate limit to reset
2. Use Option 1 or Option 2 above to create the test user
3. The test user will be reused across runs, avoiding future rate limits

### "Test user does not exist" Error

This means the test user hasn't been created yet. Follow Option 1 or Option 2 above.

### "Invalid login credentials" Error

This means the test user exists but the password is incorrect. Reset the password in the Supabase dashboard to `testpassword123`.

## Security Notes

- ⚠️ Never commit `SUPABASE_SERVICE_ROLE_KEY` to git
- ⚠️ The service role key has admin access to your database
- ⚠️ Test users should only be created in development/staging environments
- ⚠️ Use different test users for production testing (if needed)
