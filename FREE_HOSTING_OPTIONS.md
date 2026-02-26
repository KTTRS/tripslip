# Free Hosting Options for TripSlip

## 🆓 Completely Free Alternatives to Vercel

All of these options are **100% free** with no credit card required.

---

## Option 1: Netlify (Recommended - Most Similar to Vercel)

### Free Tier Includes:
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ Continuous deployment from Git
- ✅ No credit card required

### Deploy to Netlify

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify
```bash
netlify login
```
(Creates free account if you don't have one)

#### Step 3: Deploy All Apps
```bash
# Set environment variable
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2enBnYmhpbnhpYmViZ2VldmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTEwNjgsImV4cCI6MjA4NzQ4NzA2OH0.LImihfOdUBdrgSnYa6m5kgvJB9gKJ-4a3FTcJrQXgaU"

# Run deployment script
./scripts/deploy-netlify.sh
```

**Expected URLs:**
- Landing: `tripslip-landing.netlify.app`
- Parent: `tripslip-parent.netlify.app`
- Teacher: `tripslip-teacher.netlify.app`
- Venue: `tripslip-venue.netlify.app`
- School: `tripslip-school.netlify.app`

---

## Option 2: Cloudflare Pages

### Free Tier Includes:
- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ 500 builds/month
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ No credit card required

### Deploy to Cloudflare Pages

#### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
```

#### Step 2: Login to Cloudflare
```bash
wrangler login
```

#### Step 3: Deploy All Apps
```bash
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2enBnYmhpbnhpYmViZ2VldmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTEwNjgsImV4cCI6MjA4NzQ4NzA2OH0.LImihfOdUBdrgSnYa6m5kgvJB9gKJ-4a3FTcJrQXgaU"

./scripts/deploy-cloudflare.sh
```

**Expected URLs:**
- Landing: `tripslip-landing.pages.dev`
- Parent: `tripslip-parent.pages.dev`
- Teacher: `tripslip-teacher.pages.dev`
- Venue: `tripslip-venue.pages.dev`
- School: `tripslip-school.pages.dev`

---

## Option 3: GitHub Pages (Simplest)

### Free Tier Includes:
- ✅ Unlimited bandwidth (soft limit)
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ Automatic deployment from Git
- ✅ No credit card required

### Deploy to GitHub Pages

#### Step 1: Enable GitHub Pages
```bash
# Already configured in .github/workflows/deploy-github-pages.yml
# Just push to main branch
git push origin main
```

#### Step 2: Configure GitHub Pages
1. Go to GitHub repository → Settings → Pages
2. Source: "GitHub Actions"
3. Wait for deployment (~2 minutes)

**Expected URLs:**
- All apps: `https://[your-username].github.io/tripslip/[app-name]`
- Example: `https://kttrs.github.io/tripslip/landing`

---

## Option 4: Render (Good for Full-Stack)

### Free Tier Includes:
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ Continuous deployment from Git
- ✅ No credit card required
- ⚠️ Apps sleep after 15 minutes of inactivity (cold starts)

### Deploy to Render

#### Step 1: Create Render Account
Go to https://render.com and sign up (free, no credit card)

#### Step 2: Deploy via Dashboard
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure each app:
   - **Name**: tripslip-landing
   - **Build Command**: `cd apps/landing && npm install && npm run build`
   - **Publish Directory**: `apps/landing/dist`
   - **Environment Variables**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Repeat for all 5 apps

**Expected URLs:**
- Landing: `tripslip-landing.onrender.com`
- Parent: `tripslip-parent.onrender.com`
- Teacher: `tripslip-teacher.onrender.com`
- Venue: `tripslip-venue.onrender.com`
- School: `tripslip-school.onrender.com`

---

## Option 5: Firebase Hosting (Google)

### Free Tier Includes:
- ✅ 10GB storage
- ✅ 360MB/day bandwidth
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ No credit card required

### Deploy to Firebase

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase
```bash
firebase login
```

#### Step 3: Deploy All Apps
```bash
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2enBnYmhpbnhpYmViZ2VldmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTEwNjgsImV4cCI6MjA4NzQ4NzA2OH0.LImihfOdUBdrgSnYa6m5kgvJB9gKJ-4a3FTcJrQXgaU"

./scripts/deploy-firebase.sh
```

**Expected URLs:**
- Landing: `tripslip-landing.web.app`
- Parent: `tripslip-parent.web.app`
- Teacher: `tripslip-teacher.web.app`
- Venue: `tripslip-venue.web.app`
- School: `tripslip-school.web.app`

---

## Comparison Table

| Platform | Bandwidth | Build Minutes | Cold Starts | SSL | Custom Domain | Credit Card |
|----------|-----------|---------------|-------------|-----|---------------|-------------|
| **Netlify** | 100GB/mo | 300/mo | No | ✅ | ✅ | ❌ Not required |
| **Cloudflare** | Unlimited | 500/mo | No | ✅ | ✅ | ❌ Not required |
| **GitHub Pages** | Soft limit | Unlimited | No | ✅ | ✅ | ❌ Not required |
| **Render** | 100GB/mo | Unlimited | Yes (15min) | ✅ | ✅ | ❌ Not required |
| **Firebase** | 360MB/day | Unlimited | No | ✅ | ✅ | ❌ Not required |
| **Vercel** | 100GB/mo | 6000/mo | No | ✅ | ✅ | ❌ Not required |

---

## My Recommendation

### For TripSlip, I recommend: **Netlify** or **Cloudflare Pages**

**Why Netlify:**
- ✅ Most similar to Vercel (easy migration later)
- ✅ Generous free tier (100GB bandwidth)
- ✅ No cold starts
- ✅ Great build performance
- ✅ Easy CLI deployment
- ✅ Automatic deployments from Git

**Why Cloudflare Pages:**
- ✅ Unlimited bandwidth (best for high traffic)
- ✅ Fastest global CDN
- ✅ No cold starts
- ✅ Great for production apps
- ✅ Easy CLI deployment

**Avoid:**
- ❌ Render (cold starts after 15 minutes - bad UX)
- ❌ Firebase (low bandwidth limit - 360MB/day)
- ⚠️ GitHub Pages (works but less professional URLs)

---

## Quick Start (Netlify)

I'll create the deployment script for you. Just run:

```bash
npm install -g netlify-cli
netlify login
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2enBnYmhpbnhpYmViZ2VldmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTEwNjgsImV4cCI6MjA4NzQ4NzA2OH0.LImihfOdUBdrgSnYa6m5kgvJB9gKJ-4a3FTcJrQXgaU"
./scripts/deploy-netlify.sh
```

**Time to deploy**: ~5 minutes
**Cost**: $0 forever

---

## Need Help Choosing?

**If you want:**
- Easiest setup → **Netlify**
- Best performance → **Cloudflare Pages**
- Simplest (no CLI) → **GitHub Pages**
- Most bandwidth → **Cloudflare Pages**

All are 100% free with no credit card required!
