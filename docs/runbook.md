# TripSlip Operations Runbook

## Emergency Contacts

- On-Call Engineer: oncall@tripslip.com
- Technical Lead: tech@tripslip.com
- DevOps: devops@tripslip.com

## Common Issues

### App is Down

1. Check Vercel status: status.vercel.com
2. Check Supabase status: status.supabase.com
3. Review recent deployments in Vercel dashboard
4. Check Sentry for errors
5. If needed, rollback to previous deployment

### Database Connection Issues

1. Check Supabase dashboard for connection pool usage
2. Verify environment variables are correct
3. Check for long-running queries
4. Restart connection pool if needed

### Payment Processing Failures

1. Check Stripe dashboard for webhook delivery
2. Verify webhook signature validation
3. Check Edge Function logs
4. Manually retry failed webhooks if needed

### Email/SMS Not Sending

1. Check Edge Function logs
2. Verify API keys are correct
3. Check rate limits
4. Review email/SMS service status

## Monitoring Dashboards

- Vercel: vercel.com/dashboard
- Supabase: app.supabase.com
- Sentry: sentry.io/organizations/tripslip
- Stripe: dashboard.stripe.com

## Deployment Process

### Standard Deployment
1. Merge PR to main branch
2. GitHub Actions runs tests
3. Auto-deploy to staging
4. Run smoke tests
5. Manual approval for production
6. Deploy to production

### Hotfix Deployment
1. Create hotfix branch from main
2. Make minimal changes
3. Fast-track review
4. Deploy directly to production
5. Monitor closely

## Rollback Procedure

1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"
4. Verify rollback successful
5. Investigate and fix issue
6. Redeploy when ready

## Database Maintenance

### Backup Verification
```bash
# Test restore process monthly
supabase db dump > backup.sql
supabase db reset
supabase db restore backup.sql
```

### Performance Tuning
```sql
-- Find slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Security Incidents

1. Immediately notify security@tripslip.com
2. Review audit logs for suspicious activity
3. Rotate compromised credentials
4. Document incident
5. Implement fixes
6. Notify affected users if required

## Scaling

### Horizontal Scaling
- Vercel auto-scales based on traffic
- No manual intervention needed

### Database Scaling
1. Monitor connection pool usage
2. Increase pool size if needed
3. Consider read replicas for heavy read workloads
4. Upgrade Supabase plan if needed

## Maintenance Windows

- Scheduled: Sundays 2-4 AM EST
- Notify users 48 hours in advance
- Post status updates during maintenance
