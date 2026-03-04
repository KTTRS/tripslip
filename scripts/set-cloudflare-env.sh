#!/bin/bash

# Set environment variables for all Cloudflare Pages projects

SUPABASE_URL="https://yvzpgbhinxibebgeevcu.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2enBnYmhpbnhpYmViZ2VldmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTEwNjgsImV4cCI6MjA4NzQ4NzA2OH0.LImihfOdUBdrgSnYa6m5kgvJB9gKJ-4a3FTcJrQXgaU"

echo "🔧 Setting environment variables for Cloudflare Pages projects..."
echo ""

# Parent App
echo "Setting env vars for tripslip-parent..."
wrangler pages project create tripslip-parent --production-branch=main 2>/dev/null || true
wrangler pages deployment create dist --project-name=tripslip-parent --branch=main \
  --env VITE_SUPABASE_URL="$SUPABASE_URL" \
  --env VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"

# Teacher App
echo "Setting env vars for tripslip-teacher..."
wrangler pages project create tripslip-teacher --production-branch=main 2>/dev/null || true
wrangler pages deployment create dist --project-name=tripslip-teacher --branch=main \
  --env VITE_SUPABASE_URL="$SUPABASE_URL" \
  --env VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"

# Venue App
echo "Setting env vars for tripslip-venue..."
wrangler pages project create tripslip-venue --production-branch=main 2>/dev/null || true
wrangler pages deployment create dist --project-name=tripslip-venue --branch=main \
  --env VITE_SUPABASE_URL="$SUPABASE_URL" \
  --env VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"

# School App
echo "Setting env vars for tripslip-school..."
wrangler pages project create tripslip-school --production-branch=main 2>/dev/null || true
wrangler pages deployment create dist --project-name=tripslip-school --branch=main \
  --env VITE_SUPABASE_URL="$SUPABASE_URL" \
  --env VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"

echo ""
echo "✅ Environment variables set for all projects!"
