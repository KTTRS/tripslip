# Logging Infrastructure

## Overview

TripSlip uses a comprehensive logging infrastructure to track rate limits, email delivery, and SMS delivery. This document describes the logging tables, cleanup jobs, and monitoring capabilities.

## Logging Tables

### 1. rate_limits

Tracks API rate limiting to prevent abuse.

**Schema:**
```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:**
- Track API request rates per user/IP
- Enforce rate limits (e.g., 10 SMS per hour)
- Prevent abuse and spam

**Retention:** 1 hour (auto-cleaned)

**Usage Example:**
```typescript
// Check rate limit
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const { data } = await supabase
  .from('rate_limits')
  .select('id')
  .eq('identifier', `sms:${userId}`)
  .gte('created_at', oneHourAgo);

if (data.length >= 10) {
  throw new Error('Rate limit exceeded');
}

// Increment rate limit
await supabase.from('rate_limits').insert({
  identifier: `sms:${userId}`
});
```

### 2. email_logs

Tracks all email delivery attempts for audit and debugging.

**Schema:**
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  attempts INTEGER DEFAULT 1 NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

**Purpose:**
- Audit trail of all email communications
- Track delivery success/failure rates
- Debug email delivery issues
- Monitor retry attempts

**Retention:** 90 days (auto-cleaned)

**Usage Example:**
```typescript
// Log email delivery
await supabase.from('email_logs').insert({
  to_email: 'parent@example.com',
  template_id: 'permission_slip_created',
  status: 'sent',
  attempts: 1,
  sent_at: new Date().toISOString()
});
```

### 3. sms_logs

Tracks all SMS delivery attempts for audit and debugging.

**Schema:**
```sql
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone TEXT NOT NULL,
  message_preview TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  twilio_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

**Purpose:**
- Audit trail of all SMS communications
- Track delivery success/failure rates
- Debug SMS delivery issues
- Link to Twilio message IDs for tracking

**Retention:** 90 days (auto-cleaned)

**Usage Example:**
```typescript
// Log SMS delivery
await supabase.from('sms_logs').insert({
  to_phone: '+15555551234',
  message_preview: 'Permission slip required for...',
  status: 'sent',
  twilio_message_id: 'SM1234567890abcdef',
  sent_at: new Date().toISOString()
});
```

## Cleanup Jobs

### Automatic Cleanup Functions

The logging infrastructure includes automatic cleanup functions to prevent unbounded table growth:

#### cleanup_old_rate_limits()
- **Retention:** 1 hour
- **Frequency:** Hourly (or more frequent for high traffic)
- **Purpose:** Rate limits are only needed for short-term tracking

#### cleanup_old_email_logs()
- **Retention:** 90 days
- **Frequency:** Daily
- **Purpose:** Balance audit requirements with storage costs

#### cleanup_old_sms_logs()
- **Retention:** 90 days
- **Frequency:** Daily
- **Purpose:** Balance audit requirements with storage costs

#### cleanup_all_logs()
- **Purpose:** Master function that runs all cleanup jobs
- **Returns:** Table of results showing rows deleted per table

### Manual Cleanup

To manually run cleanup jobs:

```sql
-- Run all cleanup jobs
SELECT * FROM cleanup_all_logs();

-- Run individual cleanup jobs
SELECT cleanup_old_rate_limits();
SELECT cleanup_old_email_logs();
SELECT cleanup_old_sms_logs();
```

### Scheduled Cleanup

Cleanup jobs are scheduled to run automatically via:

1. **GitHub Actions** (Primary method)
   - Runs daily at 2 AM UTC
   - Calls cleanup-logs Edge Function
   - Logs results as workflow artifacts

2. **Edge Function** (`cleanup-logs`)
   - Endpoint: `/functions/v1/cleanup-logs`
   - Requires service role authentication
   - Returns detailed cleanup results

3. **Alternative: pg_cron** (If available)
   - Database-level scheduling
   - More reliable but requires extension

See `.github/workflows/cleanup-logs.yml` for implementation.

## Monitoring

### Statistics Function

Get comprehensive statistics about logging tables:

```sql
SELECT * FROM get_logging_statistics();
```

**Returns:**
- `table_name`: Name of the logging table
- `total_rows`: Total number of records
- `rows_last_24h`: Records created in last 24 hours
- `rows_last_7d`: Records created in last 7 days
- `oldest_record`: Timestamp of oldest record
- `newest_record`: Timestamp of newest record

### Monitoring Queries

#### Check if cleanup is working
```sql
SELECT 
  table_name,
  total_rows,
  CASE 
    WHEN table_name = 'rate_limits' AND total_rows > 10000 
      THEN 'WARNING: rate_limits not being cleaned'
    WHEN table_name IN ('email_logs', 'sms_logs') AND total_rows > 100000 
      THEN 'WARNING: logs accumulating'
    ELSE 'OK'
  END AS status
FROM get_logging_statistics();
```

#### Check email delivery success rate
```sql
SELECT 
  DATE(sent_at) AS date,
  COUNT(*) AS total_emails,
  COUNT(*) FILTER (WHERE status = 'sent') AS successful,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'sent') / COUNT(*), 2) AS success_rate
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

#### Check SMS delivery success rate
```sql
SELECT 
  DATE(sent_at) AS date,
  COUNT(*) AS total_sms,
  COUNT(*) FILTER (WHERE status = 'sent') AS successful,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'sent') / COUNT(*), 2) AS success_rate
FROM sms_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

#### Check rate limit usage
```sql
SELECT 
  identifier,
  COUNT(*) AS request_count,
  MIN(created_at) AS first_request,
  MAX(created_at) AS last_request
FROM rate_limits
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY identifier
ORDER BY request_count DESC
LIMIT 20;
```

### Alerts

Set up alerts for:

1. **High failure rates**
   - Alert if email/SMS failure rate > 10%
   - Check daily

2. **Cleanup job failures**
   - Alert if cleanup-logs Edge Function fails
   - Check after each scheduled run

3. **Table size warnings**
   - Alert if rate_limits > 10,000 rows
   - Alert if email_logs or sms_logs > 100,000 rows
   - Check daily

4. **Rate limit abuse**
   - Alert if any identifier exceeds rate limit frequently
   - Check hourly

## Performance

### Indexes

The logging infrastructure uses optimized indexes:

```sql
-- Rate limits
CREATE INDEX idx_rate_limits_identifier_created 
  ON rate_limits(identifier, created_at);
CREATE INDEX idx_rate_limits_cleanup 
  ON rate_limits(created_at) 
  WHERE created_at < NOW() - INTERVAL '1 hour';

-- Email logs
CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX idx_email_logs_cleanup 
  ON email_logs(created_at) 
  WHERE created_at < NOW() - INTERVAL '90 days';

-- SMS logs
CREATE INDEX idx_sms_logs_to_phone ON sms_logs(to_phone);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX idx_sms_logs_twilio_message_id 
  ON sms_logs(twilio_message_id) 
  WHERE twilio_message_id IS NOT NULL;
CREATE INDEX idx_sms_logs_cleanup 
  ON sms_logs(created_at) 
  WHERE created_at < NOW() - INTERVAL '90 days';
```

### Storage Estimates

With moderate usage:
- **rate_limits**: ~1,000 records/hour × 24 bytes = 24KB/hour (auto-cleaned)
- **email_logs**: ~100 emails/day × 365 bytes × 90 days = ~3.3MB
- **sms_logs**: ~50 SMS/day × 183 bytes × 90 days = ~823KB

**Total:** ~5MB for 90 days of logs (negligible)

### Query Performance

- Rate limit checks: <5ms (indexed on identifier + created_at)
- Log insertions: <2ms (minimal indexes)
- Cleanup operations: 100-500ms (partial indexes)
- Statistics queries: 50-100ms (aggregations)

## Security

### Row Level Security (RLS)

All logging tables have RLS enabled:

```sql
-- Only service role can access logs
CREATE POLICY "Service role can access logs"
  ON email_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

### Data Privacy

- **Email logs**: Store email addresses but not full message content
- **SMS logs**: Store phone numbers and message preview (first 100 chars)
- **Rate limits**: Store identifiers (user IDs, IP addresses)

### Compliance

- **FERPA**: Logs contain minimal PII, retained for 90 days
- **GDPR**: Users can request log deletion via support
- **Audit trail**: All communications logged for accountability

## Troubleshooting

### High Rate Limit Rejections

**Symptom:** Users reporting "Rate limit exceeded" errors

**Diagnosis:**
```sql
SELECT 
  identifier,
  COUNT(*) AS request_count
FROM rate_limits
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY identifier
HAVING COUNT(*) >= 10
ORDER BY request_count DESC;
```

**Solutions:**
1. Verify user is not abusing the system
2. Consider increasing rate limit for legitimate high-volume users
3. Check if cleanup job is running (old records may be accumulating)

### Email Delivery Failures

**Symptom:** High email failure rate

**Diagnosis:**
```sql
SELECT 
  template_id,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'failed') / COUNT(*), 2) AS failure_rate
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY template_id
ORDER BY failure_rate DESC;
```

**Solutions:**
1. Check SendGrid/Resend API status
2. Verify API keys are valid
3. Review error messages in email_logs
4. Check email template formatting

### SMS Delivery Failures

**Symptom:** High SMS failure rate

**Diagnosis:**
```sql
SELECT 
  error_message,
  COUNT(*) AS occurrences
FROM sms_logs
WHERE status = 'failed'
  AND sent_at > NOW() - INTERVAL '24 hours'
GROUP BY error_message
ORDER BY occurrences DESC;
```

**Solutions:**
1. Check Twilio account status and balance
2. Verify phone numbers are valid
3. Check opt-in status for recipients
4. Review Twilio error codes

### Cleanup Job Not Running

**Symptom:** Logging tables growing too large

**Diagnosis:**
```sql
SELECT * FROM get_logging_statistics();
```

**Solutions:**
1. Check GitHub Actions workflow status
2. Verify cleanup-logs Edge Function is deployed
3. Manually run cleanup: `SELECT * FROM cleanup_all_logs()`
4. Check Edge Function logs for errors

## Related Files

- Migration: `supabase/migrations/20240305000004_create_logging_tables.sql`
- Validation: `supabase/migrations/_archive/validate_20240305000004.md`
- Test Script: `supabase/migrations/_archive/test_20240305000004.sql`
- Edge Function: `supabase/functions/cleanup-logs/`
- Workflow: `.github/workflows/cleanup-logs.yml`
- Email Function: `supabase/functions/send-email/index.ts`
- SMS Function: `supabase/functions/send-sms/index.ts`

## Maintenance

### Daily Tasks
- Review cleanup job execution logs
- Check for high failure rates

### Weekly Tasks
- Review logging statistics
- Verify cleanup is working properly
- Check for rate limit abuse

### Monthly Tasks
- Review retention policies
- Analyze trends in email/SMS delivery
- Optimize indexes if needed

### Quarterly Tasks
- Review and update alert thresholds
- Audit logging infrastructure performance
- Consider adjusting retention periods based on usage
