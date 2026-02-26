# GitHub Actions Secrets

This document lists all required secrets for CI/CD workflows.

## Required Secrets

### Supabase
- `VITE_SUPABASE_URL` - Supabase project URL (https://yvzpgbhinxibebgeevcu.supabase.co)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_PROJECT_REF` - Supabase project reference (yvzpgbhinxibebgeevcu)
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token

### Stripe
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_test_...)
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_test_...)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (whsec_...)

### Vercel
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID_landing` - Vercel project ID for Landing App
- `VERCEL_PROJECT_ID_venue` - Vercel project ID for Venue App
- `VERCEL_PROJECT_ID_school` - Vercel project ID for School App
- `VERCEL_PROJECT_ID_teacher` - Vercel project ID for Teacher App
- `VERCEL_PROJECT_ID_parent` - Vercel project ID for Parent App

### External Services
- `EMAIL_API_KEY` - Email service API key (SendGrid, Resend, etc.)
- `SMS_API_KEY` - SMS service API key (Twilio, etc.)

## Setting Secrets

### GitHub Repository Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value

### Vercel Project Setup

For each application (landing, venue, school, teacher, parent):

1. Create a new Vercel project
2. Link to the monorepo
3. Set root directory to `apps/{app-name}`
4. Set build command to `cd ../.. && npx turbo run build --filter={app-name}`
5. Set output directory to `dist`
6. Copy the project ID and add as `VERCEL_PROJECT_ID_{app-name}` secret

### Supabase CLI Token

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Generate access token: `supabase access-token`
4. Add as `SUPABASE_ACCESS_TOKEN` secret

## Environment Variables per App

### Landing App
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Venue App
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### School App
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Teacher App
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Parent App
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

## Workflows

### test.yml
Runs on: Push to main/develop, Pull requests
Requires:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### deploy.yml
Runs on: Push to main, Manual trigger
Requires: All secrets listed above

### property-tests.yml
Runs on: Push, Pull requests, Nightly schedule
Requires:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Security Notes

- Never commit secrets to the repository
- Rotate secrets regularly (quarterly recommended)
- Use different keys for staging and production
- Limit secret access to necessary workflows only
- Use Vercel environment variables for app-specific configs
