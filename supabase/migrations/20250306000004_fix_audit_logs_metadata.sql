ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

DROP TRIGGER IF EXISTS audit_permission_slips ON permission_slips;
DROP TRIGGER IF EXISTS permission_slip_audit_trigger ON permission_slips;
DROP FUNCTION IF EXISTS audit_permission_slip_changes() CASCADE;
DROP FUNCTION IF EXISTS fn_audit_permission_slips() CASCADE;
