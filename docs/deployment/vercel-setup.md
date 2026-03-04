# Vercel Deployment Setup

## Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Environment variables configured

## Project Configuration

### 1. Landing App (tripslip.com)
```bash
vercel --prod
```

**Build Settings:**
- Framework: Vite
- Build Command: `npm run build --filter=@tripslip/landing`
- Output Directory: `apps/landing/dist`
- Install Command: `npm ci`

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 2. Venue App (venue.tripslip.com)
**Build Settings:**
- Framework: Vite
- Build Command: `npm run build --filter=@tripslip/venue`
- Output Directory: `apps/venue/dist`

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### 3. School App (school.tripslip.com)
**Build Settings:**
- Framework: Vite
- Build Command: `npm run build --filter=@tripslip/school`
- Output Directory: `apps/school/dist`

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. Teacher App (teacher.tripslip.com)
**Build Settings:**
- Framework: Vite
- Build Command: `npm run build --filter=@tripslip/teacher`
- Output Directory: `apps/teacher/dist`

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 5. Parent App (parent.tripslip.com)
**Build Settings:**
- Framework: Vite
- Build Command: `npm run build --filter=@tripslip/parent`
- Output Directory: `apps/parent/dist`

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

## Custom Domains
1. Add custom domain in Vercel dashboard
2. Configure DNS records:
   - A record: `@` → Vercel IP
   - CNAME: `www` → `cname.vercel-dns.com`
3. Enable SSL (automatic with Vercel)

## Turborepo Configuration
Vercel automatically detects Turborepo and uses remote caching.
