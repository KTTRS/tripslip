#!/bin/bash

# TripSlip - GitHub Actions Secrets Setup Helper
# This script helps you set up GitHub Actions secrets for automated deployments

set -e

echo "╔════════════════════════════════════════════╗"
echo "║  TripSlip GitHub Actions Secrets Setup    ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is not installed"
  echo ""
  echo "Install it with:"
  echo "  macOS:   brew install gh"
  echo "  Linux:   See https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
  echo "  Windows: See https://github.com/cli/cli/releases"
  echo ""
  exit 1
fi

echo "✅ GitHub CLI found"
echo ""

# Check if logged in
if ! gh auth status &> /dev/null; then
  echo "⚠️  Not logged in to GitHub"
  echo "Running: gh auth login"
  echo ""
  gh auth login
fi

echo "✅ Logged in to GitHub"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"
echo ""

# Function to set secret
set_secret() {
  local name=$1
  local description=$2
  local value=$3
  
  if [ -z "$value" ]; then
    echo "⏭️  Skipping $name (no value provided)"
    return
  fi
  
  echo "Setting $name..."
  echo "$value" | gh secret set "$name" --repo="$REPO"
  echo "✅ $name set"
}

# Function to prompt for secret
prompt_secret() {
  local name=$1
  local description=$2
  local default=$3
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Secret: $name"
  echo "Description: $description"
  
  if [ -n "$default" ]; then
    echo "Default: $default"
  fi
  
  read -p "Enter value (or press Enter to skip): " value
  
  if [ -z "$value" ] && [ -n "$default" ]; then
    value=$default
  fi
  
  if [ -n "$value" ]; then
    set_secret "$name" "$description" "$value"
  else
    echo "⏭️  Skipped"
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Required Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Supabase secrets
prompt_secret "VITE_SUPABASE_URL" \
  "Supabase project URL" \
  "https://yvzpgbhinxibebgeevcu.supabase.co"

prompt_secret "VITE_SUPABASE_ANON_KEY" \
  "Supabase anon key (from dashboard → Settings → API)" \
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2enBnYmhpbnhpYmViZ2VldmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTEwNjgsImV4cCI6MjA4NzQ4NzA2OH0.LImihfOdUBdrgSnYa6m5kgvJB9gKJ-4a3FTcJrQXgaU"

prompt_secret "SUPABASE_PROJECT_REF" \
  "Supabase project reference ID" \
  "yvzpgbhinxibebgeevcu"

prompt_secret "SUPABASE_ACCESS_TOKEN" \
  "Supabase access token (from dashboard → Account → Access Tokens)" \
  ""

# Vercel secrets
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Vercel Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To get these values:"
echo "1. Vercel Token: https://vercel.com/account/tokens"
echo "2. Org ID: Vercel dashboard → Settings → General"
echo "3. Project IDs: Each project → Settings → General"
echo ""

prompt_secret "VERCEL_TOKEN" \
  "Vercel API token" \
  ""

prompt_secret "VERCEL_ORG_ID" \
  "Vercel organization/team ID" \
  ""

prompt_secret "VERCEL_PROJECT_ID_landing" \
  "Vercel project ID for Landing app" \
  ""

prompt_secret "VERCEL_PROJECT_ID_parent" \
  "Vercel project ID for Parent app" \
  ""

prompt_secret "VERCEL_PROJECT_ID_teacher" \
  "Vercel project ID for Teacher app" \
  ""

prompt_secret "VERCEL_PROJECT_ID_venue" \
  "Vercel project ID for Venue app" \
  ""

prompt_secret "VERCEL_PROJECT_ID_school" \
  "Vercel project ID for School app" \
  ""

# Optional secrets
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Optional Secrets (for Stripe/Email/SMS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "These are optional for MVP. You can add them later."
echo ""

read -p "Do you want to add optional secrets now? (y/N): " add_optional

if [[ $add_optional =~ ^[Yy]$ ]]; then
  prompt_secret "VITE_STRIPE_PUBLISHABLE_KEY" \
    "Stripe publishable key (pk_...)" \
    ""

  prompt_secret "STRIPE_SECRET_KEY" \
    "Stripe secret key (sk_...)" \
    ""

  prompt_secret "STRIPE_WEBHOOK_SECRET" \
    "Stripe webhook secret (whsec_...)" \
    ""

  prompt_secret "EMAIL_API_KEY" \
    "Email service API key (SendGrid/Resend)" \
    ""

  prompt_secret "SMS_API_KEY" \
    "SMS service API key (Twilio)" \
    ""
else
  echo "⏭️  Skipping optional secrets"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GitHub Actions Secrets Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To view all secrets:"
echo "  gh secret list --repo=$REPO"
echo ""
echo "To test the CI/CD pipeline:"
echo "  1. Create a test branch: git checkout -b test-ci"
echo "  2. Make a change and push: git push origin test-ci"
echo "  3. Create a PR on GitHub"
echo "  4. Verify checks run and pass"
echo ""
echo "To trigger deployment:"
echo "  1. Merge PR to main: git checkout main && git merge test-ci"
echo "  2. Push to main: git push origin main"
echo "  3. Check GitHub Actions tab for deployment status"
echo ""
