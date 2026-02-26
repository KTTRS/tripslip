#!/bin/bash

# TripSlip - Deploy All Applications to Cloudflare Pages (Skip TypeScript Checking)
# This script deploys all 5 applications to Cloudflare Pages without TypeScript checking

set -e  # Exit on error

echo "🚀 TripSlip Cloudflare Pages Deployment (FREE + UNLIMITED)"
echo "==========================================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "❌ Wrangler CLI not installed"
  echo "Please run: npm install -g wrangler"
  exit 1
fi

# Check if logged in
if ! wrangler whoami > /dev/null 2>&1; then
  echo "⚠️  Not logged in to Cloudflare"
  echo "Running: wrangler login"
  wrangler login
fi

echo "✅ Logged in to Cloudflare"
echo ""

# Get Supabase credentials
SUPABASE_URL="${VITE_SUPABASE_URL:-https://yvzpgbhinxibebgeevcu.supabase.co}"
SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}"

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "⚠️  VITE_SUPABASE_ANON_KEY not set"
  echo "Please set it in your environment or .env file"
  echo ""
  read -p "Enter Supabase Anon Key: " SUPABASE_ANON_KEY
fi

echo "📦 Building and deploying applications (skipping TypeScript checks)..."
echo ""

# Function to deploy an app
deploy_app() {
  local app_name=$1
  local app_path="apps/$app_name"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Deploying $app_name App..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  cd "$app_path"
  
  # Build the app (Vite only, skip tsc)
  echo "Building..."
  VITE_SUPABASE_URL="$SUPABASE_URL" \
  VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  npx vite build
  
  # Deploy to Cloudflare Pages
  echo "Deploying to Cloudflare Pages..."
  wrangler pages deploy dist \
    --project-name="tripslip-$app_name" \
    --branch=main
  
  cd ../..
  echo "✅ $app_name App deployed"
  echo ""
}

# Deploy all 5 apps
deploy_app "landing"
deploy_app "parent"
deploy_app "teacher"
deploy_app "venue"
deploy_app "school"

echo "==========================================================="
echo "🎉 All applications deployed successfully!"
echo ""
echo "📋 Deployment URLs:"
echo "   Landing: https://tripslip-landing.pages.dev"
echo "   Parent:  https://tripslip-parent.pages.dev"
echo "   Teacher: https://tripslip-teacher.pages.dev"
echo "   Venue:   https://tripslip-venue.pages.dev"
echo "   School:  https://tripslip-school.pages.dev"
echo ""
echo "💡 Benefits of Cloudflare Pages:"
echo "   ✅ UNLIMITED bandwidth (no limits!)"
echo "   ✅ Fastest global CDN"
echo "   ✅ 100% FREE forever"
echo "   ✅ No cold starts"
echo ""
echo "⚠️  Note: Payment processing, email, and SMS features require"
echo "   additional configuration (Stripe, SendGrid, Twilio)"
echo ""
