ALTER TABLE permission_slips DROP CONSTRAINT IF EXISTS permission_slips_status_check;
ALTER TABLE permission_slips ADD CONSTRAINT permission_slips_status_check 
  CHECK (status IN ('pending', 'sent', 'signed', 'paid', 'cancelled'));

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;

DROP TRIGGER IF EXISTS permission_slips_audit ON permission_slips;
DROP FUNCTION IF EXISTS log_permission_slip_changes() CASCADE;
