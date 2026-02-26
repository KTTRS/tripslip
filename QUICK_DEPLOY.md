# 🚀 Quick Deploy - TripSlip to Vercel

## Prerequisites
- ✅ All apps built and tested
- ✅ Database migrations applied
- ✅ Edge Functions deployed
- ✅ Supabase anon key obtained

## Deploy in 3 Steps

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
(Creates free account if you don't have one)

### Step 3: Deploy All Apps
```bash
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2enBnYmhpbnhpYmViZ2VldmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTEwNjgsImV4cCI6MjA4NzQ4NzA2OH0.LImihfOdUBdrgSnYa6m5kgvJB9gKJ-4a3FTcJrQXgaU"

./scripts/deploy-all-apps.sh
```

## Verify Deployment
```bash
node scripts/verify-deployments.js
```

## Expected URLs
- Landing: https://tripslip-landing.vercel.app
- Parent: https://tripslip-parent.vercel.app
- Teacher: https://tripslip-teacher.vercel.app
- Venue: https://tripslip-venue.vercel.app
- School: https://tripslip-school.vercel.app

## What Works (MVP)
✅ User authentication
✅ Trip management
✅ Permission slip viewing
✅ Student roster management
✅ Dashboard analytics
✅ Experience management
✅ Teacher management

## What's Optional
⏳ Payment processing (requires Stripe)
⏳ Email notifications (requires SendGrid/Resend)
⏳ SMS notifications (requires Twilio)

## Setup GitHub Auto-Deploy (Optional)
```bash
./scripts/setup-github-secrets.sh
```

## Need Help?
- Full guide: `PHASE7_DEPLOYMENT_GUIDE.md`
- Troubleshooting: `DEPLOYMENT_INSTRUCTIONS.md`
- Vercel docs: https://vercel.com/docs

---

**Time to deploy**: ~5 minutes
**Cost**: Free (Vercel hobby plan)
