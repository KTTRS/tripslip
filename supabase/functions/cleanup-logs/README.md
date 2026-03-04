# Cleanup Logs Edge Function

## Overview

This Edge Function runs cleanup jobs for logging tables (rate_limits, email_logs, sms_logs) by calling the `cleanup_all_logs()` database function.

## Purpose

- Automatically delete old rate limit records (>1 hour old)
- Automatically delete old email logs (>90 days old)
- Automatically delete old SMS logs (>90 days old)
- Prevent unbounded growth of logging tables
- Maintain optimal database performance

## Usage

### Manual Invocation

```bash
# Using curl
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-logs

# Using Supabase CLI
supabase functions invoke cleanup-logs \
  --env-file .env.local
```

### Response Format

```json
{
  "success": true,
  "timestamp": "2024-03-05T10:30:00.000Z",
  "results": [
    {
      "table_name": "rate_limits",
      "rows_deleted": 1234
    },
    {
      "table_name": "email_logs",
      "rows_deleted": 56
    },
    {
      "table_name": "sms_logs",
      "rows_deleted": 23
    }
  ],
  "totalDeleted": 1313,
  "message": "Successfully deleted 1313 old log records"
}
```

## Scheduling

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/cleanup-logs.yml`:

```yaml
name: Cleanup Logs Daily

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup logs
        run: |
          response=$(curl -s -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/cleanup-logs)
          
          echo "Cleanup response: $response"
          
          # Check if cleanup was successful
          if echo "$response" | grep -q '"success":true'; then
            echo "✅ Cleanup completed successfully"
          else
            echo "❌ Cleanup failed"
            exit 1
          fi
```

**Required Secrets:**
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SUPABASE_PROJECT_REF` - Your Supabase project reference

### Option 2: External Cron Service

Use services like:
- **Cron-job.org**: Free cron job service
- **EasyCron**: Scheduled HTTP requests
- **AWS EventBridge**: Scheduled Lambda function
- **GCP Cloud Scheduler**: Scheduled Cloud Function

Configure to call:
```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-logs
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

### Option 3: pg_cron (If Available)

If your Supabase project has pg_cron enabled:

```sql
-- Schedule daily cleanup at 2 AM
SELECT cron.schedule(
  'cleanup-logs-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-logs',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

## Security

### Authentication

This function requires authentication via:
- Service role key (recommended for scheduled jobs)
- Valid API key with appropriate permissions

### Authorization

Only service role or authenticated admin users should be able to call this function.

## Monitoring

### Success Monitoring

Monitor the function's execution:

```bash
# View function logs
supabase functions logs cleanup-logs

# Check recent invocations
supabase functions list
```

### Alerting

Set up alerts for:
1. **Function failures**: Alert if cleanup returns `success: false`
2. **High deletion counts**: Alert if `totalDeleted` exceeds expected threshold
3. **No executions**: Alert if function hasn't run in 25+ hours

### Example Alert Query

```sql
-- Check if cleanup is running (query daily)
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

## Testing

### Local Testing

```bash
# Start Supabase locally
supabase start

# Deploy function locally
supabase functions serve cleanup-logs --env-file .env.local

# Test the function
curl -X POST http://localhost:54321/functions/v1/cleanup-logs \
  -H "Authorization: Bearer YOUR_LOCAL_SERVICE_ROLE_KEY"
```

### Staging Testing

```bash
# Deploy to staging
supabase functions deploy cleanup-logs --project-ref YOUR_STAGING_REF

# Test in staging
curl -X POST https://YOUR_STAGING_REF.supabase.co/functions/v1/cleanup-logs \
  -H "Authorization: Bearer YOUR_STAGING_SERVICE_ROLE_KEY"
```

## Troubleshooting

### Function Returns 401 Unauthorized

**Cause:** Missing or invalid authorization header

**Solution:** Ensure you're passing the service role key:
```bash
-H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Function Returns 500 Error

**Cause:** Database function error or connection issue

**Solution:** 
1. Check function logs: `supabase functions logs cleanup-logs`
2. Verify database function exists: `SELECT * FROM pg_proc WHERE proname = 'cleanup_all_logs'`
3. Test database function directly: `SELECT * FROM cleanup_all_logs()`

### No Rows Deleted

**Cause:** No old records to delete (normal if recently cleaned)

**Solution:** This is expected behavior. The function will return `rows_deleted: 0` for each table.

### High Deletion Counts

**Cause:** Cleanup hasn't run in a while, or high traffic

**Solution:** 
1. Verify cleanup schedule is working
2. Consider increasing cleanup frequency for high-traffic periods
3. Review logging statistics: `SELECT * FROM get_logging_statistics()`

## Performance

### Execution Time

- Typical execution: 100-500ms
- With large deletions: 1-3 seconds
- Timeout: 60 seconds (Supabase default)

### Resource Usage

- Minimal CPU usage
- Memory: <10MB
- Database connections: 1

### Optimization

The cleanup functions use partial indexes for optimal performance:
- `idx_rate_limits_cleanup`
- `idx_email_logs_cleanup`
- `idx_sms_logs_cleanup`

## Related Files

- Migration: `supabase/migrations/20240305000004_create_logging_tables.sql`
- Validation: `supabase/migrations/validate_20240305000004.md`
- Database Functions: `cleanup_all_logs()`, `cleanup_old_rate_limits()`, etc.

## Maintenance

### Regular Tasks

1. **Weekly**: Review cleanup logs for anomalies
2. **Monthly**: Verify cleanup schedule is running
3. **Quarterly**: Review retention policies (90 days for logs, 1 hour for rate limits)

### Updating Retention Periods

To change retention periods, update the database functions:

```sql
-- Example: Change email logs retention to 30 days
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_logs
  WHERE created_at < NOW() - INTERVAL '30 days'; -- Changed from 90 days
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## Support

For issues or questions:
1. Check function logs: `supabase functions logs cleanup-logs`
2. Review database logs in Supabase Dashboard
3. Test database function directly: `SELECT * FROM cleanup_all_logs()`
4. Contact DevOps team if persistent issues occur
