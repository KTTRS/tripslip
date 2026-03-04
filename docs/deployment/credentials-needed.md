# Credentials Needed for TripSlip Deployment

**Purpose:** This document lists exactly what credentials/keys you need to provide from each service to deploy TripSlip.

## Quick Reference

Copy this template and fill in your actual values:

```bash
# ============================================
# SUPABASE CREDENTIALS
# ============================================
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ============================================
# STRIPE CREDENTIALS
# ============================================
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ============================================
# EMAIL SERVICE (RESEND)
# ============================================
EMAIL_API_KEY=
EMAIL_FROM=

# ============================================
# SMS SERVICE (TWILIO - OPTIONAL)
# ============================================
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# ============================================
# MONITORING (SENTRY)
# ============================================
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# ============================================
# APPLICATION URLS
# ============================================
VITE_LANDING_URL=
VITE_VENUE_URL=
VITE_SCHOOL_URL=
VITE_TEACHER_URL=
VITE_PARENT_URL=
```

---

## 1. Supabase (Required)

### What I Need From You:

**After you create a Supabase project, provide these 3 values:**

1. **Project URL** (VITE_SUPABASE_URL)
   - Example: `https://abcdefghijklmnop.supabase.co`
   - Where to find: Supabase Dashboard → Settings → API → Project URL

2. **Anon/Public Key** (VITE_SUPABASE_ANON_KEY)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)
   - Where to find: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string, different from anon key)
   - Where to find: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **KEEP THIS SECRET** - Never expose in frontend code

### How to Get These:

1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - Project name: `tripslip-production`
   - Database password: (create a strong password)
   - Region: Choose closest to your users (e.g., US East)
5. Wait 2-3 minutes for project to be created
6. Go to Settings → API
7. Copy the 3 values listed above

---

## 2. Stripe (Required)

### What I Need From You:

**After you create a Stripe account, provide these 3 values:**

1. **Publishable Key** (VITE_STRIPE_PUBLISHABLE_KEY)
   - Example: `pk_live_51Abc...` (starts with `pk_live_` for production)
   - Where to find: Stripe Dashboard → Developers → API keys → Publishable key
   - This is safe to expose in frontend

2. **Secret Key** (STRIPE_SECRET_KEY)
   - Example: `sk_live_51Abc...` (starts with `sk_live_` for production)
   - Where to find: Stripe Dashboard → Developers → API keys → Secret key
   - ⚠️ **KEEP THIS SECRET** - Never expose in frontend code

3. **Webhook Secret** (STRIPE_WEBHOOK_SECRET)
   - Example: `whsec_abc123...` (starts with `whsec_`)
   - Where to find: Stripe Dashboard → Developers → Webhooks → Add endpoint → Signing secret
   - Created after you add webhook endpoint (I'll help with this)

### How to Get These:

1. Go to https://stripe.com
2. Sign up / Log in
3. Complete business verification (required for live mode)
4. Go to Developers → API keys
5. Toggle "Test mode" OFF (to get live keys)
6. Copy Publishable key and Secret key
7. For Webhook Secret:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://[your-supabase-project].supabase.co/functions/v1/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
   - Click "Add endpoint"
   - Copy the "Signing secret" (starts with `whsec_`)

### Additional Stripe Setup:

**Enable Stripe Connect** (for venue payments):
1. Stripe Dashboard → Settings → Connect settings
2. Enable "Standard accounts"
3. Add branding (logo, colors)
4. Set redirect URLs:
   - Redirect URL: `https://venue.tripslip.com/settings/stripe-success`
   - Refresh URL: `https://venue.tripslip.com/settings/stripe-refresh`

---

## 3. Email Service - Resend (Required)

### What I Need From You:

**After you create a Resend account, provide these 2 values:**

1. **API Key** (EMAIL_API_KEY)
   - Example: `re_abc123...` (starts with `re_`)
   - Where to find: Resend Dashboard → API Keys → Create API Key

2. **From Email** (EMAIL_FROM)
   - Example: `noreply@tripslip.com`
   - Must be from your verified domain

### How to Get These:

1. Go to https://resend.com
2. Sign up / Log in
3. Go to Domains → Add Domain
4. Add your domain: `tripslip.com`
5. Add DNS records they provide (SPF, DKIM, DMARC)
6. Wait for verification (usually 5-10 minutes)
7. Go to API Keys → Create API Key
8. Name it "TripSlip Production"
9. Copy the API key (starts with `re_`)
10. Set EMAIL_FROM to `noreply@tripslip.com` (or your preferred sender)

### DNS Records You'll Need to Add:

Resend will give you these records to add to your domain:

```
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

Type: TXT  
Name: @
Value: v=spf1 include:resend.com ~all

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@tripslip.com
```

---

## 4. SMS Service - Twilio (Optional)

### What I Need From You:

**If you want SMS notifications, provide these 3 values:**

1. **Account SID** (TWILIO_ACCOUNT_SID)
   - Example: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Where to find: Twilio Console → Account Info → Account SID

2. **Auth Token** (TWILIO_AUTH_TOKEN)
   - Example: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Where to find: Twilio Console → Account Info → Auth Token
   - ⚠️ **KEEP THIS SECRET**

3. **Phone Number** (TWILIO_PHONE_NUMBER)
   - Example: `+12345678900`
   - Where to find: Twilio Console → Phone Numbers → Your purchased number

### How to Get These:

1. Go to https://twilio.com
2. Sign up / Log in
3. Complete verification
4. Buy a phone number:
   - Console → Phone Numbers → Buy a number
   - Choose a number with SMS capability
   - Cost: ~$1-2/month
5. Copy Account SID and Auth Token from Console home
6. Copy your phone number (format: +1234567890)

**Note:** You can skip SMS for initial launch and add it later. Email is the primary notification method.

---

## 5. Monitoring - Sentry (Required)

### What I Need From You:

**After you create a Sentry account, provide these 2 values:**

1. **DSN** (SENTRY_DSN)
   - Example: `https://abc123@o123456.ingest.sentry.io/7654321`
   - Where to find: Sentry → Settings → Projects → [Your Project] → Client Keys (DSN)

2. **Auth Token** (SENTRY_AUTH_TOKEN)
   - Example: `sntrys_abc123...`
   - Where to find: Sentry → Settings → Account → API → Auth Tokens → Create New Token
   - Needed for uploading source maps

### How to Get These:

1. Go to https://sentry.io
2. Sign up / Log in
3. Create organization: "TripSlip"
4. Create projects (one for each app):
   - `tripslip-landing`
   - `tripslip-venue`
   - `tripslip-school`
   - `tripslip-teacher`
   - `tripslip-parent`
5. For each project:
   - Go to Settings → Client Keys (DSN)
   - Copy the DSN
6. For Auth Token:
   - Settings → Account → API → Auth Tokens
   - Create New Token
   - Name: "TripSlip Deployment"
   - Scopes: `project:read`, `project:releases`, `org:read`
   - Copy the token

---

## 6. Domain Name (Required)

### What I Need From You:

**Your domain name and DNS access**

Example: `tripslip.com`

### DNS Records I'll Need You to Add:

Once you have hosting set up, you'll add these DNS records:

```
Type: CNAME
Name: @
Value: [provided by Cloudflare Pages]

Type: CNAME
Name: venue
Value: [provided by Cloudflare Pages]

Type: CNAME
Name: school
Value: [provided by Cloudflare Pages]

Type: CNAME
Name: teacher
Value: [provided by Cloudflare Pages]

Type: CNAME
Name: parent
Value: [provided by Cloudflare Pages]
```

### How to Get Domain:

1. Go to https://namecheap.com (or your preferred registrar)
2. Search for your desired domain
3. Purchase domain (~$10-15/year)
4. You'll get access to DNS management

---

## 7. Hosting - Cloudflare Pages (Required)

### What I Need From You:

**GitHub repository access and Cloudflare account**

### How to Set Up:

1. Go to https://pages.cloudflare.com
2. Sign up / Log in
3. Connect your GitHub account
4. I'll provide you with the repository
5. For each app, create a new Pages project:
   - Select the repository
   - Set build command: `npm run build --filter=@tripslip/[app-name]`
   - Set build output directory: `apps/[app-name]/dist`
   - Add environment variables (from this document)
6. Cloudflare will give you URLs to add to DNS

**Alternatively:** I can set this up if you give me access to your Cloudflare account.

---

## Summary Checklist

Before deployment, make sure you have:

### Required (Must Have):
- [ ] Supabase: Project URL, Anon Key, Service Role Key
- [ ] Stripe: Publishable Key, Secret Key, Webhook Secret
- [ ] Resend: API Key, From Email (domain verified)
- [ ] Sentry: DSN, Auth Token
- [ ] Domain: Purchased and DNS access available
- [ ] Cloudflare Pages: Account created

### Optional (Can Add Later):
- [ ] Twilio: Account SID, Auth Token, Phone Number

### Total Setup Time:
- **With all services:** ~2-3 hours
- **Without SMS:** ~1-2 hours

---

## Security Notes

### Keep These SECRET (Never Share Publicly):
- ❌ SUPABASE_SERVICE_ROLE_KEY
- ❌ STRIPE_SECRET_KEY
- ❌ STRIPE_WEBHOOK_SECRET
- ❌ EMAIL_API_KEY
- ❌ TWILIO_AUTH_TOKEN
- ❌ SENTRY_AUTH_TOKEN

### These Are Safe to Expose (Used in Frontend):
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ VITE_STRIPE_PUBLISHABLE_KEY
- ✅ SENTRY_DSN
- ✅ Application URLs

---

## Next Steps

Once you provide these credentials:

1. I'll configure the environment variables
2. Deploy the database migrations to Supabase
3. Deploy the Edge Functions to Supabase
4. Build and deploy all 5 applications
5. Configure DNS records
6. Run smoke tests
7. Platform is live! 🚀

---

## Questions?

If you get stuck on any service setup, let me know which one and I'll provide more detailed instructions.

**Estimated time to collect all credentials:** 1-2 hours  
**Estimated time for me to deploy once I have them:** 30-60 minutes
