# TripSlip Deployment Instructions

## Current Status

✅ **Completed:**
- All 5 applications built and ready (Landing, Parent, Teacher, Venue, School)
- Database migrations applied to Supabase production
- All 5 Edge Functions deployed to Supabase
- Vercel configuration files created for all apps

⚠️ **Pending (Optional for MVP):**
- Stripe API keys (for payment processing)
- Email service API keys (for notifications)
- SMS service API keys (for text notifications)

## Quick Deploy (Without Payment/Notifications)

You can deploy all apps right now without Stripe/email/SMS. The apps will work for:
- ✅ User authentication
- ✅ Trip creation and management
- ✅ Permission slip viewing
- ✅ Student roster management
- ✅ Dashboard analytics
- ❌ Payment processing (requires Stripe)
- ❌ Email notifications (requires SendGrid/Resend)
- ❌ SMS notifications (requires Twilio)

### Step 1: Login to Vercel

```bash
vercel login
```

### Step 2: Get Supabase Anon Key

1. Go to https://supabase.com/dashboard/project/yvzpgbhinxibebgeevcu/settings/api
2. Copy the "anon" key (public key)
3. Set it as environment variable:

```bash
export VITE_SUPABASE_ANON_KEY="your-anon-key-here"
```

### Step 3: Deploy All Apps

```bash
./scripts/deploy-all-apps.sh
```

Or deploy individually:

```bash
# Landing App
cd apps/landing
vercel --prod --yes \
  -e VITE_SUPABASE_URL="https://yvzpgbhinxibebgeevcu.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"

# Parent App
cd apps/parent
vercel --prod --yes \
  -e VITE_SUPABASE_URL="https://yvzpgbhinxibebgeevcu.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"

# Teacher App
cd apps/teacher
vercel --prod --yes \
  -e VITE_SUPABASE_URL="https://yvzpgbhinxibebgeevcu.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"

# Venue App
cd apps/venue
vercel --prod --yes \
  -e VITE_SUPABASE_URL="https://yvzpgbhinxibebgeevcu.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"

# School App
cd apps/school
vercel --prod --yes \
  -e VITE_SUPABASE_URL="https://yvzpgbhinxibebgeevcu.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"
```

## Adding Payment Processing (Later)

When you're ready to enable payments:

### 1. Create Stripe Account
- Go to https://stripe.com
- Create account and get API keys

### 2. Configure Stripe in Supabase Edge Functions

```bash
# Set Stripe secret key in Supabase
supabase secrets set STRIPE_SECRET_KEY="sk_live_..." --project-ref yvzpgbhinxibebgeevcu

# Set Stripe webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..." --project-ref yvzpgbhinxibebgeevcu
```

### 3. Add Stripe Publishable Key to Apps

```bash
# Redeploy Parent App with Stripe key
cd apps/parent
vercel --prod --yes \
  -e VITE_SUPABASE_URL="https://yvzpgbhinxibebgeevcu.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -e VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yvzpgbhinxibebgeevcu.supabase.co/functions/v1/stripe-webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.failed`, `charge.refunded`
4. Copy webhook secret and add to Supabase secrets (step 2 above)

## Adding Email Notifications (Later)

### Option 1: Resend (Recommended)

```bash
# Get API key from https://resend.com
supabase secrets set RESEND_API_KEY="re_..." --project-ref yvzpgbhinxibebgeevcu
```

### Option 2: SendGrid

```bash
# Get API key from https://sendgrid.com
supabase secrets set SENDGRID_API_KEY="SG..." --project-ref yvzpgbhinxibebgeevcu
```

## Adding SMS Notifications (Later)

### Twilio Setup

```bash
# Get credentials from https://twilio.com
supabase secrets set TWILIO_ACCOUNT_SID="AC..." --project-ref yvzpgbhinxibebgeevcu
supabase secrets set TWILIO_AUTH_TOKEN="..." --project-ref yvzpgbhinxibebgeevcu
supabase secrets set TWILIO_PHONE_NUMBER="+1234567890" --project-ref yvzpgbhinxibebgeevcu
```

## Verifying Deployment

After deployment, test each app:

1. **Landing App**: Should load and display marketing content
2. **Parent App**: Should allow magic link login (email sent via Supabase Auth)
3. **Teacher App**: Should allow email/password login
4. **Venue App**: Should allow venue user login
5. **School App**: Should allow school admin login

## Troubleshooting

### "Not logged in to Vercel"
```bash
vercel login
```

### "Missing VITE_SUPABASE_ANON_KEY"
Get it from: https://supabase.com/dashboard/project/yvzpgbhinxibebgeevcu/settings/api

### "Build failed"
Check build logs in Vercel dashboard or run locally:
```bash
cd apps/[app-name]
npm run build
```

### "Database connection failed"
Verify Supabase URL and anon key are correct in environment variables

## Production Checklist

Before going live with real users:

- [ ] All 5 apps deployed to Vercel
- [ ] Custom domains configured (optional)
- [ ] SSL certificates active (automatic with Vercel)
- [ ] Supabase database migrations applied
- [ ] Edge Functions deployed
- [ ] Stripe configured (for payments)
- [ ] Email service configured (for notifications)
- [ ] SMS service configured (optional)
- [ ] Test user accounts created
- [ ] End-to-end testing completed
- [ ] Error monitoring configured (Sentry)
- [ ] Analytics configured (optional)

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs

---

**Last Updated**: 2026-02-26
**Supabase Project**: yvzpgbhinxibebgeevcu
**Status**: Ready for deployment (MVP without payments)
