ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check 
  CHECK (status IN ('draft', 'pending', 'pending_approval', 'approved', 'confirmed', 'rejected', 'cancelled', 'completed'));
