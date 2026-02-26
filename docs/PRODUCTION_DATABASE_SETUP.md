# TripSlip Production Database Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the TripSlip production database on Supabase. The setup includes creating a production project, executing 16 database migrations, configuring Row-Level Security (RLS) policies, setting up storage buckets, and configuring automated backups.

**⚠️ IMPORTANT**: This guide is for production database setup. Ensure you have proper credentials and authorization before proceeding.

## Prerequisites

Before starting, ensure you have:

- [ ] Supabase account with production access
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Access to TripSlip organization on Supabase
- [ ] Production environment variables ready
- [ ] Backup of any existing data (if applicable)

## Phase 1: Create Production Supabase Project

### Step 1.1: Create New Project

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Configure project settings:
   - **Organization**: TripSlip
   - **Project Name**: `tripslip-production`
   - **Database Password**: Generate strong password (save securely)
   - **Region**: Choose closest to primary users (e.g., `us-east-1`)
   - **Pricing Plan**: Pro or higher (for production features)

4. Wait for project provisioning (2-3 minutes)

### Step 1.2: Note Project Credentials

Once created, save these credentials securely:

```bash
# Project Reference ID
PROJECT_REF=<your-project-ref>

# API URL
SUPABASE_URL=https://<project-ref>.supabase.co

# Anon/Public Key
SUPABASE_ANON_KEY=<your-anon-key>

# Service Role Key (KEEP SECRET)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 1.3: Link CLI to Production Project

```bash
# Login to Supabase CLI
supabase login

# Link to production project
supabase link --project-ref <PROJECT_REF>

# Verify connection
supabase projects list
```

## Phase 2: Execute Database Migrations

### Step 2.1: Verify Migration Files

Ensure all 16 migration files exist in `supabase/migrations/`:

```bash
ls -la supabase/migrations/
```

Expected files:
1. `00001_initial.sql` - Initial schema setup
2. `00002_add_indemnification.sql` - Indemnification fields
3. `20240101000000_create_core_entities.sql` - Core tables (venues, schools, teachers, students, parents)
4. `20240101000001_create_trips_and_slips.sql` - Trips and permission slips
5. `20240101000002_create_payments_and_refunds.sql` - Payment processing tables
6. `20240101000003_create_supporting_tables.sql` - Supporting tables (documents, attendance, chaperones)
7. `20240101000004_rls_venue_policies.sql` - Venue RLS policies
8. `20240101000005_rls_trip_policies.sql` - Trip RLS policies
9. `20240101000006_rls_permission_slip_policies.sql` - Permission slip RLS policies
10. `20240101000007_rls_student_payment_policies.sql` - Student and payment RLS policies
11. `20240101000008_additional_performance_indexes.sql` - Performance indexes
12. `20240101000009_migrate_existing_data.sql` - Data migration (if applicable)
13. `20240101000010_verify_schema.sql` - Schema verification
14. `20240101000011_create_rate_limits_table.sql` - Rate limiting
15. `20240101000013_add_teacher_permissions.sql` - Teacher permissions
16. `20240101000014_create_trip_approvals.sql` - Trip approval workflow

### Step 2.2: Execute Migrations

**Option A: Using Supabase CLI (Recommended)**

```bash
# Push all migrations to production
supabase db push --linked

# Verify migrations were applied
supabase migration list --linked
```

**Option B: Using Supabase Dashboard**

1. Go to SQL Editor in Supabase Dashboard
2. Execute each migration file in order
3. Verify no errors after each execution

### Step 2.3: Verify All Tables Created

Run this verification query in SQL Editor:

```sql
-- List all tables
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected 21 tables:
- `venues`, `venue_users`
- `experiences`, `availability`, `pricing_tiers`
- `districts`, `schools`, `teachers`
- `rosters`, `students`, `parents`, `student_parents`
- `trips`, `permission_slips`
- `documents`, `payments`, `refunds`
- `attendance`, `chaperones`
- `notifications`, `audit_logs`
- `rate_limits`

### Step 2.4: Verify Table Row Counts

```sql
-- Check table row counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `0` rows initially (fresh production database).

## Phase 3: Configure Row-Level Security (RLS)

### Step 3.1: Verify RLS is Enabled

Run this query to check RLS status:

```sql
-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rls_enabled = true`.

### Step 3.2: List All RLS Policies

```sql
-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected policy count by table:
- **venues**: 3 policies (view, update, insert)
- **venue_users**: 4 policies (view, insert, update, delete)
- **experiences**: 3 policies (view published, view all, manage)
- **availability**: 3 policies (view published, view all, manage)
- **pricing_tiers**: 3 policies (view published, view all, manage)
- **trips**: 4 policies (teacher view/manage, school admin view)
- **permission_slips**: 5 policies (parent view, teacher view/manage, payment access)
- **students**: 3 policies (teacher view/manage, parent view)
- **payments**: 3 policies (parent view, teacher view, venue view)

### Step 3.3: Test RLS Policies

Create test users and verify access:

```sql
-- Test venue user access
-- (Create test venue user and verify they can only see their venue data)

-- Test teacher access
-- (Create test teacher and verify they can only see their school's data)

-- Test parent access
-- (Create test parent and verify they can only see their children's data)
```

## Phase 4: Configure Storage Buckets

### Step 4.1: Create Storage Buckets

Navigate to Storage in Supabase Dashboard and create these buckets:

1. **documents**
   - Purpose: Permission slip documents, signatures
   - Public: No
   - File size limit: 10 MB
   - Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`

2. **medical-forms**
   - Purpose: Student medical information (encrypted)
   - Public: No
   - File size limit: 10 MB
   - Allowed MIME types: `application/pdf`
   - **⚠️ CRITICAL**: Enable encryption at rest

3. **experience-photos**
   - Purpose: Venue experience photos
   - Public: Yes (for display on teacher app)
   - File size limit: 5 MB
   - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`

### Step 4.2: Configure Storage Policies

For each bucket, configure RLS policies:

**documents bucket:**

```sql
-- Policy: Parents can upload signatures for their permission slips
CREATE POLICY "Parents can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IN (
    SELECT p.user_id 
    FROM parents p
    JOIN student_parents sp ON sp.parent_id = p.id
    JOIN permission_slips ps ON ps.student_id = sp.student_id
    WHERE ps.id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Parents can view their documents
CREATE POLICY "Parents can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IN (
    SELECT p.user_id 
    FROM parents p
    JOIN student_parents sp ON sp.parent_id = p.id
    JOIN permission_slips ps ON ps.student_id = sp.student_id
    WHERE ps.id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Teachers can view documents for their trips
CREATE POLICY "Teachers can view trip documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IN (
    SELECT t.user_id
    FROM teachers t
    JOIN trips tr ON tr.teacher_id = t.id
    JOIN permission_slips ps ON ps.trip_id = tr.id
    WHERE ps.id::text = (storage.foldername(name))[1]
  )
);
```

**medical-forms bucket:**

```sql
-- Policy: Parents can upload medical forms for their children
CREATE POLICY "Parents can upload medical forms"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-forms'
  AND auth.uid() IN (
    SELECT p.user_id
    FROM parents p
    JOIN student_parents sp ON sp.parent_id = p.id
    WHERE sp.student_id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Teachers can view medical forms for students on their trips
CREATE POLICY "Teachers can view medical forms"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-forms'
  AND auth.uid() IN (
    SELECT t.user_id
    FROM teachers t
    JOIN trips tr ON tr.teacher_id = t.id
    JOIN permission_slips ps ON ps.trip_id = tr.id
    WHERE ps.student_id::text = (storage.foldername(name))[1]
  )
);
```

**experience-photos bucket:**

```sql
-- Policy: Venue users can upload photos for their experiences
CREATE POLICY "Venue users can upload experience photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'experience-photos'
  AND auth.uid() IN (
    SELECT vu.user_id
    FROM venue_users vu
    JOIN experiences e ON e.venue_id = vu.venue_id
    WHERE e.id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Anyone can view published experience photos
CREATE POLICY "Anyone can view experience photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'experience-photos'
);

-- Policy: Venue users can delete their experience photos
CREATE POLICY "Venue users can delete experience photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'experience-photos'
  AND auth.uid() IN (
    SELECT vu.user_id
    FROM venue_users vu
    JOIN experiences e ON e.venue_id = vu.venue_id
    WHERE e.id::text = (storage.foldername(name))[1]
  )
);
```

### Step 4.3: Verify Storage Configuration

Test file upload/download for each bucket:

```bash
# Test document upload (requires authentication)
curl -X POST \
  'https://<project-ref>.supabase.co/storage/v1/object/documents/test.pdf' \
  -H 'Authorization: Bearer <user-token>' \
  -F 'file=@test.pdf'

# Test experience photo upload (public)
curl -X POST \
  'https://<project-ref>.supabase.co/storage/v1/object/experience-photos/test.jpg' \
  -H 'Authorization: Bearer <user-token>' \
  -F 'file=@test.jpg'
```

## Phase 5: Configure Database Backups

### Step 5.1: Enable Automated Backups

1. Go to **Settings** → **Database** in Supabase Dashboard
2. Navigate to **Backups** section
3. Configure backup settings:
   - **Backup Frequency**: Daily
   - **Backup Time**: 2:00 AM UTC (off-peak hours)
   - **Retention Period**: 30 days
   - **Point-in-Time Recovery**: Enable (Pro plan feature)

### Step 5.2: Verify Backup Configuration

```sql
-- Check backup configuration
SELECT 
  name,
  setting,
  unit,
  context
FROM pg_settings
WHERE name LIKE '%backup%' OR name LIKE '%wal%'
ORDER BY name;
```

### Step 5.3: Test Backup Restoration (Optional)

1. Create a test backup manually
2. Restore to a new test project
3. Verify data integrity
4. Delete test project

## Phase 6: Verify Database Connections

### Step 6.1: Test Connection from Each Application

Create a test script to verify database connectivity:

```typescript
// test-db-connection.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test basic query
    const { data, error } = await supabase
      .from('venues')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

testConnection();
```

Run this test for each application:

```bash
# Test Landing App
cd apps/landing && npm run test:db

# Test Parent App
cd apps/parent && npm run test:db

# Test Teacher App
cd apps/teacher && npm run test:db

# Test Venue App
cd apps/venue && npm run test:db

# Test School App
cd apps/school && npm run test:db
```

### Step 6.2: Verify Environment Variables

Ensure each application has correct production environment variables:

**apps/landing/.env.production**
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**apps/parent/.env.production**
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**apps/teacher/.env.production**
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**apps/venue/.env.production**
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**apps/school/.env.production**
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Phase 7: Post-Setup Verification Checklist

Use this checklist to verify the production database is properly configured:

### Database Structure
- [ ] All 21 tables created successfully
- [ ] All indexes created (check with `\di` in psql)
- [ ] All foreign key constraints active
- [ ] All triggers active (updated_at triggers)
- [ ] UUID extension enabled

### Row-Level Security
- [ ] RLS enabled on all tables
- [ ] All RLS policies created (40+ policies total)
- [ ] Venue policies tested
- [ ] Teacher policies tested
- [ ] Parent policies tested
- [ ] School admin policies tested

### Storage
- [ ] `documents` bucket created with correct policies
- [ ] `medical-forms` bucket created with encryption
- [ ] `experience-photos` bucket created as public
- [ ] Storage policies tested for each bucket
- [ ] File size limits configured

### Backups
- [ ] Daily backups enabled
- [ ] 30-day retention configured
- [ ] Point-in-Time Recovery enabled
- [ ] Backup notifications configured

### Connections
- [ ] Landing app can connect
- [ ] Parent app can connect
- [ ] Teacher app can connect
- [ ] Venue app can connect
- [ ] School app can connect
- [ ] Edge Functions can connect

### Security
- [ ] Service role key stored securely (not in code)
- [ ] Anon key configured in environment variables
- [ ] Database password is strong and secure
- [ ] API rate limiting configured
- [ ] CORS settings configured

## Troubleshooting

### Issue: Migration Fails

**Symptoms**: Error during migration execution

**Solutions**:
1. Check migration order - must be sequential
2. Verify no syntax errors in SQL
3. Check for conflicting table/column names
4. Review Supabase logs for detailed error

### Issue: RLS Policies Not Working

**Symptoms**: Users can see data they shouldn't access

**Solutions**:
1. Verify RLS is enabled: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
2. Check policy logic with `EXPLAIN` queries
3. Verify user authentication tokens are valid
4. Test policies with different user roles

### Issue: Storage Upload Fails

**Symptoms**: File upload returns 403 or 401 error

**Solutions**:
1. Verify storage policies are created
2. Check user authentication
3. Verify file size is within limits
4. Check MIME type is allowed

### Issue: Backup Not Running

**Symptoms**: No backups appearing in dashboard

**Solutions**:
1. Verify Pro plan is active
2. Check backup schedule configuration
3. Review Supabase status page for issues
4. Contact Supabase support

## Security Best Practices

1. **Never commit production credentials** to version control
2. **Rotate keys regularly** (every 90 days)
3. **Use service role key only in Edge Functions** (server-side)
4. **Enable MFA** on Supabase account
5. **Monitor database logs** for suspicious activity
6. **Set up alerts** for failed authentication attempts
7. **Encrypt sensitive data** at application level (medical forms)
8. **Regular security audits** of RLS policies

## Monitoring and Maintenance

### Daily Checks
- [ ] Verify backups completed successfully
- [ ] Check error logs for issues
- [ ] Monitor database performance metrics

### Weekly Checks
- [ ] Review slow query logs
- [ ] Check storage usage
- [ ] Verify RLS policies are working

### Monthly Checks
- [ ] Review and optimize indexes
- [ ] Analyze query performance
- [ ] Update database statistics
- [ ] Review and rotate credentials

## Support and Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Status**: https://status.supabase.com
- **TripSlip Internal Wiki**: [Link to internal documentation]
- **Emergency Contact**: [DevOps team contact]

## Appendix A: Complete Migration List

| # | Migration File | Description | Tables Created |
|---|---------------|-------------|----------------|
| 1 | `00001_initial.sql` | Initial schema | Base structure |
| 2 | `00002_add_indemnification.sql` | Indemnification | - |
| 3 | `20240101000000_create_core_entities.sql` | Core entities | venues, venue_users, experiences, availability, pricing_tiers, districts, schools, teachers, rosters, students, parents, student_parents |
| 4 | `20240101000001_create_trips_and_slips.sql` | Trips | trips, permission_slips |
| 5 | `20240101000002_create_payments_and_refunds.sql` | Payments | payments, refunds |
| 6 | `20240101000003_create_supporting_tables.sql` | Supporting | documents, attendance, chaperones, notifications, audit_logs |
| 7 | `20240101000004_rls_venue_policies.sql` | RLS | - |
| 8 | `20240101000005_rls_trip_policies.sql` | RLS | - |
| 9 | `20240101000006_rls_permission_slip_policies.sql` | RLS | - |
| 10 | `20240101000007_rls_student_payment_policies.sql` | RLS | - |
| 11 | `20240101000008_additional_performance_indexes.sql` | Indexes | - |
| 12 | `20240101000009_migrate_existing_data.sql` | Data migration | - |
| 13 | `20240101000010_verify_schema.sql` | Verification | - |
| 14 | `20240101000011_create_rate_limits_table.sql` | Rate limiting | rate_limits |
| 15 | `20240101000013_add_teacher_permissions.sql` | Permissions | - |
| 16 | `20240101000014_create_trip_approvals.sql` | Approvals | - |

## Appendix B: Environment Variable Template

```bash
# Production Database Configuration
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Database Connection (for Edge Functions)
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_<key>
STRIPE_SECRET_KEY=sk_live_<key>
STRIPE_WEBHOOK_SECRET=whsec_<secret>

# Email Service
EMAIL_API_KEY=<email-api-key>
EMAIL_FROM=noreply@tripslip.com

# SMS Service
SMS_API_KEY=<sms-api-key>
SMS_FROM=+1234567890

# Application URLs
VITE_LANDING_URL=https://tripslip.com
VITE_VENUE_URL=https://venue.tripslip.com
VITE_SCHOOL_URL=https://school.tripslip.com
VITE_TEACHER_URL=https://teacher.tripslip.com
VITE_PARENT_URL=https://parent.tripslip.com

# Monitoring
VITE_SENTRY_DSN=<sentry-dsn>
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: TripSlip DevOps Team
