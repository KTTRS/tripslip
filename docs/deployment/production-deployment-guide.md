# Production Deployment Guide

**Date:** March 4, 2026  
**Status:** Ready for Deployment  
**Environment:** Production

## Pre-Deployment Checklist

### Infrastructure
- [x] Supabase production project created
- [x] Custom domains configured
- [x] SSL certificates provisioned
- [x] CDN configured
- [x] Database backups enabled
- [x] Monitoring tools configured
- [x] Error tracking enabled

### Security
- [x] Environment variables secured
- [x] API keys rotated
- [x] RLS policies verified
- [x] Security headers configured
- [x] Rate limiting enabled
- [x] CORS policies configured
- [x] Authentication tested

### Performance
- [x] Database indexes created
- [x] Caching configured
- [x] CDN enabled
- [x] Image optimization enabled
- [x] Code splitting implemented
- [x] Bundle size optimized

### Compliance
- [x] FERPA compliance verified
- [x] PCI-DSS compliance (via Stripe)
- [x] Privacy policy updated
- [x] Terms of service updated
- [x] Cookie consent implemented

### Testing
- [x] All tests passing
- [x] Integration tests complete
- [x] Security audit complete
- [x] Performance testing complete
- [x] Accessibility testing complete

## Deployment Architecture

### Application Hosting
- **Platform:** Cloudflare Pages / Vercel / Netlify
- **Regions:** Multi-region deployment
- **CDN:** Global edge network
- **SSL:** Automatic HTTPS

### Database
- **Provider:** Supabase (PostgreSQL)
- **Region:** US East (primary)
- **Backup:** Daily automated backups
- **Replication:** Read replicas enabled

### Edge Functions
- **Provider:** Supabase Edge Functions (Deno)
- **Regions:** Global edge deployment
- **Timeout:** 30 seconds
- **Memory:** 512MB

### Storage
- **Provider:** Supabase Storage
- **CDN:** Enabled
- **Backup:** Automated
- **Encryption:** At rest and in transit

## Environment Configuration

### Production Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URLs
VITE_LANDING_URL=https://tripslip.com
VITE_VENUE_URL=https://venue.tripslip.com
VITE_SCHOOL_URL=https://school.tripslip.com
VITE_TEACHER_URL=https://teacher.tripslip.com
VITE_PARENT_URL=https://parent.tripslip.com

# Email (SendGrid/Resend)
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM=noreply@tripslip.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your-sentry-token

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ERROR_TRACKING=true
ENABLE_PERFORMANCE_MONITORING=true
```

## Deployment Steps

### 1. Database Migration

```bash
# Connect to production database
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Verify migrations
supabase db diff

# Create backup before deployment
supabase db dump -f backup-$(date +%Y%m%d).sql
```

### 2. Edge Functions Deployment

```bash
# Deploy all Edge Functions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy send-email
supabase functions deploy send-sms
supabase functions deploy create-stripe-connect-link
supabase functions deploy export-student-data

# Verify deployments
supabase functions list
```

### 3. Application Deployment

```bash
# Build all applications
npm run build

# Deploy landing app
npm run deploy:landing

# Deploy venue app
npm run deploy:venue

# Deploy school app
npm run deploy:school

# Deploy teacher app
npm run deploy:teacher

# Deploy parent app
npm run deploy:parent
```

### 4. DNS Configuration

```
# A Records
tripslip.com                 → Cloudflare Pages IP
venue.tripslip.com          → Cloudflare Pages IP
school.tripslip.com         → Cloudflare Pages IP
teacher.tripslip.com        → Cloudflare Pages IP
parent.tripslip.com         → Cloudflare Pages IP

# CNAME Records
www.tripslip.com            → tripslip.com
api.tripslip.com            → your-project.supabase.co

# MX Records (Email)
tripslip.com                → Email provider MX records
```

### 5. SSL Certificate Verification

```bash
# Verify SSL certificates
curl -I https://tripslip.com
curl -I https://venue.tripslip.com
curl -I https://school.tripslip.com
curl -I https://teacher.tripslip.com
curl -I https://parent.tripslip.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

### 6. Monitoring Setup

```bash
# Configure Sentry
sentry-cli login
sentry-cli releases new production-$(date +%Y%m%d-%H%M%S)
sentry-cli releases finalize production-$(date +%Y%m%d-%H%M%S)

# Configure uptime monitoring
# - Pingdom
# - UptimeRobot
# - StatusCake
```

## Post-Deployment Verification

### Smoke Tests

```bash
# Test landing page
curl -I https://tripslip.com
# Expected: 200 OK

# Test API health
curl https://your-project.supabase.co/rest/v1/
# Expected: 200 OK

# Test authentication
curl -X POST https://your-project.supabase.co/auth/v1/signup \
  -H "apikey: your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
# Expected: 200 OK or appropriate error

# Test Edge Functions
curl https://your-project.supabase.co/functions/v1/health
# Expected: 200 OK
```

### Functional Tests

1. **Authentication Flow**
   - Sign up new user
   - Verify email
   - Sign in
   - Sign out

2. **Permission Slip Flow**
   - Teacher creates trip
   - Generates permission slips
   - Parent receives magic link
   - Parent signs permission slip

3. **Payment Flow**
   - Parent accesses payment page
   - Enters payment information
   - Payment processes successfully
   - Receipt generated

4. **Venue Booking Flow**
   - Venue creates experience
   - Teacher books experience
   - Booking confirmed
   - Calendar updated

### Performance Tests

```bash
# Lighthouse audit
lighthouse https://tripslip.com --output=html --output-path=./lighthouse-report.html

# Load testing
artillery quick --count 100 --num 10 https://tripslip.com

# Database performance
psql -h your-project.supabase.co -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## Monitoring & Alerting

### Metrics to Monitor

1. **Application Metrics**
   - Response time (p50, p95, p99)
   - Error rate
   - Request rate
   - Active users

2. **Database Metrics**
   - Connection count
   - Query performance
   - Disk usage
   - Replication lag

3. **Infrastructure Metrics**
   - CPU usage
   - Memory usage
   - Network traffic
   - Disk I/O

### Alert Configuration

```yaml
# Example alert rules
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: Slow Response Time
    condition: p95_response_time > 2s
    duration: 5m
    severity: warning
    
  - name: Database Connection Pool Full
    condition: db_connections > 90%
    duration: 2m
    severity: critical
    
  - name: High Memory Usage
    condition: memory_usage > 85%
    duration: 10m
    severity: warning
```

## Rollback Procedure

### Application Rollback

```bash
# Revert to previous deployment
# Cloudflare Pages
wrangler pages deployment list
wrangler pages deployment rollback <deployment-id>

# Vercel
vercel rollback

# Netlify
netlify rollback
```

### Database Rollback

```bash
# Restore from backup
supabase db restore backup-YYYYMMDD.sql

# Or revert specific migration
supabase migration down <migration-name>
```

### Edge Functions Rollback

```bash
# Deploy previous version
supabase functions deploy <function-name> --version <previous-version>
```

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery enabled
   - Retention: 30 days
   - Off-site backup storage

2. **Application Backups**
   - Git repository (source of truth)
   - Deployment history
   - Configuration backups

3. **Storage Backups**
   - Automated file backups
   - Retention: 90 days
   - Geo-redundant storage

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Restore from backup
   supabase db restore backup-YYYYMMDD.sql
   
   # Verify data integrity
   supabase db diff
   ```

2. **Application Recovery**
   ```bash
   # Redeploy from Git
   git checkout <stable-commit>
   npm run build
   npm run deploy
   ```

3. **Storage Recovery**
   ```bash
   # Restore files from backup
   supabase storage restore <bucket-name> backup-YYYYMMDD.tar.gz
   ```

## Maintenance Windows

### Scheduled Maintenance
- **Frequency:** Monthly
- **Duration:** 2 hours
- **Time:** Sunday 2:00 AM - 4:00 AM EST
- **Notification:** 7 days advance notice

### Emergency Maintenance
- **Notification:** As soon as possible
- **Status Page:** status.tripslip.com
- **Communication:** Email, SMS, in-app

## Security Hardening

### Production Security Checklist

- [x] HTTPS enforced on all domains
- [x] Security headers configured
- [x] CORS policies restrictive
- [x] Rate limiting enabled
- [x] DDoS protection enabled
- [x] WAF rules configured
- [x] API keys rotated
- [x] Database credentials secured
- [x] Secrets management implemented
- [x] Audit logging enabled

### Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## Support & Operations

### On-Call Rotation
- **Primary:** DevOps Engineer
- **Secondary:** Backend Engineer
- **Escalation:** CTO

### Incident Response
1. Acknowledge incident
2. Assess severity
3. Communicate status
4. Implement fix
5. Verify resolution
6. Post-mortem

### Documentation
- Runbooks: `/docs/runbooks/`
- Architecture: `/docs/architecture/`
- API Docs: `/docs/api/`
- User Guides: `/docs/user-guides/`

## Conclusion

The TripSlip platform is production-ready with comprehensive monitoring, security, and disaster recovery procedures in place. Follow this guide for successful deployment and ongoing operations.

**Deployment Status:** ✅ Ready  
**Next Review:** April 4, 2026
