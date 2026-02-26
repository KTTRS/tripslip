# TripSlip Database Documentation

This directory contains comprehensive documentation for setting up and managing the TripSlip production database.

## 📚 Documentation Files

### 1. [PRODUCTION_DATABASE_SETUP.md](./PRODUCTION_DATABASE_SETUP.md)
**Complete setup guide** with detailed instructions for:
- Creating production Supabase project
- Executing all 16 database migrations
- Configuring Row-Level Security (RLS) policies
- Setting up storage buckets
- Configuring automated backups
- Verifying application connections
- Troubleshooting common issues

**Use this when**: Setting up the production database for the first time or migrating to a new Supabase project.

**Estimated time**: 2 hours

### 2. [DATABASE_SETUP_CHECKLIST.md](./DATABASE_SETUP_CHECKLIST.md)
**Quick reference checklist** for production database setup:
- Step-by-step checklist format
- Checkbox items for each phase
- Time estimates per phase
- Success criteria
- Emergency contacts and rollback plan

**Use this when**: Executing the production setup and need a quick reference to track progress.

**Estimated time**: 2 hours (same as full guide, but easier to follow)

## 🛠️ Verification Scripts

### 1. `scripts/verify-production-database.ts`
Automated verification script that checks:
- All 21 tables exist
- RLS is enabled on all tables
- All 3 storage buckets are configured
- Database indexes are created
- Database connection works

**Usage**:
```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run verification
npm run verify:production-db
```

### 2. `scripts/test-app-connections.ts`
Tests database connectivity from all 5 applications:
- Landing App
- Parent App
- Teacher App
- Venue App
- School App

Also tests:
- RLS policies (public vs private data)
- Storage bucket access (public vs private)

**Usage**:
```bash
# Set environment variables
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# Run connection tests
npm run test:connections
```

## 📋 Quick Start

### For First-Time Setup

1. **Read the full guide**: Start with [PRODUCTION_DATABASE_SETUP.md](./PRODUCTION_DATABASE_SETUP.md)
2. **Use the checklist**: Follow [DATABASE_SETUP_CHECKLIST.md](./DATABASE_SETUP_CHECKLIST.md) during execution
3. **Verify setup**: Run `npm run verify:production-db` after completion
4. **Test connections**: Run `npm run test:connections` to verify all apps can connect

### For Verification Only

If the database is already set up and you just need to verify:

```bash
# Quick verification
npm run verify:production-db

# Test application connections
npm run test:connections
```

## 🗂️ Database Structure

### Tables (21 total)

**Venue Management**:
- `venues` - Venue information
- `venue_users` - Venue user accounts
- `experiences` - Educational experiences offered by venues
- `availability` - Experience availability calendar
- `pricing_tiers` - Pricing structure for experiences

**School Hierarchy**:
- `districts` - School districts
- `schools` - Schools within districts
- `teachers` - Teacher accounts
- `rosters` - Student rosters managed by teachers
- `students` - Student information
- `parents` - Parent accounts
- `student_parents` - Student-parent relationships

**Trip Management**:
- `trips` - Field trips created by teachers
- `permission_slips` - Permission slips for students
- `documents` - Uploaded documents
- `payments` - Payment transactions
- `refunds` - Refund records

**Supporting Tables**:
- `attendance` - Trip attendance tracking
- `chaperones` - Chaperone information
- `notifications` - System notifications
- `audit_logs` - Audit trail for compliance
- `rate_limits` - API rate limiting

### Storage Buckets (3 total)

1. **documents** (Private)
   - Permission slip signatures
   - Trip documents
   - Access: Parents (own docs), Teachers (trip docs)

2. **medical-forms** (Private, Encrypted)
   - Student medical information
   - Access: Parents (own children), Teachers (trip students)
   - **FERPA compliant** with encryption at rest

3. **experience-photos** (Public)
   - Venue experience photos
   - Access: Public read, Venue users write

## 🔒 Security Features

### Row-Level Security (RLS)
- **40+ policies** protecting data access
- **Venue isolation**: Venues can only see their own data
- **School isolation**: Schools can only see their own data
- **Parent access**: Parents can only see their children's data
- **Teacher access**: Teachers can only see their school's data

### Data Encryption
- **Medical forms**: Encrypted at rest (AES-256)
- **Passwords**: Hashed with bcrypt
- **API keys**: Stored in environment variables (not in code)

### Compliance
- **FERPA compliant**: Student data protection
- **Audit logs**: All data access logged
- **Data retention**: 30-day backup retention
- **Right to deletion**: Parent data export/deletion

## 📊 Monitoring

### Daily Checks
- Verify automated backups completed
- Check error logs for issues
- Monitor database performance metrics

### Weekly Checks
- Review slow query logs
- Check storage usage
- Verify RLS policies working

### Monthly Checks
- Review and optimize indexes
- Analyze query performance
- Update database statistics
- Review and rotate credentials

## 🚨 Troubleshooting

### Common Issues

**Issue**: Migration fails
- **Solution**: Check migration order, verify syntax, review logs

**Issue**: RLS policies not working
- **Solution**: Verify RLS enabled, check policy logic, test with different users

**Issue**: Storage upload fails
- **Solution**: Verify storage policies, check authentication, verify file size/type

**Issue**: Backup not running
- **Solution**: Verify Pro plan active, check schedule, contact Supabase support

See [PRODUCTION_DATABASE_SETUP.md](./PRODUCTION_DATABASE_SETUP.md) for detailed troubleshooting.

## 📞 Support

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Status**: https://status.supabase.com
- **Supabase Support**: support@supabase.com
- **TripSlip Internal Wiki**: [Link to internal docs]

## 🔄 Maintenance Schedule

### Daily
- Automated backups (2:00 AM UTC)
- Error log review

### Weekly
- Performance metrics review
- Storage usage check
- RLS policy verification

### Monthly
- Index optimization
- Query performance analysis
- Credential rotation (every 90 days)
- Security audit

### Quarterly
- Full database audit
- Backup restoration test
- Disaster recovery drill

## 📝 Change Log

### Version 1.0 (2024)
- Initial production database setup documentation
- 21 tables, 40+ RLS policies
- 3 storage buckets with policies
- Automated backup configuration
- Verification scripts

---

**Last Updated**: 2024  
**Maintained By**: TripSlip DevOps Team  
**Document Version**: 1.0
