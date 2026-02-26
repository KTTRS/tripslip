#!/bin/bash

# Redeploy all apps with correct environment variables

set -e

export VITE_SUPABASE_URL="https://yvzpgbhinxibebgeevcu.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2enBnYmhpbnhpYmViZ2VldmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTEwNjgsImV4cCI6MjA4NzQ4NzA2OH0.LImihfOdUBdrgSnYa6m5kgvJB9gKJ-4a3FTcJrQXgaU"

echo "🔄 Redeploying apps with environment variables..."
echo ""

# Parent App
echo "📦 Building Parent App..."
cd apps/parent
npx vite build
echo "🚀 Deploying Parent App..."
yes | wrangler pages deploy dist --project-name="tripslip-parent" --branch=main
cd ../..
echo "✅ Parent App deployed"
echo ""

# Teacher App
echo "📦 Building Teacher App..."
cd apps/teacher
npx vite build
echo "🚀 Deploying Teacher App..."
yes | wrangler pages deploy dist --project-name="tripslip-teacher" --branch=main
cd ../..
echo "✅ Teacher App deployed"
echo ""

# Venue App
echo "📦 Building Venue App..."
cd apps/venue
npx vite build
echo "🚀 Deploying Venue App..."
yes | wrangler pages deploy dist --project-name="tripslip-venue" --branch=main
cd ../..
echo "✅ Venue App deployed"
echo ""

# School App
echo "📦 Building School App..."
cd apps/school
npx vite build
echo "🚀 Deploying School App..."
yes | wrangler pages deploy dist --project-name="tripslip-school" --branch=main
cd ../..
echo "✅ School App deployed"
echo ""

echo "🎉 All apps redeployed with environment variables!"
