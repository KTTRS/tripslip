ALTER TABLE permission_slips DROP CONSTRAINT IF EXISTS permission_slips_status_check;
ALTER TABLE permission_slips ADD CONSTRAINT permission_slips_status_check 
  CHECK (status IN ('pending', 'sent', 'signed', 'signed_pending_payment', 'paid', 'cancelled'));
