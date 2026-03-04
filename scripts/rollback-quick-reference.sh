#!/bin/bash

# =====================================================
# QUICK REFERENCE: Authentication Rollback Scripts
# =====================================================
#
# This file contains quick reference commands for common
# rollback scenarios. DO NOT execute this file directly.
# Copy and paste individual commands as needed.
#
# =====================================================

# =====================================================
# BACKUP COMMANDS
# =====================================================

# Create full database backup
backup_database() {
  local timestamp=$(date +%Y%m%d-%H%M%S)
  supabase db dump -f "backup-before-rollback-${timestamp}.sql"
  echo "Backup created: backup-before-rollback-${timestamp}.sql"
}

# Export role assignments
backup_role_assignments() {
  psql $DATABASE_URL -c "COPY (SELECT * FROM user_role_assignments) TO STDOUT CSV HEADER" > role_assignments_backup.csv
  echo "Role assignments exported to role_assignments_backup.csv"
}

# Export active role contexts
backup_active_roles() {
  psql $DATABASE_URL -c "COPY (SELECT * FROM active_role_context) TO STDOUT CSV HEADER" > active_roles_backup.csv
  echo "Active roles exported to active_roles_backup.csv"
}

# Export audit logs
backup_audit_logs() {
  psql $DATABASE_URL -c "COPY (SELECT * FROM audit_logs) TO STDOUT CSV HEADER" > audit_logs_backup.csv
  echo "Audit logs exported to audit_logs_backup.csv"
}

# =====================================================
# VERIFICATION COMMANDS
# =====================================================

# Verify RBAC tables exist
verify_rbac_tables() {
  psql $DATABASE_URL << 'EOF'
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
  )
ORDER BY table_name;
EOF
}

# Verify RLS status
verify_rls_status() {
  psql $DATABASE_URL << 'EOF'
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'trips', 'students', 'schools', 'experiences', 
    'teachers', 'rosters', 'permission_slips'
  )
ORDER BY tablename;
EOF
}

# Verify RLS helper functions
verify_rls_functions() {
  psql $DATABASE_URL << 'EOF'
SELECT proname, pg_get_function_identity_arguments(oid) as signature
FROM pg_proc 
WHERE proname IN ('user_role', 'user_organization_id', 'user_organization_type', 'has_role', 'is_tripslip_admin')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
ORDER BY proname;
EOF
}

# Count role assignments
count_role_assignments() {
  psql $DATABASE_URL << 'EOF'
SELECT 
  r.name as role_name,
  COUNT(*) as assignment_count
FROM user_role_assignments ura
JOIN user_roles r ON ura.role_id = r.id
GROUP BY r.name
ORDER BY assignment_count DESC;
EOF
}

# =====================================================
# FULL ROLLBACK
# =====================================================

# Execute full rollback (interactive)
full_rollback() {
  echo "⚠️  WARNING: This will execute the full rollback script!"
  echo "This will remove all RBAC tables, RLS policies, and related data."
  echo ""
  read -p "Are you sure you want to proceed? (type 'yes' to confirm): " confirm
  
  if [ "$confirm" = "yes" ]; then
    echo "Executing rollback script..."
    psql $DATABASE_URL -f scripts/rollback-auth-migrations.sql
  else
    echo "Rollback cancelled."
  fi
}

# =====================================================
# PARTIAL ROLLBACK: RLS POLICIES ONLY
# =====================================================

# Disable RLS on all tables
disable_rls_only() {
  psql $DATABASE_URL << 'EOF'
BEGIN;

-- Disable RLS
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE rosters DISABLE ROW LEVEL SECURITY;
ALTER TABLE permission_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE districts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_role_context DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "trips_select_policy" ON trips;
DROP POLICY IF EXISTS "trips_insert_policy" ON trips;
DROP POLICY IF EXISTS "trips_update_policy" ON trips;
DROP POLICY IF EXISTS "trips_delete_policy" ON trips;

DROP POLICY IF EXISTS "students_select_policy" ON students;
DROP POLICY IF EXISTS "students_insert_policy" ON students;
DROP POLICY IF EXISTS "students_update_policy" ON students;
DROP POLICY IF EXISTS "students_delete_policy" ON students;

DROP POLICY IF EXISTS "schools_select_policy" ON schools;
DROP POLICY IF EXISTS "schools_insert_policy" ON schools;
DROP POLICY IF EXISTS "schools_update_policy" ON schools;
DROP POLICY IF EXISTS "schools_delete_policy" ON schools;

DROP POLICY IF EXISTS "experiences_select_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_insert_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_update_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_delete_policy" ON experiences;

DROP POLICY IF EXISTS "teachers_select_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_insert_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_update_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_delete_policy" ON teachers;

DROP POLICY IF EXISTS "rosters_select_policy" ON rosters;
DROP POLICY IF EXISTS "permission_slips_select_policy" ON permission_slips;
DROP POLICY IF EXISTS "venues_select_policy" ON venues;
DROP POLICY IF EXISTS "districts_select_policy" ON districts;
DROP POLICY IF EXISTS "user_role_assignments_select_policy" ON user_role_assignments;
DROP POLICY IF EXISTS "active_role_context_select_policy" ON active_role_context;

COMMIT;

SELECT 'RLS disabled and policies dropped successfully' as status;
EOF
}

# =====================================================
# PARTIAL ROLLBACK: AUDIT LOGS ONLY
# =====================================================

# Remove audit logs table
remove_audit_logs() {
  psql $DATABASE_URL << 'EOF'
BEGIN;
DROP TABLE IF EXISTS audit_logs CASCADE;
COMMIT;
SELECT 'Audit logs table dropped successfully' as status;
EOF
}

# =====================================================
# PARTIAL ROLLBACK: DISTRICTS ONLY
# =====================================================

# Remove districts and school-district relationships
remove_districts() {
  psql $DATABASE_URL << 'EOF'
BEGIN;
DROP TABLE IF EXISTS school_districts CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
COMMIT;
SELECT 'Districts tables dropped successfully' as status;
EOF
}

# =====================================================
# RESTORATION COMMANDS
# =====================================================

# Restore from backup file
restore_from_backup() {
  local backup_file=$1
  if [ -z "$backup_file" ]; then
    echo "Usage: restore_from_backup <backup-file.sql>"
    return 1
  fi
  
  echo "⚠️  WARNING: This will restore the database from backup!"
  echo "File: $backup_file"
  echo ""
  read -p "Are you sure you want to proceed? (type 'yes' to confirm): " confirm
  
  if [ "$confirm" = "yes" ]; then
    echo "Restoring from backup..."
    psql $DATABASE_URL < "$backup_file"
    echo "Restore complete."
  else
    echo "Restore cancelled."
  fi
}

# Re-run migrations
rerun_migrations() {
  echo "Re-running authentication migrations..."
  supabase db push
  echo "Migrations applied."
}

# =====================================================
# EMERGENCY ROLLBACK
# =====================================================

# Quick emergency rollback (no confirmation)
emergency_rollback() {
  echo "🚨 EMERGENCY ROLLBACK IN PROGRESS..."
  psql $DATABASE_URL << 'EOF'
BEGIN;

-- Disable RLS
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;

-- Drop tables
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS active_role_context CASCADE;
DROP TABLE IF EXISTS user_role_assignments CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS school_districts CASCADE;
DROP TABLE IF EXISTS districts CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS auth.user_role();
DROP FUNCTION IF EXISTS auth.user_organization_id();
DROP FUNCTION IF EXISTS auth.user_organization_type();
DROP FUNCTION IF EXISTS auth.has_role(TEXT);
DROP FUNCTION IF EXISTS auth.is_tripslip_admin();

COMMIT;

SELECT 'Emergency rollback complete' as status;
EOF
  echo "✅ Emergency rollback complete."
}

# =====================================================
# USAGE INFORMATION
# =====================================================

show_usage() {
  cat << 'EOF'
Authentication Rollback Quick Reference

BACKUP COMMANDS:
  backup_database              - Create full database backup
  backup_role_assignments      - Export role assignments to CSV
  backup_active_roles          - Export active role contexts to CSV
  backup_audit_logs            - Export audit logs to CSV

VERIFICATION COMMANDS:
  verify_rbac_tables           - Check if RBAC tables exist
  verify_rls_status            - Check RLS status on tables
  verify_rls_functions         - Check if RLS helper functions exist
  count_role_assignments       - Count role assignments by role

ROLLBACK COMMANDS:
  full_rollback                - Execute full rollback (interactive)
  disable_rls_only             - Disable RLS and drop policies only
  remove_audit_logs            - Remove audit logs table only
  remove_districts             - Remove districts tables only
  emergency_rollback           - Quick emergency rollback (no confirmation)

RESTORATION COMMANDS:
  restore_from_backup <file>   - Restore database from backup file
  rerun_migrations             - Re-apply authentication migrations

USAGE:
  1. Source this file: source scripts/rollback-quick-reference.sh
  2. Run a command: backup_database
  3. Or copy/paste individual SQL commands as needed

IMPORTANT:
  - Always backup before rollback
  - Test in development first
  - Review output before committing
  - Document all actions taken

EOF
}

# Show usage if script is sourced
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  echo "⚠️  This script should be sourced, not executed directly."
  echo ""
  show_usage
  exit 1
fi

# If sourced, show usage
show_usage
