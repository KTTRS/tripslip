#!/bin/bash

# TripSlip - Deploy All Applications to Netlify
# This script deploys all 5 applications to Netlify (100% FREE)

set -e  # Exit on error

echo "🚀 TripSlip Netlify Deployment (FREE)"
echo "======================================"
echo ""

# Check if logged in to Netlify
if ! netlify status > /dev/null 2>&1; then
  echo "❌ Not logged in to Netlify"
  echo "Please run: netlify login"
  exit 1
fi

echo "✅ Logged in to Netlify"
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

echo "📦 Building and deploying applications..."
echo ""

# Function to deploy an app
deploy_app() {
  local app_name=$1
  local app_path="apps/$app_name"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Deploying $app_name App..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  cd "$app_path"
  
  # Build the app
  echo "Building..."
  VITE_SUPABASE_URL="$SUPABASE_URL" \
  VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  npm run build
  
  # Deploy to Netlify
  echo "Deploying to Netlify..."
  netlify deploy \
    --prod \
    --dir=dist \
    --site="tripslip-$app_name" \
    --message="Deploy $app_name app"
  
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

echo "======================================"
echo "🎉 All applications deployed successfully!"
echo ""
echo "📋 Deployment URLs:"
echo "   Landing: https://tripslip-landing.netlify.app"
echo "   Parent:  https://tripslip-parent.netlify.app"
echo "   Teacher: https://tripslip-teacher.netlify.app"
echo "   Venue:   https://tripslip-venue.netlify.app"
echo "   School:  https://tripslip-school.netlify.app"
echo ""
echo "💡 To configure custom domains:"
echo "   1. Go to Netlify dashboard"
echo "   2. Select each site"
echo "   3. Domain settings → Add custom domain"
echo ""
echo "⚠️  Note: Payment processing, email, and SMS features require"
echo "   additional configuration (Stripe, SendGrid, Twilio)"
echo ""
