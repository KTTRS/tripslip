# Quick Start: Critical Fixes

This guide walks through fixing the 10 most critical issues to get TripSlip ready for deployment.

## 🚀 Quick Fix Sequence (2-3 hours)

### Fix 1: Clean Up Duplicate Root Application (15 min)

The root `src/` directory conflicts with the monorepo structure. Let's remove it:

```bash
# Backup first (just in case)
mv src src_backup
mv index.html index_backup.html
mv vite.config.ts vite.config_backup.ts

# Remove TypeScript configs at root (apps have their own)
rm tsconfig.app.json tsconfig.node.json

# Keep only these at root:
# - tsconfig.json (base config)
# - tsconfig.base.json (shared config)
```

**Verify**: Run `npm run dev` - all apps should still work.

---

### Fix 2: Remove Duplicate Database Types (5 min)

```bash
# Remove the duplicate
rm src_backup/lib/database.types.ts

# Verify the correct one exists
cat packages/database/src/types.ts
```

---

### Fix 3: Create Supabase Configuration (10 min)

Create `supabase/config.toml`:

```bash
cat > supabase/config.toml << 'EOF'
# Supabase Project Configuration
project_id = "YOUR_PROJECT_ID"

[api]
enabled = true
port = 54321
schemas = ["public"]
extra_search_path = ["public"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "http://localhost:3001",
  "http://localhost:3002", 
  "http://localhost:3003",
  "http://localhost:3004"
]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[functions]
enabled = true
EOF
```

**Note**: Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

---

### Fix 4: Update Environment Variables (10 min)

Update `.env.example` with all required variables:

```bash
cat > .env.example << 'EOF'
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
# Get these from: https://supabase.com/dashboard/project/_/settings/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key (NEVER expose to frontend, only for Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# =============================================================================
# STRIPE CONFIGURATION
# =============================================================================
# Get these from: https://dashboard.stripe.com/apikeys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
STRIPE_SECRET_KEY=sk_test_your-secret-key-here

# Get this from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here

# =============================================================================
# EMAIL SERVICE CONFIGURATION
# =============================================================================
# Choose one: SendGrid, Resend, AWS SES, Mailgun
EMAIL_API_KEY=your-email-api-key-here
EMAIL_FROM=noreply@tripslip.com
EMAIL_FROM_NAME=TripSlip

# =============================================================================
# SMS SERVICE CONFIGURATION
# =============================================================================
# Choose one: Twilio, AWS SNS, MessageBird
SMS_API_KEY=your-sms-api-key-here
SMS_FROM=+1234567890

# =============================================================================
# APPLICATION URLS - DEVELOPMENT
# =============================================================================
VITE_LANDING_URL=http://localhost:3000
VITE_VENUE_URL=http://localhost:3001
VITE_SCHOOL_URL=http://localhost:3002
VITE_TEACHER_URL=http://localhost:3003
VITE_PARENT_URL=http://localhost:3004

# =============================================================================
# APPLICATION URLS - PRODUCTION (uncomment when deploying)
# =============================================================================
# VITE_LANDING_URL=https://tripslip.com
# VITE_VENUE_URL=https://venue.tripslip.com
# VITE_SCHOOL_URL=https://school.tripslip.com
# VITE_TEACHER_URL=https://teacher.tripslip.com
# VITE_PARENT_URL=https://parent.tripslip.com

# =============================================================================
# MONITORING & ANALYTICS (optional)
# =============================================================================
# SENTRY_DSN=your-sentry-dsn-here
# VERCEL_ANALYTICS_ID=your-vercel-analytics-id-here
EOF
```

Now create your actual `.env` file:

```bash
cp .env.example .env
# Edit .env with your actual values
nano .env  # or use your preferred editor
```

---

### Fix 5: Create Deployment Configs for Each App (20 min)

Create Vercel configuration for each app:

```bash
# Landing App
cat > apps/landing/vercel.json << 'EOF'
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=@tripslip/landing",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF

# Venue App
cat > apps/venue/vercel.json << 'EOF'
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=@tripslip/venue",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF

# School App
cat > apps/school/vercel.json << 'EOF'
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=@tripslip/school",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF

# Teacher App
cat > apps/teacher/vercel.json << 'EOF'
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=@tripslip/teacher",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF

# Parent App
cat > apps/parent/vercel.json << 'EOF'
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=@tripslip/parent",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF
```

---

### Fix 6: Regenerate Database Types (15 min)

**Prerequisites**: 
- Supabase project created
- All migrations applied

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Generate types from your database
supabase gen types typescript --linked > packages/database/src/types.ts

# Verify the types include all 21 tables
grep "Tables:" packages/database/src/types.ts -A 50
```

**Expected tables** (should see all of these):
- venues
- schools  
- teachers
- students
- guardians
- experiences
- trips
- permission_slips
- payments
- refunds
- documents
- notifications
- audit_logs
- rate_limits
- And more...

---

### Fix 7: Test Build Process (10 min)

```bash
# Clean everything
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Build all packages
npm run build

# Check for errors
echo "Build completed successfully!"
```

---

### Fix 8: Set Up Supabase Project (30 min)

If you haven't created a Supabase project yet:

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Fill in:
#    - Name: TripSlip
#    - Database Password: (generate strong password)
#    - Region: (closest to your users)
# 4. Wait for project to be created (~2 minutes)

# 5. Get your credentials
# Go to: Settings > API
# Copy:
#   - Project URL (VITE_SUPABASE_URL)
#   - anon/public key (VITE_SUPABASE_ANON_KEY)
#   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

# 6. Update your .env file with these values

# 7. Run migrations
supabase db push

# 8. Verify tables created
supabase db diff
```

---

### Fix 9: Deploy Edge Functions (20 min)

```bash
# Deploy all Edge Functions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy process-refund
supabase functions deploy send-notification
supabase functions deploy generate-pdf

# Set secrets for Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
supabase secrets set EMAIL_API_KEY=your_email_key
supabase secrets set SMS_API_KEY=your_sms_key

# Test an Edge Function
curl -i --location --request POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/create-payment-intent' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"test": true}'
```

---

### Fix 10: Set Up Stripe Webhook (15 min)

```bash
# 1. Go to: https://dashboard.stripe.com/webhooks
# 2. Click "Add endpoint"
# 3. Endpoint URL: https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
# 4. Select events:
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - charge.refunded
# 5. Click "Add endpoint"
# 6. Copy the "Signing secret" (starts with whsec_)
# 7. Update STRIPE_WEBHOOK_SECRET in your .env and Supabase secrets

# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

---

## ✅ Verification Checklist

After completing all fixes, verify:

```bash
# 1. All apps build successfully
npm run build

# 2. All apps start in development
npm run dev

# 3. No TypeScript errors
npm run type-check

# 4. Linting passes
npm run lint

# 5. Environment variables are set
cat .env | grep -v "^#" | grep "="

# 6. Supabase connection works
# Open any app and check browser console for errors

# 7. Database types are current
grep "venues:" packages/database/src/types.ts

# 8. Edge Functions are deployed
supabase functions list

# 9. Stripe webhook is configured
# Check Stripe dashboard > Webhooks
```

---

## 🎯 What's Next?

After completing these critical fixes:

1. **Complete Application Implementations** (see DEPLOYMENT_PLAN.md Phase 2)
2. **Add Tests** (see DEPLOYMENT_PLAN.md Phase 6)
3. **Deploy to Staging** (see DEPLOYMENT_PLAN.md Step 4)
4. **Production Launch** (see DEPLOYMENT_PLAN.md Step 9)

---

## 🆘 Troubleshooting

### Issue: "Cannot find module '@tripslip/ui'"

```bash
# Build packages first
cd packages/ui && npm run build
cd ../..
npm run dev
```

### Issue: "Supabase connection failed"

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify they're in .env file
cat .env | grep SUPABASE
```

### Issue: "Edge Function deployment failed"

```bash
# Check you're logged in
supabase status

# Re-login if needed
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF
```

### Issue: "Build fails with type errors"

```bash
# Regenerate database types
supabase gen types typescript --linked > packages/database/src/types.ts

# Clean and rebuild
npm run clean
npm run build
```

---

## 📞 Need Help?

- Check the full [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) for detailed instructions
- Review [Supabase Docs](https://supabase.com/docs)
- Review [Turborepo Docs](https://turbo.build/repo/docs)
- Check GitHub Issues for similar problems

---

**Estimated Time**: 2-3 hours  
**Difficulty**: Intermediate  
**Prerequisites**: Node.js 18+, npm 9+, Supabase account, Stripe account
