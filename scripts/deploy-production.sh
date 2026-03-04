#!/bin/bash

# TripSlip Production Deployment Script
# Usage: ./scripts/deploy-production.sh [app-name]
# Example: ./scripts/deploy-production.sh landing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment-${DEPLOYMENT_DATE}.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log "Starting TripSlip production deployment..."

# Check if app name is provided
APP_NAME=${1:-"all"}
log "Deploying: $APP_NAME"

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    error "Not on main branch. Current branch: $CURRENT_BRANCH"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    error "Uncommitted changes detected. Please commit or stash changes."
fi

# Check if all tests pass
log "Running tests..."
if ! npm run test; then
    error "Tests failed. Aborting deployment."
fi

# Check TypeScript compilation
log "Checking TypeScript compilation..."
if ! npm run type-check; then
    error "TypeScript compilation failed. Aborting deployment."
fi

# Check linting
log "Running linter..."
if ! npm run lint; then
    warn "Linting issues detected. Consider fixing before deployment."
fi

# Build applications
log "Building applications..."
if ! npm run build; then
    error "Build failed. Aborting deployment."
fi

# Create database backup
log "Creating database backup..."
if command -v supabase &> /dev/null; then
    BACKUP_FILE="${BACKUP_DIR}/backup-${DEPLOYMENT_DATE}.sql"
    if supabase db dump -f "$BACKUP_FILE"; then
        log "Database backup created: $BACKUP_FILE"
    else
        warn "Database backup failed. Continuing anyway..."
    fi
else
    warn "Supabase CLI not found. Skipping database backup."
fi

# Deploy based on app name
deploy_app() {
    local app=$1
    log "Deploying $app app..."
    
    case $app in
        landing)
            log "Deploying landing app to production..."
            # Add your deployment command here
            # Example: wrangler pages publish apps/landing/dist
            ;;
        venue)
            log "Deploying venue app to production..."
            # Add your deployment command here
            ;;
        school)
            log "Deploying school app to production..."
            # Add your deployment command here
            ;;
        teacher)
            log "Deploying teacher app to production..."
            # Add your deployment command here
            ;;
        parent)
            log "Deploying parent app to production..."
            # Add your deployment command here
            ;;
        *)
            error "Unknown app: $app"
            ;;
    esac
}

# Deploy Edge Functions
deploy_edge_functions() {
    log "Deploying Edge Functions..."
    
    if command -v supabase &> /dev/null; then
        FUNCTIONS=(
            "create-payment-intent"
            "stripe-webhook"
            "send-email"
            "send-sms"
            "create-stripe-connect-link"
            "export-student-data"
        )
        
        for func in "${FUNCTIONS[@]}"; do
            log "Deploying function: $func"
            if supabase functions deploy "$func"; then
                log "✓ $func deployed successfully"
            else
                error "Failed to deploy function: $func"
            fi
        done
    else
        warn "Supabase CLI not found. Skipping Edge Functions deployment."
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    if command -v supabase &> /dev/null; then
        if supabase db push; then
            log "✓ Migrations applied successfully"
        else
            error "Failed to apply migrations"
        fi
    else
        warn "Supabase CLI not found. Skipping migrations."
    fi
}

# Main deployment logic
if [ "$APP_NAME" == "all" ]; then
    log "Deploying all applications..."
    
    # Run migrations first
    run_migrations
    
    # Deploy Edge Functions
    deploy_edge_functions
    
    # Deploy all apps
    for app in landing venue school teacher parent; do
        deploy_app "$app"
    done
else
    # Deploy specific app
    deploy_app "$APP_NAME"
fi

# Post-deployment verification
log "Running post-deployment verification..."

# Smoke tests
smoke_test() {
    local url=$1
    local name=$2
    
    log "Testing $name: $url"
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        log "✓ $name is responding"
    else
        warn "✗ $name may not be responding correctly"
    fi
}

# Test all apps
smoke_test "https://tripslip.com" "Landing"
smoke_test "https://venue.tripslip.com" "Venue"
smoke_test "https://school.tripslip.com" "School"
smoke_test "https://teacher.tripslip.com" "Teacher"
smoke_test "https://parent.tripslip.com" "Parent"

# Create deployment tag
DEPLOYMENT_TAG="production-${DEPLOYMENT_DATE}"
log "Creating deployment tag: $DEPLOYMENT_TAG"
git tag -a "$DEPLOYMENT_TAG" -m "Production deployment on $DEPLOYMENT_DATE"
git push origin "$DEPLOYMENT_TAG"

# Send deployment notification
log "Sending deployment notification..."
# Add your notification logic here (Slack, email, etc.)

log "Deployment completed successfully!"
log "Deployment tag: $DEPLOYMENT_TAG"
log "Log file: $LOG_FILE"

# Summary
echo ""
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo "Date: $(date)"
echo "App: $APP_NAME"
echo "Tag: $DEPLOYMENT_TAG"
echo "Status: SUCCESS"
echo "========================================="
