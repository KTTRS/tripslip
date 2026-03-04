# Stripe Setup Guide for TripSlip

This guide walks you through setting up Stripe payment processing for the TripSlip platform.

## Overview

TripSlip uses Stripe for:
- Processing parent payments for field trip permission slips
- Split payments (multiple parents sharing costs)
- Refund processing
- Venue payouts via Stripe Connect (future feature)

## Prerequisites

- Business information (legal name, address, tax ID)
- Bank account details for payouts
- Access to create a Stripe account

## Step 1: Create Stripe Account

### 1.1 Sign Up for Stripe

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Enter your email address and create a password
3. Verify your email address

### 1.2 Complete Business Profile

1. Navigate to **Settings** → **Business settings**
2. Fill in the following information:
   - **Business name**: TripSlip (or your legal entity name)
   - **Business type**: Select appropriate type (LLC, Corporation, etc.)
   - **Industry**: Education or Software/Technology
   - **Business address**: Your business address
   - **Tax ID**: Your EIN or SSN
   - **Website**: https://tripslip.com
   - **Support email**: support@tripslip.com
   - **Support phone**: Your support phone number

3. Add bank account details:
   - Navigate to **Settings** → **Bank accounts and scheduling**
   - Click **Add bank account**
   - Enter your bank account information
   - Verify the account (Stripe will send micro-deposits)

### 1.3 Verify Your Account

1. Stripe may require additional verification documents
2. Upload requested documents (business license, articles of incorporation, etc.)
3. Wait for Stripe to verify your account (usually 1-2 business days)

## Step 2: Obtain API Keys

### 2.1 Get Test Mode Keys (for development)

1. In the Stripe Dashboard, ensure you're in **Test mode** (toggle in top-right)
2. Navigate to **Developers** → **API keys**
3. Copy the following keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Click **Reveal test key** and copy (starts with `sk_test_`)

### 2.2 Get Production Keys (for production deployment)

1. Switch to **Live mode** in the Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. Copy the following keys:
   - **Publishable key**: Starts with `pk_live_`
   - **Secret key**: Click **Reveal live key** and copy (starts with `sk_live_`)

⚠️ **IMPORTANT**: Never commit secret keys to version control!

## Step 3: Configure Webhook Endpoint

### 3.1 Determine Your Webhook URL

Your webhook endpoint URL depends on your deployment:

**Development (local testing)**:
```
https://your-project-ref.supabase.co/functions/v1/stripe-webhook
```

**Production**:
```
https://your-production-project-ref.supabase.co/functions/v1/stripe-webhook
```

To find your Supabase project reference:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** (e.g., `https://yvzpgbhinxibebgeevcu.supabase.co`)
4. Your webhook URL is: `{PROJECT_URL}/functions/v1/stripe-webhook`

### 3.2 Create Webhook Endpoint in Stripe

1. In Stripe Dashboard, navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL
4. Select **API version**: `2023-10-16` (or latest)
5. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
6. Click **Add endpoint**

### 3.3 Get Webhook Signing Secret

1. After creating the endpoint, click on it to view details
2. In the **Signing secret** section, click **Reveal**
3. Copy the webhook signing secret (starts with `whsec_`)

### 3.4 Repeat for Test Mode

1. Switch to **Test mode** in Stripe Dashboard
2. Repeat steps 3.2-3.3 to create a test webhook endpoint
3. You can use the same URL for test and live webhooks

## Step 4: Configure Environment Variables

### 4.1 Update Local Environment

Create or update your `.env` file in the project root:

```env
# Stripe Configuration - Test Mode
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 4.2 Configure Supabase Edge Function Secrets

Set the Stripe secrets for your Edge Functions:

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets for Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 4.3 Configure Vercel Environment Variables

For each application that needs Stripe (parent app):

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your publishable key
   - For production, use `pk_live_` keys
   - For preview/development, use `pk_test_` keys

## Step 5: Test Payment Flow

### 5.1 Use Stripe Test Cards

Stripe provides test card numbers for testing:

**Successful payment**:
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment requires authentication (3D Secure)**:
- Card number: `4000 0025 0000 3155`

**Payment declined**:
- Card number: `4000 0000 0000 9995`

Full list: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

### 5.2 Test End-to-End Flow

1. Create a test permission slip in your development environment
2. Navigate to the parent payment page
3. Enter test card details
4. Submit payment
5. Verify:
   - Payment succeeds in your app
   - Payment appears in Stripe Dashboard → **Payments**
   - Webhook is received (check Stripe Dashboard → **Developers** → **Webhooks** → **Events**)
   - Permission slip status updates to "paid" in database

### 5.3 Test Webhook Locally (Optional)

To test webhooks locally, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local Edge Function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

## Step 6: Configure Payment Method Types

### 6.1 Enable Payment Methods

1. In Stripe Dashboard, navigate to **Settings** → **Payment methods**
2. Enable the following payment methods:
   - **Cards**: Visa, Mastercard, American Express, Discover
   - **ACH Direct Debit** (optional, for US bank transfers)
   - **Link** (Stripe's one-click checkout)

3. Configure payment method settings:
   - **Automatic payment methods**: Enable to automatically show relevant payment methods
   - **Card authentication**: Enable 3D Secure for enhanced security

### 6.2 Set Payment Limits (Optional)

1. Navigate to **Settings** → **Radar** → **Rules**
2. Configure rules to block suspicious payments
3. Set maximum payment amounts if needed

## Step 7: Configure Stripe Connect (Future Feature)

⚠️ **Note**: Stripe Connect for venue payouts is a future feature. Skip this section for MVP launch.

### 7.1 Enable Stripe Connect

1. Navigate to **Settings** → **Connect settings**
2. Click **Get started**
3. Select **Platform or marketplace** as your business model
4. Complete the Connect onboarding

### 7.2 Configure Connect Settings

1. Set your platform fee (percentage or fixed amount)
2. Configure payout schedule for connected accounts
3. Set up identity verification requirements

## Step 8: Production Checklist

Before going live with production keys:

- [ ] Business profile is complete and verified
- [ ] Bank account is added and verified
- [ ] Production API keys are obtained
- [ ] Production webhook endpoint is configured
- [ ] Webhook signing secret is set in Supabase secrets
- [ ] Environment variables are set in Vercel
- [ ] Test payment flow works end-to-end in test mode
- [ ] Webhook events are being received and processed
- [ ] Payment method types are configured
- [ ] Radar rules are configured for fraud prevention
- [ ] Support email and phone are set up
- [ ] Terms of service and privacy policy are linked in Stripe settings

## Step 9: Switch to Production

### 9.1 Update Environment Variables

1. Update `.env` for production:
```env
# Stripe Configuration - Production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

2. Update Supabase secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

3. Update Vercel environment variables with production keys

### 9.2 Verify Production Setup

1. Switch to **Live mode** in Stripe Dashboard
2. Verify webhook endpoint is active
3. Test with a real card (small amount, then refund)
4. Monitor first few transactions closely

## Monitoring and Maintenance

### Daily Monitoring

- Check Stripe Dashboard for failed payments
- Review webhook delivery status
- Monitor for disputes or chargebacks

### Weekly Tasks

- Review payment analytics
- Check for unusual patterns
- Verify payouts are processing correctly

### Monthly Tasks

- Reconcile Stripe payouts with bank deposits
- Review and update fraud rules if needed
- Check for Stripe API updates

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook endpoint URL is correct
2. Verify Edge Function is deployed and accessible
3. Check Stripe Dashboard → **Webhooks** → **Events** for delivery attempts
4. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
5. Check Edge Function logs for errors

### Payment Intent Creation Fails

1. Verify `STRIPE_SECRET_KEY` is set correctly
2. Check Edge Function logs for error details
3. Verify Stripe account is activated
4. Check if payment amount is within limits

### Webhook Signature Validation Fails

1. Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint
2. Check that you're using the correct secret for test/live mode
3. Ensure webhook payload is not modified before validation

## Support Resources

- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: [https://support.stripe.com](https://support.stripe.com)
- **Stripe Status**: [https://status.stripe.com](https://status.stripe.com)
- **TripSlip Support**: support@tripslip.com

## Security Best Practices

1. **Never commit API keys to version control**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Use different keys for test and production**
   - Keep test and live keys separate
   - Never use live keys in development

3. **Rotate keys periodically**
   - Rotate secret keys every 6-12 months
   - Update all environments when rotating

4. **Monitor for suspicious activity**
   - Enable Stripe Radar
   - Set up alerts for unusual patterns
   - Review failed payments regularly

5. **Validate webhook signatures**
   - Always verify webhook signatures
   - Never trust webhook data without validation

6. **Use HTTPS only**
   - All webhook endpoints must use HTTPS
   - Stripe will not send webhooks to HTTP endpoints

## Next Steps

After completing Stripe setup:

1. ✅ Task 27.1 Complete: Stripe account and configuration set up
2. → Task 27.2: Configure Stripe webhooks (verify webhook events)
3. → Task 27.3: Write property test for webhook signature validation
4. → Task 27.4: Configure Stripe Connect and payment methods

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: TripSlip Development Team
