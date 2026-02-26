#!/bin/bash

# TripSlip - Deploy All Applications to Vercel
# This script deploys all 5 applications to Vercel production

set -e  # Exit on error

echo "🚀 TripSlip Production Deployment"
echo "=================================="
echo ""

# Check if logged in to Vercel
if ! vercel whoami > /dev/null 2>&1; then
  echo "❌ Not logged in to Vercel"
  echo "Please run: vercel login"
  exit 1
fi

echo "✅ Logged in to Vercel as: $(vercel whoami)"
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

# Deploy Landing App
echo "1️⃣  Deploying Landing App..."
cd apps/landing
vercel --prod --yes \
  -e VITE_SUPABASE_URL="$SUPABASE_URL" \
  -e VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --name tripslip-landing
cd ../..
echo "✅ Landing App deployed"
echo ""

# Deploy Parent App
echo "2️⃣  Deploying Parent App..."
cd apps/parent
vercel --prod --yes \
  -e VITE_SUPABASE_URL="$SUPABASE_URL" \
  -e VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --name tripslip-parent
cd ../..
echo "✅ Parent App deployed"
echo ""

# Deploy Teacher App
echo "3️⃣  Deploying Teacher App..."
cd apps/teacher
vercel --prod --yes \
  -e VITE_SUPABASE_URL="$SUPABASE_URL" \
  -e VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --name tripslip-teacher
cd ../..
echo "✅ Teacher App deployed"
echo ""

# Deploy Venue App
echo "4️⃣  Deploying Venue App..."
cd apps/venue
vercel --prod --yes \
  -e VITE_SUPABASE_URL="$SUPABASE_URL" \
  -e VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --name tripslip-venue
cd ../..
echo "✅ Venue App deployed"
echo ""

# Deploy School App
echo "5️⃣  Deploying School App..."
cd apps/school
vercel --prod --yes \
  -e VITE_SUPABASE_URL="$SUPABASE_URL" \
  -e VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --name tripslip-school
cd ../..
echo "✅ School App deployed"
echo ""

echo "=================================="
echo "🎉 All applications deployed successfully!"
echo ""
echo "📋 Deployment URLs:"
echo "   Landing: https://tripslip-landing.vercel.app"
echo "   Parent:  https://tripslip-parent.vercel.app"
echo "   Teacher: https://tripslip-teacher.vercel.app"
echo "   Venue:   https://tripslip-venue.vercel.app"
echo "   School:  https://tripslip-school.vercel.app"
echo ""
echo "⚠️  Note: Payment processing, email, and SMS features require"
echo "   additional configuration (Stripe, SendGrid, Twilio)"
echo ""
