# TripSlip Production Database Setup - Quick Checklist

## Pre-Setup Preparation

- [ ] Supabase account with production access
- [ ] Supabase CLI installed and logged in
- [ ] Production credentials secured
- [ ] Team notified of maintenance window
- [ ] Backup plan documented

## Phase 1: Project Creation (15 minutes)

- [ ] Create new Supabase project "tripslip-production"
- [ ] Select Pro plan or higher
- [ ] Choose region: `us-east-1` (or closest to users)
- [ ] Generate and save strong database password
- [ ] Save project reference ID: `________________`
- [ ] Save API URL: `https://________________.supabase.co`
- [ ] Save anon key (public): `________________`
- [ ] Save service role key (secret): `________________`
- [ ] Link Supabase CLI: `supabase link --project-ref <ref>`
- [ ] Verify connection: `supabase projects list`

## Phase 2: Execute Migrations (20 minutes)

- [ ] Verify all 16 migration files exist in `supabase/migrations/`
- [ ] Execute migrations: `supabase db push --linked`
- [ ] Verify migrations applied: `supabase migration list --linked`
- [ ] Run table count query - expect 21 tables
- [ ] Verify all tables have 0 rows (fresh database)
- [ ] Check for migration errors in logs

### Expected Tables (21 total)
- [ ] venues, venue_users
- [ ] experiences, availability, pricing_tiers
- [ ] districts, schools, teachers
- [ ] rosters, students, parents, student_parents
- [ ] trips, permission_slips
- [ ] documents, payments, refunds
- [ ] attendance, chaperones
- [ ] notifications, audit_logs
- [ ] rate_limits

## Phase 3: Verify RLS Policies (15 minutes)

- [ ] Run RLS status query - all tables should have RLS enabled
- [ ] Count RLS policies - expect 40+ policies
- [ ] Verify venue policies (3 on venues table)
- [ ] Verify venue_users policies (4 policies)
- [ ] Verify experience policies (3 policies)
- [ ] Verify trip policies (4 policies)
- [ ] Verify permission_slip policies (5 policies)
- [ ] Verify student policies (3 policies)
- [ ] Verify payment policies (3 policies)

### RLS Policy Testing
- [ ] Create test venue user - verify access to own venue only
- [ ] Create test teacher - verify access to own school only
- [ ] Create test parent - verify access to own children only
- [ ] Delete test users after verification

## Phase 4: Configure Storage Buckets (20 minutes)

### Bucket 1: documents
- [ ] Create bucket "documents"
- [ ] Set public: No
- [ ] Set file size limit: 10 MB
- [ ] Set allowed types: PDF, PNG, JPEG
- [ ] Create policy: "Parents can upload signatures"
- [ ] Create policy: "Parents can view their documents"
- [ ] Create policy: "Teachers can view trip documents"
- [ ] Test upload with authenticated user
- [ ] Test access control (verify users can't see others' docs)

### Bucket 2: medical-forms
- [ ] Create bucket "medical-forms"
- [ ] Set public: No
- [ ] Set file size limit: 10 MB
- [ ] Set allowed types: PDF only
- [ ] **Enable encryption at rest** ⚠️ CRITICAL
- [ ] Create policy: "Parents can upload medical forms"
- [ ] Create policy: "Teachers can view medical forms"
- [ ] Test upload with authenticated user
- [ ] Verify encryption is active

### Bucket 3: experience-photos
- [ ] Create bucket "experience-photos"
- [ ] Set public: Yes
- [ ] Set file size limit: 5 MB
- [ ] Set allowed types: PNG, JPEG, WebP
- [ ] Create policy: "Venue users can upload experience photos"
- [ ] Create policy: "Anyone can view experience photos"
- [ ] Create policy: "Venue users can delete experience photos"
- [ ] Test public access (no auth required)
- [ ] Test upload with venue user

## Phase 5: Configure Backups (10 minutes)

- [ ] Navigate to Settings → Database → Backups
- [ ] Enable automated backups
- [ ] Set frequency: Daily
- [ ] Set time: 2:00 AM UTC
- [ ] Set retention: 30 days
- [ ] Enable Point-in-Time Recovery (Pro feature)
- [ ] Verify backup configuration saved
- [ ] Set up backup failure alerts
- [ ] Document backup restoration procedure

## Phase 6: Verify Application Connections (15 minutes)

### Landing App
- [ ] Create `.env.production` with correct credentials
- [ ] Test database connection
- [ ] Verify no errors in console

### Parent App
- [ ] Create `.env.production` with correct credentials
- [ ] Test database connection
- [ ] Test permission slip query
- [ ] Verify RLS allows parent access

### Teacher App
- [ ] Create `.env.production` with correct credentials
- [ ] Test database connection
- [ ] Test trip query
- [ ] Verify RLS allows teacher access

### Venue App
- [ ] Create `.env.production` with correct credentials
- [ ] Test database connection
- [ ] Test experience query
- [ ] Verify RLS allows venue access

### School App
- [ ] Create `.env.production` with correct credentials
- [ ] Test database connection
- [ ] Test school-wide trip query
- [ ] Verify RLS allows school admin access

## Phase 7: Security Configuration (15 minutes)

- [ ] Verify service role key is NOT in any code files
- [ ] Verify service role key is NOT in version control
- [ ] Add service role key to Vercel environment variables
- [ ] Configure API rate limiting
- [ ] Set up CORS allowed origins
- [ ] Enable MFA on Supabase account
- [ ] Set up database activity alerts
- [ ] Configure failed auth attempt monitoring
- [ ] Document key rotation schedule (90 days)

## Phase 8: Final Verification (10 minutes)

### Database Health
- [ ] Run `SELECT version();` - verify PostgreSQL 15
- [ ] Check database size: `SELECT pg_size_pretty(pg_database_size('postgres'));`
- [ ] Verify all indexes created: `\di` in psql
- [ ] Check for slow queries (should be none on empty DB)

### Monitoring Setup
- [ ] Configure Supabase dashboard alerts
- [ ] Set up error notification emails
- [ ] Configure Slack/Discord webhooks (if applicable)
- [ ] Test alert system with dummy error

### Documentation
- [ ] Update internal wiki with production credentials location
- [ ] Share database setup completion with team
- [ ] Document any deviations from standard setup
- [ ] Create runbook for common database operations

## Post-Setup Tasks (Within 24 hours)

- [ ] Monitor first automated backup completion
- [ ] Review database logs for any errors
- [ ] Verify all 5 applications can connect in production
- [ ] Test end-to-end workflow (create trip, sign slip, process payment)
- [ ] Schedule first database performance review (1 week)
- [ ] Schedule first security audit (1 week)

## Emergency Contacts

- **Supabase Support**: support@supabase.com
- **TripSlip DevOps Lead**: ________________
- **Database Administrator**: ________________
- **Security Team**: ________________

## Rollback Plan

If critical issues occur during setup:

1. **Stop all application deployments**
2. **Document the issue** with screenshots and error logs
3. **Contact Supabase support** if database-related
4. **Restore from backup** if data corruption occurred
5. **Notify team** of rollback decision
6. **Schedule post-mortem** to review what went wrong

## Success Criteria

Setup is complete when:

- ✅ All 21 tables created successfully
- ✅ All 40+ RLS policies active and tested
- ✅ All 3 storage buckets configured with policies
- ✅ Daily backups enabled with 30-day retention
- ✅ All 5 applications can connect and query database
- ✅ No errors in database logs
- ✅ Security best practices implemented
- ✅ Team notified and documentation updated

---

**Estimated Total Time**: 2 hours  
**Recommended Team Size**: 2 people (1 executing, 1 verifying)  
**Best Time to Execute**: Off-peak hours (weekend or late evening)

**Document Version**: 1.0  
**Last Updated**: 2024
