# Authentication and RBAC Rollback Procedure

## Overview

This document provides step-by-step instructions for safely rolling back the authentication and role-based access control (RBAC) feature if needed.

## ⚠️ WARNING

**Rolling back this feature will:**
- Remove all user role assignments
- Remove all RLS policies
- Remove audit logs
- Remove districts and school-district relationships
- Disable database-level security enforcement
- **Users will lose access to the platform until authentication is restored**

**Only proceed if:**
- You have a critical bug that requires immediate rollback
- You have a backup of all data
- You have a plan to restore authentication functionality
- You have communicated the downtime to users

## Prerequisites

Before starting the rollback:

1. **Backup Database**
   ```bash
   # Create full database backup
   supabase db dump -f backup-before-rollback-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Notify Users**
   - Inform all users of planned downtime
   - Provide estimated restoration time
   - Explain what functionality will be affected

3. **Document Current State**
   ```bash
   # Export current role assignments
   psql $DATABASE_URL -c "COPY (SELECT * FROM user_role_assignments) TO STDOUT CSV HEADER" > role_assignments_backup.csv
   
   # Export active role contexts
   psql $DATABASE_URL -c "COPY (SELECT * FROM active_role_context) TO STDOUT CSV HEADER" > active_roles_backup.csv
   
   # Export audit logs
   psql $DATABASE_URL -c "COPY (SELECT * FROM audit_logs) TO STDOUT CSV HEADER" > audit_logs_backup.csv
   ```

4. **Verify Backup**
   ```bash
   # Verify backup file exists and is not empty
   ls -lh backup-before-rollback-*.sql
   ```

## Rollback Steps

### Step 1: Prepare Environment

1. **Set Database Connection**
   ```bash
   # For local development
   export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   
   # For production (use with extreme caution!)
   export DATABASE_URL="your-production-database-url"
   ```

2. **Verify Connection**
   ```bash
   psql $DATABASE_URL -c "SELECT current_database(), current_user;"
   ```

### Step 2: Execute Rollback Script

1. **Review Rollback Script**
   ```bash
   # Review the script before executing
   cat scripts/rollback-auth-migrations.sql
   ```

2. **Execute in Transaction Mode**
   ```bash
   # Execute the rollback script
   psql $DATABASE_URL -f scripts/rollback-auth-migrations.sql
   ```

3. **Review Output**
   - Check for any error messages
   - Verify all verification checks passed
   - Review the summary at the end

4. **Commit or Rollback**
   
   If everything looks correct:
   ```sql
   -- In the same psql session
   COMMIT;
   ```
   
   If there are issues:
   ```sql
   -- In the same psql session
   ROLLBACK;
   ```

### Step 3: Verify Rollback

1. **Verify Tables Dropped**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN (
       'user_roles', 
       'user_role_assignments', 
       'active_role_context', 
       'districts', 
       'school_districts', 
       'audit_logs'
     );
   -- Should return 0 rows
   ```

2. **Verify RLS Disabled**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND rowsecurity = true;
   -- Should return 0 rows (or only tables that had RLS before this feature)
   ```

3. **Verify Functions Dropped**
   ```sql
   SELECT proname 
   FROM pg_proc 
   WHERE proname IN ('user_role', 'user_organization_id', 'user_organization_type', 'has_role', 'is_tripslip_admin')
     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');
   -- Should return 0 rows
   ```

4. **Verify Columns Removed**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'venues' 
     AND column_name IN ('claimed', 'claimed_by', 'claimed_at');
   -- Should return 0 rows
   ```

### Step 4: Update Application Code

After database rollback, you must update the application code:

1. **Remove Auth Package Usage**
   ```bash
   # Find all files using the auth package
   grep -r "from '@tripslip/auth'" apps/
   ```

2. **Remove Protected Routes**
   - Remove `<ProtectedRoute>` wrappers
   - Remove `<RoleGuard>` components
   - Remove `<EmailVerificationGuard>` components

3. **Remove Auth Context**
   - Remove `<AuthProvider>` from app roots
   - Remove `useAuth()` hook usage

4. **Restore Previous Authentication**
   - Implement temporary authentication solution
   - Or restore previous authentication code from git history

### Step 5: Deploy Application Changes

1. **Build Applications**
   ```bash
   npm run build
   ```

2. **Test Locally**
   ```bash
   npm run dev
   # Verify apps load without errors
   ```

3. **Deploy to Production**
   ```bash
   # Deploy each app
   npm run deploy --filter=@tripslip/teacher
   npm run deploy --filter=@tripslip/school
   npm run deploy --filter=@tripslip/venue
   ```

### Step 6: Verify System Functionality

1. **Test Basic Access**
   - Verify apps load
   - Verify no authentication errors
   - Verify data is accessible

2. **Test User Flows**
   - Test critical user workflows
   - Verify no broken functionality
   - Check for console errors

3. **Monitor Logs**
   ```bash
   # Monitor application logs
   supabase functions logs
   
   # Monitor database logs
   supabase db logs
   ```

## Partial Rollback Options

If you only need to rollback specific components:

### Rollback RLS Policies Only

```sql
-- Disable RLS but keep tables
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ... etc for all tables

-- Drop policies
DROP POLICY IF EXISTS "trips_select_policy" ON trips;
-- ... etc for all policies
```

### Rollback Audit Logging Only

```sql
-- Drop audit logs table
DROP TABLE IF EXISTS audit_logs CASCADE;
```

### Rollback Districts Only

```sql
-- Drop district-related tables
DROP TABLE IF EXISTS school_districts CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
```

## Restoration Procedure

If you need to restore the authentication feature after rollback:

### Option 1: Re-run Migrations

```bash
# Re-apply the migrations
supabase db push
```

### Option 2: Restore from Backup

```bash
# Restore the full database backup
psql $DATABASE_URL < backup-before-rollback-YYYYMMDD-HHMMSS.sql
```

### Option 3: Restore Data Only

```sql
-- Restore role assignments
COPY user_role_assignments FROM '/path/to/role_assignments_backup.csv' CSV HEADER;

-- Restore active role contexts
COPY active_role_context FROM '/path/to/active_roles_backup.csv' CSV HEADER;

-- Restore audit logs
COPY audit_logs FROM '/path/to/audit_logs_backup.csv' CSV HEADER;
```

## Troubleshooting

### Issue: Foreign Key Constraint Errors

**Symptom**: Cannot drop tables due to foreign key constraints

**Solution**:
```sql
-- Drop tables with CASCADE
DROP TABLE user_role_assignments CASCADE;
DROP TABLE user_roles CASCADE;
```

### Issue: RLS Policies Won't Drop

**Symptom**: "policy does not exist" errors

**Solution**:
```sql
-- List all policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Drop each policy individually
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Issue: Functions Won't Drop

**Symptom**: "function does not exist" errors

**Solution**:
```sql
-- List all functions in auth schema
SELECT proname, pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');

-- Drop with full signature
DROP FUNCTION IF EXISTS auth.function_name(argument_types);
```

### Issue: Application Errors After Rollback

**Symptom**: Apps crash or show authentication errors

**Solution**:
1. Clear browser cache and cookies
2. Restart application servers
3. Check for remaining auth package imports
4. Verify environment variables are correct

### Issue: Data Access Errors

**Symptom**: Users cannot access data after rollback

**Solution**:
1. Verify RLS is disabled on all tables
2. Check for remaining RLS policies
3. Verify application code is updated
4. Check database connection permissions

## Emergency Rollback

If you need to rollback immediately without following all steps:

```bash
# Quick rollback (use with caution!)
psql $DATABASE_URL << 'EOF'
BEGIN;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS active_role_context CASCADE;
DROP TABLE IF EXISTS user_role_assignments CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS school_districts CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
COMMIT;
EOF
```

## Post-Rollback Checklist

- [ ] Database backup created
- [ ] Rollback script executed successfully
- [ ] All RBAC tables dropped
- [ ] RLS disabled on all tables
- [ ] Helper functions removed
- [ ] Application code updated
- [ ] Applications deployed
- [ ] System functionality verified
- [ ] Users notified of restoration
- [ ] Incident documented
- [ ] Post-mortem scheduled

## Support

If you encounter issues during rollback:

1. **Stop immediately** - Don't proceed if errors occur
2. **Restore from backup** - Use the database backup created in prerequisites
3. **Contact support** - Reach out to the development team
4. **Document the issue** - Record all error messages and steps taken

## Related Documentation

- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [RLS Security Model](./RLS_SECURITY_MODEL.md)
- [Database Setup](./DATABASE_README.md)
