# Stripe Setup Checklist - Task 27.1

Quick reference checklist for setting up Stripe account and configuration.

## Prerequisites

- [ ] Business information ready (legal name, address, tax ID)
- [ ] Bank account details for payouts
- [ ] Email access for verification

## Step 1: Create Stripe Account

- [ ] Sign up at https://dashboard.stripe.com/register
- [ ] Verify email address
- [ ] Complete business profile:
  - [ ] Business name
  - [ ] Business type
  - [ ] Industry (Education/Software)
  - [ ] Business address
  - [ ] Tax ID (EIN/SSN)
  - [ ] Website URL
  - [ ] Support email
  - [ ] Support phone
- [ ] Add bank account for payouts
- [ ] Verify bank account (micro-deposits)
- [ ] Upload verification documents (if requested)
- [ ] Wait for account verification (1-2 business days)

## Step 2: Obtain API Keys

### Test Mode Keys (Development)
- [ ] Switch to Test mode in Stripe Dashboard
- [ ] Navigate to Developers → API keys
- [ ] Copy Publishable key (pk_test_...)
- [ ] Copy Secret key (sk_test_...)

### Production Keys (Production)
- [ ] Switch to Live mode in Stripe Dashboard
- [ ] Navigate to Developers → API keys
- [ ] Copy Publishable key (pk_live_...)
- [ ] Copy Secret key (sk_live_...)

## Step 3: Configure Webhook Endpoint

### Determine Webhook URL
- [ ] Get Supabase project URL from Settings → API
- [ ] Webhook URL format: `{SUPABASE_URL}/functions/v1/stripe-webhook`
- [ ] Example: `https://yvzpgbhinxibebgeevcu.supabase.co/functions/v1/stripe-webhook`

### Test Mode Webhook
- [ ] Switch to Test mode in Stripe Dashboard
- [ ] Navigate to Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Enter webhook URL
- [ ] Select API version: 2023-10-16
- [ ] Select events:
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.payment_failed
  - [ ] charge.refunded
- [ ] Click "Add endpoint"
- [ ] Copy webhook signing secret (whsec_...)

### Production Webhook
- [ ] Switch to Live mode in Stripe Dashboard
- [ ] Repeat webhook setup steps above
- [ ] Copy production webhook signing secret

## Step 4: Configure Environment Variables

### Local Development (.env file)
- [ ] Create/update `.env` file in project root
- [ ] Add test mode keys:
  ```env
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### Supabase Edge Function Secrets
- [ ] Login to Supabase CLI: `supabase login`
- [ ] Link project: `supabase link --project-ref your-project-ref`
- [ ] Set secrets:
  ```bash
  supabase secrets set STRIPE_SECRET_KEY=sk_test_...
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### Vercel Environment Variables (Parent App)
- [ ] Go to Vercel project dashboard
- [ ] Navigate to Settings → Environment Variables
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` for:
  - [ ] Production (pk_live_...)
  - [ ] Preview (pk_test_...)
  - [ ] Development (pk_test_...)

## Step 5: Test Payment Flow

### Test Card Setup
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Expiry: Any future date
- [ ] CVC: Any 3 digits
- [ ] ZIP: Any 5 digits

### End-to-End Testing
- [ ] Create test permission slip
- [ ] Navigate to parent payment page
- [ ] Enter test card details
- [ ] Submit payment
- [ ] Verify payment succeeds in app
- [ ] Check payment in Stripe Dashboard → Payments
- [ ] Verify webhook received in Stripe Dashboard → Webhooks → Events
- [ ] Confirm permission slip status updated to "paid" in database

## Step 6: Configure Payment Methods

- [ ] Navigate to Settings → Payment methods
- [ ] Enable payment methods:
  - [ ] Cards (Visa, Mastercard, Amex, Discover)
  - [ ] Link (Stripe one-click checkout)
  - [ ] ACH Direct Debit (optional)
- [ ] Enable automatic payment methods
- [ ] Enable 3D Secure card authentication

## Step 7: Production Readiness

### Pre-Production Checklist
- [ ] Business profile complete and verified
- [ ] Bank account added and verified
- [ ] Production API keys obtained
- [ ] Production webhook endpoint configured
- [ ] Webhook signing secret set in Supabase
- [ ] Environment variables set in Vercel
- [ ] Test payment flow works in test mode
- [ ] Webhook events received and processed
- [ ] Payment methods configured
- [ ] Fraud prevention rules configured (Radar)
- [ ] Support email/phone set up
- [ ] Terms of service linked in Stripe settings

### Switch to Production
- [ ] Update `.env` with production keys
- [ ] Update Supabase secrets with production keys
- [ ] Update Vercel environment variables with production keys
- [ ] Switch Stripe Dashboard to Live mode
- [ ] Verify webhook endpoint is active
- [ ] Test with real card (small amount, then refund)
- [ ] Monitor first transactions closely

## Verification Commands

### Check Supabase Secrets
```bash
supabase secrets list
```

### Test Webhook Locally (Optional)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

### Verify Edge Function Deployment
```bash
# Check if stripe-webhook function is deployed
curl https://your-project-ref.supabase.co/functions/v1/stripe-webhook
# Should return 400 (expected, as it requires Stripe signature)
```

## Common Issues and Solutions

### Issue: Webhook not receiving events
- [ ] Verify webhook URL is correct
- [ ] Check Edge Function is deployed
- [ ] Verify STRIPE_WEBHOOK_SECRET is set
- [ ] Check Edge Function logs

### Issue: Payment intent creation fails
- [ ] Verify STRIPE_SECRET_KEY is set correctly
- [ ] Check Edge Function logs
- [ ] Verify Stripe account is activated

### Issue: Webhook signature validation fails
- [ ] Verify STRIPE_WEBHOOK_SECRET matches endpoint
- [ ] Check using correct secret for test/live mode
- [ ] Ensure payload not modified before validation

## Documentation References

- Full Setup Guide: `docs/STRIPE_SETUP_GUIDE.md`
- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Webhook Guide: https://stripe.com/docs/webhooks

## Task Completion Criteria

Task 27.1 is complete when:

✅ **Requirement 21.1**: Stripe account created with business information  
✅ **Requirement 21.2**: API keys obtained (publishable and secret)  
✅ **Requirement 21.3**: Webhook endpoint URL configured  

## Next Steps

After completing this checklist:

1. ✅ Mark Task 27.1 as complete
2. → Proceed to Task 27.2: Configure Stripe webhooks (verify events)
3. → Proceed to Task 27.3: Write property test for webhook validation
4. → Proceed to Task 27.4: Configure Stripe Connect and payment methods

---

**Status**: Ready for execution  
**Estimated Time**: 30-60 minutes (excluding verification wait time)  
**Dependencies**: Supabase project set up, Edge Functions deployed
