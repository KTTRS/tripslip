# TripSlip Operations Runbook

**Version:** 1.0  
**Last Updated:** March 4, 2026  
**On-Call:** DevOps Team

## Emergency Contacts

### Primary Contacts
- **DevOps Lead:** devops@tripslip.com
- **Backend Engineer:** backend@tripslip.com
- **CTO:** cto@tripslip.com
- **Support:** support@tripslip.com

### Escalation Path
1. On-call DevOps Engineer
2. Backend Engineer
3. CTO
4. CEO (critical incidents only)

## System Architecture

### Components
- **Frontend Apps:** 5 React applications on Cloudflare Pages
- **Database:** Supabase PostgreSQL
- **Edge Functions:** Supabase Edge Functions (Deno)
- **Storage:** Supabase Storage
- **Payments:** Stripe
- **Email:** SendGrid/Resend
- **SMS:** Twilio
- **Monitoring:** Sentry

### Dependencies
- Supabase (critical)
- Stripe (critical for payments)
- Email provider (high priority)
- SMS provider (medium priority)

## Common Incidents

### 1. Application Down

**Symptoms:**
- Users cannot access application
- 502/503 errors
- Timeout errors

**Diagnosis:**
```bash
# Check application status
curl -I https://tripslip.com
curl -I https://venue.tripslip.com
curl -I https://teacher.tripslip.com

# Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# Check error logs
# View in Sentry dashboard
```

**Resolution:**
1. Check hosting provider status
2. Verify DNS configuration
3. Check SSL certificates
4. Review recent deployments
5. Rollback if necessary
6. Clear CDN cache if needed

**Rollback Procedure:**
```bash
# Cloudflare Pages
wrangler pages deployment list
wrangler pages deployment rollback <deployment-id>

# Or redeploy previous version
git checkout <previous-tag>
npm run build
npm run deploy
```

### 2. Database Connection Issues

**Symptoms:**
- "Connection pool exhausted" errors
- Slow query performance
- Timeout errors

**Diagnosis:**
```bash
# Check connection count
psql -h <host> -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql -h <host> -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check database size
psql -h <host> -U postgres -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

**Resolution:**
1. Increase connection pool size
2. Kill long-running queries
3. Optimize slow queries
4. Add missing indexes
5. Scale database if needed

**Kill Long-Running Query:**
```sql
-- Find long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;

-- Kill specific query
SELECT pg_terminate_backend(pid);
```

### 3. Payment Processing Failures

**Symptoms:**
- Payment intent creation fails
- Webhook not received
- Payment status not updating

**Diagnosis:**
```bash
# Check Stripe status
curl https://status.stripe.com/api/v2/status.json

# Check webhook logs in Stripe Dashboard
# View Edge Function logs in Supabase

# Test webhook endpoint
curl -X POST https://<project>.supabase.co/functions/v1/stripe-webhook \
  -H "stripe-signature: test" \
  -d '{"type":"payment_intent.succeeded"}'
```

**Resolution:**
1. Verify Stripe API keys
2. Check webhook endpoint configuration
3. Verify webhook signature validation
4. Manually update payment status if needed
5. Retry failed webhooks

**Manual Payment Status Update:**
```sql
-- Update payment status
UPDATE payments 
SET status = 'succeeded', 
    updated_at = now() 
WHERE stripe_payment_intent_id = 'pi_xxx';

-- Update permission slip status
UPDATE permission_slips 
SET payment_status = 'paid', 
    updated_at = now() 
WHERE id = 'slip-uuid';
```

### 4. Email Delivery Failures

**Symptoms:**
- Emails not being received
- High bounce rate
- Email provider errors

**Diagnosis:**
```bash
# Check email provider status
# SendGrid: https://status.sendgrid.com
# Resend: https://resend.com/status

# Check Edge Function logs
# View in Supabase Dashboard

# Test email sending
curl -X POST https://<project>.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","template":"test"}'
```

**Resolution:**
1. Verify email provider API key
2. Check email provider limits
3. Review bounce/complaint rates
4. Verify sender domain authentication
5. Retry failed emails

**Retry Failed Emails:**
```sql
-- Find failed emails
SELECT * FROM email_logs 
WHERE status = 'failed' 
AND created_at > now() - interval '24 hours';

-- Mark for retry
UPDATE email_logs 
SET status = 'pending', retry_count = retry_count + 1 
WHERE id IN (SELECT id FROM failed_emails);
```

### 5. High Error Rate

**Symptoms:**
- Spike in error logs
- User reports of issues
- Sentry alerts

**Diagnosis:**
1. Check Sentry dashboard for error patterns
2. Review recent deployments
3. Check for infrastructure issues
4. Analyze error stack traces

**Resolution:**
1. Identify root cause from error logs
2. Rollback if caused by recent deployment
3. Apply hotfix if needed
4. Monitor error rate after fix

### 6. Performance Degradation

**Symptoms:**
- Slow page loads
- High response times
- User complaints

**Diagnosis:**
```bash
# Check Lighthouse scores
lighthouse https://tripslip.com --output=json

# Check database performance
psql -h <host> -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check CDN cache hit rate
# View in CDN dashboard
```

**Resolution:**
1. Identify slow queries and optimize
2. Clear and warm CDN cache
3. Check for missing indexes
4. Review recent code changes
5. Scale resources if needed

## Monitoring and Alerts

### Key Metrics

**Application Metrics:**
- Response time (p50, p95, p99)
- Error rate
- Request rate
- Active users

**Database Metrics:**
- Connection count
- Query performance
- Disk usage
- Replication lag

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Network traffic
- Disk I/O

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | > 2% | > 5% |
| Response Time (p95) | > 1s | > 2s |
| Database Connections | > 80% | > 90% |
| Memory Usage | > 80% | > 90% |
| Disk Usage | > 80% | > 90% |

## Maintenance Procedures

### Scheduled Maintenance

**Frequency:** Monthly  
**Window:** Sunday 2:00 AM - 4:00 AM EST  
**Notification:** 7 days advance notice

**Procedure:**
1. Announce maintenance window
2. Create database backup
3. Apply updates/patches
4. Run database maintenance
5. Test all critical functions
6. Monitor for issues
7. Announce completion

### Database Maintenance

```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE postgres;

-- Update statistics
ANALYZE;

-- Check for bloat
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
LIMIT 10;
```

### Backup Verification

```bash
# Create backup
supabase db dump -f backup-$(date +%Y%m%d).sql

# Verify backup
pg_restore --list backup-$(date +%Y%m%d).sql

# Test restore (on test database)
psql -h test-db -U postgres -f backup-$(date +%Y%m%d).sql
```

## Security Incidents

### Suspected Breach

**Immediate Actions:**
1. Isolate affected systems
2. Preserve logs and evidence
3. Notify security team
4. Assess scope of breach
5. Notify affected users if required

**Investigation:**
1. Review access logs
2. Check for unauthorized access
3. Identify compromised accounts
4. Determine data exposure
5. Document findings

**Remediation:**
1. Patch vulnerabilities
2. Rotate all credentials
3. Reset affected user passwords
4. Implement additional controls
5. Monitor for further activity

### DDoS Attack

**Detection:**
- Sudden spike in traffic
- Slow response times
- Legitimate users unable to access

**Response:**
1. Enable DDoS protection
2. Block malicious IPs
3. Scale infrastructure
4. Contact hosting provider
5. Monitor attack patterns

## Disaster Recovery

### Database Recovery

**Scenario:** Database corruption or data loss

**Procedure:**
```bash
# 1. Stop all applications
# 2. Restore from backup
supabase db restore backup-YYYYMMDD.sql

# 3. Verify data integrity
psql -h <host> -U postgres -c "SELECT count(*) FROM users;"

# 4. Apply any missing migrations
supabase db push

# 5. Restart applications
# 6. Monitor for issues
```

**RTO:** 2 hours  
**RPO:** 24 hours (daily backups)

### Complete System Failure

**Scenario:** All systems down

**Procedure:**
1. Assess scope of failure
2. Notify stakeholders
3. Restore from backups
4. Rebuild infrastructure if needed
5. Restore applications
6. Verify all systems operational
7. Post-mortem analysis

**RTO:** 4 hours  
**RPO:** 24 hours

## Post-Incident Procedures

### Incident Report

Document:
- Incident timeline
- Root cause analysis
- Impact assessment
- Resolution steps
- Lessons learned
- Action items

### Post-Mortem

Schedule within 48 hours:
- Review incident timeline
- Identify contributing factors
- Discuss what went well
- Identify improvements
- Assign action items
- Update runbook

## Useful Commands

### Database

```bash
# Connect to database
psql -h <host> -U postgres

# Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill all connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'postgres';
```

### Logs

```bash
# View Edge Function logs
supabase functions logs <function-name>

# View real-time logs
supabase functions logs <function-name> --follow

# Filter logs
supabase functions logs <function-name> --filter "error"
```

### Deployment

```bash
# Deploy specific app
npm run deploy:<app-name>

# Rollback deployment
git checkout <previous-tag>
npm run build
npm run deploy

# Check deployment status
curl -I https://<app>.tripslip.com
```

## Resources

- **Status Page:** status.tripslip.com
- **Documentation:** docs.tripslip.com
- **Monitoring:** sentry.io
- **Supabase Dashboard:** supabase.com/dashboard
- **Stripe Dashboard:** dashboard.stripe.com

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-04 | Initial runbook |
