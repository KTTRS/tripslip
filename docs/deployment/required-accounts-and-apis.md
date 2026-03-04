# Required Accounts and APIs for TripSlip Launch

**Date:** March 4, 2026  
**Status:** Pre-Launch Setup Guide

## Overview

TripSlip is a **web-based platform** (not a native mobile app). All applications are Progressive Web Apps (PWAs) that work on any device through a web browser. No iOS App Store or Google Play Store submission is required.

## Architecture Clarification

### Web-Based Platform (Not Native Apps)

**What TripSlip Is:**
- 5 separate web applications built with React + Vite
- Responsive design that works on desktop, tablet, and mobile browsers
- Progressive Web App (PWA) capabilities for mobile-like experience
- Accessible via web browsers (Chrome, Safari, Firefox, Edge)

**What TripSlip Is NOT:**
- NOT a native iOS app (no Swift/Objective-C)
- NOT a native Android app (no Kotlin/Java)
- NOT submitted to App Store or Play Store
- NOT requiring app store approval process

**Why Web-Based:**
- Faster deployment (no app store approval delays)
- Single codebase for all platforms
- Instant updates (no app store review for updates)
- Lower development and maintenance costs
- No app store fees (30% commission)
- Easier for users (no download/install required)
- Works on any device with a browser

### Progressive Web App (PWA) Features

Users can "install" the web app on their mobile devices:
- Add to home screen (iOS/Android)
- Offline functionality (service workers)
- Push notifications (if needed)
- App-like experience
- No app store required

## Required Accounts and APIs

### 1. Supabase (Backend Infrastructure)

**Purpose:** Database, authentication, storage, edge functions

**What You Need:**
- Supabase account (free tier available, paid for production)
- Production project created

**Setup Steps:**
1. Sign up at https://supabase.com
2. Create new project
3. Note your project URL and keys
4. Configure database (run migrations)
5. Deploy edge functions
6. Configure storage buckets

**Pricing:**
- Free tier: $0/month (limited resources)
- Pro tier: $25/month (recommended for production)
- Team tier: $599/month (for larger scale)

**What You Get:**
- PostgreSQL database with RLS
- Authentication service
- File storage
- Edge Functions (serverless)
- Real-time subscriptions
- Auto-generated APIs

**Environment Variables Needed:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Stripe (Payment Processing)

**Purpose:** Payment processing, Stripe Connect for venues

**What You Need:**
- Stripe account (free to create)
- Business verification completed
- Bank account connected

**Setup Steps:**
1. Sign up at https://stripe.com
2. Complete business verification
3. Enable Stripe Connect for marketplace
4. Configure webhook endpoints
5. Get API keys (test and live)

**Pricing:**
- No monthly fee
- 2.9% + $0.30 per successful transaction
- Additional 2% for Stripe Connect (marketplace)

**What You Get:**
- Payment processing (cards, digital wallets)
- Stripe Connect (pay venues)
- Webhook events
- Refund processing
- PCI-DSS compliance
- Fraud prevention

**Environment Variables Needed:**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Email Service (SendGrid OR Resend)

**Purpose:** Transactional emails (permission slips, notifications)

#### Option A: SendGrid

**Setup Steps:**
1. Sign up at https://sendgrid.com
2. Verify sender domain
3. Configure SPF/DKIM records
4. Get API key

**Pricing:**
- Free tier: 100 emails/day
- Essentials: $19.95/month (50,000 emails)
- Pro: $89.95/month (100,000 emails)

#### Option B: Resend (Recommended)

**Setup Steps:**
1. Sign up at https://resend.com
2. Verify sender domain
3. Get API key

**Pricing:**
- Free tier: 3,000 emails/month
- Pro: $20/month (50,000 emails)

**Environment Variables Needed:**
```bash
EMAIL_API_KEY=your-api-key
EMAIL_FROM=noreply@tripslip.com
```

### 4. Twilio (SMS Notifications - Optional)

**Purpose:** SMS notifications for parents

**What You Need:**
- Twilio account
- Phone number purchased
- SMS service configured

**Setup Steps:**
1. Sign up at https://twilio.com
2. Purchase phone number ($1-2/month)
3. Get Account SID and Auth Token
4. Configure messaging service

**Pricing:**
- Phone number: ~$1/month
- SMS: $0.0079 per message (US)
- International rates vary

**Environment Variables Needed:**
```bash
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** SMS is optional. Email is the primary notification method.

### 5. Hosting Platform (Choose One)

#### Option A: Cloudflare Pages (Recommended)

**Purpose:** Host all 5 web applications

**Setup Steps:**
1. Sign up at https://pages.cloudflare.com
2. Connect GitHub repository
3. Configure build settings for each app
4. Set custom domains

**Pricing:**
- Free tier: Unlimited requests, unlimited bandwidth
- Pro: $20/month (advanced features)

**Pros:**
- Free unlimited bandwidth
- Global CDN
- Automatic HTTPS
- Fast deployment
- DDoS protection

#### Option B: Vercel

**Setup Steps:**
1. Sign up at https://vercel.com
2. Import GitHub repository
3. Configure projects for each app
4. Set custom domains

**Pricing:**
- Hobby: Free (personal projects)
- Pro: $20/month per user
- Enterprise: Custom pricing

#### Option C: Netlify

**Setup Steps:**
1. Sign up at https://netlify.com
2. Import GitHub repository
3. Configure build settings
4. Set custom domains

**Pricing:**
- Starter: Free (100GB bandwidth)
- Pro: $19/month (1TB bandwidth)

### 6. Domain Name

**Purpose:** Custom domain for all applications

**What You Need:**
- Domain name (e.g., tripslip.com)
- DNS management access

**Where to Buy:**
- Namecheap: ~$10-15/year
- Google Domains: ~$12/year
- Cloudflare: ~$10/year (at cost)

**DNS Records Needed:**
```
tripslip.com              → Landing app
venue.tripslip.com        → Venue app
school.tripslip.com       → School app
teacher.tripslip.com      → Teacher app
parent.tripslip.com       → Parent app
```

### 7. Monitoring and Error Tracking

#### Sentry (Error Tracking)

**Setup Steps:**
1. Sign up at https://sentry.io
2. Create project for each app
3. Get DSN keys
4. Configure error tracking

**Pricing:**
- Developer: Free (5,000 errors/month)
- Team: $26/month (50,000 errors)
- Business: $80/month (100,000 errors)

**Environment Variables Needed:**
```bash
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your-auth-token
```

#### Uptime Monitoring (Optional)

**Options:**
- UptimeRobot: Free tier available
- Pingdom: $10/month
- StatusCake: Free tier available

### 8. Status Page (Optional but Recommended)

**Options:**
- Statuspage.io: $29/month
- Instatus: $12/month
- Self-hosted: Free (using GitHub Pages)

## Total Cost Estimate

### Minimum Viable Launch (Free/Low Cost)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro | $25/month |
| Stripe | Pay-per-transaction | 2.9% + $0.30 |
| Resend | Free | $0 (up to 3k emails) |
| Twilio | Optional | Skip for launch |
| Cloudflare Pages | Free | $0 |
| Domain | Annual | $12/year (~$1/month) |
| Sentry | Free | $0 (up to 5k errors) |
| **Total** | | **~$26/month** |

### Recommended Production Setup

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro | $25/month |
| Stripe | Pay-per-transaction | 2.9% + $0.30 |
| Resend | Pro | $20/month |
| Twilio | With SMS | ~$50/month (estimated) |
| Cloudflare Pages | Free | $0 |
| Domain | Annual | $12/year (~$1/month) |
| Sentry | Team | $26/month |
| Status Page | Instatus | $12/month |
| **Total** | | **~$134/month** |

### Scale Considerations

As you grow, costs will increase based on:
- Database size and queries (Supabase)
- Transaction volume (Stripe)
- Email volume (Resend)
- SMS volume (Twilio)
- Error volume (Sentry)

## Deployment Architecture

### How It Works

```
User's Browser
    ↓
Custom Domain (tripslip.com)
    ↓
Cloudflare CDN (global edge network)
    ↓
Static Web App (React + Vite)
    ↓
Supabase Backend
    ├── PostgreSQL Database
    ├── Authentication
    ├── Storage
    └── Edge Functions
        ├── Stripe API
        ├── Email API (Resend)
        └── SMS API (Twilio)
```

### Deployment Process

1. **Build Applications:**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages:**
   - Push to GitHub
   - Cloudflare auto-deploys
   - Or use CLI: `wrangler pages publish`

3. **Configure DNS:**
   - Point domains to Cloudflare
   - SSL automatically provisioned

4. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy
   ```

5. **Run Database Migrations:**
   ```bash
   supabase db push
   ```

## Mobile Experience (Without App Stores)

### Progressive Web App (PWA)

Users can install TripSlip on their phones:

**iOS (Safari):**
1. Visit tripslip.com
2. Tap Share button
3. Tap "Add to Home Screen"
4. App icon appears on home screen
5. Opens like a native app

**Android (Chrome):**
1. Visit tripslip.com
2. Tap menu (three dots)
3. Tap "Add to Home Screen"
4. App icon appears on home screen
5. Opens like a native app

**Benefits:**
- No app store approval needed
- Instant updates
- Works offline (with service workers)
- Push notifications (if configured)
- Full-screen experience

### Why Not Native Apps?

**Advantages of Web-Based:**
- ✅ Faster to market (no app store approval)
- ✅ Single codebase (lower maintenance)
- ✅ Instant updates (no waiting for approval)
- ✅ No app store fees (30% commission)
- ✅ Works on all devices
- ✅ Easier for users (no download required)
- ✅ Better for SEO (web presence)

**When to Consider Native Apps:**
- Need device-specific features (camera, GPS, etc.)
- Require offline-first functionality
- Want app store visibility
- Have budget for separate iOS/Android teams

**For TripSlip:**
Web-based is the right choice because:
- Permission slips work great in browsers
- Payment processing works in web
- No need for device-specific features
- Faster deployment and updates
- Lower cost and complexity

## Setup Checklist

### Before Launch

- [ ] Create Supabase account and project
- [ ] Create Stripe account and complete verification
- [ ] Create email service account (Resend recommended)
- [ ] Create Twilio account (optional for SMS)
- [ ] Purchase domain name
- [ ] Create Cloudflare Pages account
- [ ] Create Sentry account
- [ ] Set up all environment variables
- [ ] Configure DNS records
- [ ] Deploy applications
- [ ] Test all integrations

### Environment Variables Template

Create `.env.production` file:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@tripslip.com

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Application URLs
VITE_LANDING_URL=https://tripslip.com
VITE_VENUE_URL=https://venue.tripslip.com
VITE_SCHOOL_URL=https://school.tripslip.com
VITE_TEACHER_URL=https://teacher.tripslip.com
VITE_PARENT_URL=https://parent.tripslip.com

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your-auth-token

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ERROR_TRACKING=true
ENABLE_PERFORMANCE_MONITORING=true
```

## Support and Documentation

### Service Documentation

- **Supabase:** https://supabase.com/docs
- **Stripe:** https://stripe.com/docs
- **Resend:** https://resend.com/docs
- **Twilio:** https://www.twilio.com/docs
- **Cloudflare Pages:** https://developers.cloudflare.com/pages
- **Sentry:** https://docs.sentry.io

### Getting Help

- Supabase Discord: https://discord.supabase.com
- Stripe Support: https://support.stripe.com
- Community forums for each service

## Conclusion

TripSlip is a web-based platform that requires:
- Backend infrastructure (Supabase)
- Payment processing (Stripe)
- Email service (Resend)
- Web hosting (Cloudflare Pages)
- Domain name
- Monitoring (Sentry)

**No app store submission required** - users access via web browsers on any device.

**Minimum cost:** ~$26/month to launch  
**Recommended cost:** ~$134/month for production

---

**Questions?** Contact: tech@tripslip.com
