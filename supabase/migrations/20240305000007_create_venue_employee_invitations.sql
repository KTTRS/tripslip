-- Create venue_employee_invitations table
-- Tracks invitations sent to potential venue employees

CREATE TABLE IF NOT EXISTS venue_employee_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'staff', 'owner')),
  invitation_token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'failed')),
  error_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_venue_employee_invitations_venue ON venue_employee_invitations(venue_id);
CREATE INDEX idx_venue_employee_invitations_email ON venue_employee_invitations(email);
CREATE INDEX idx_venue_employee_invitations_token ON venue_employee_invitations(invitation_token);
CREATE INDEX idx_venue_employee_invitations_status ON venue_employee_invitations(status);
CREATE INDEX idx_venue_employee_invitations_expires ON venue_employee_invitations(expires_at);

-- RLS policies
ALTER TABLE venue_employee_invitations ENABLE ROW LEVEL SECURITY;

-- Venue employees can view invitations for their venue
CREATE POLICY "Venue employees can view invitations for their venue"
  ON venue_employee_invitations
  FOR SELECT
  USING (
    venue_id IN (
      SELECT venue_id 
      FROM venue_employees 
      WHERE user_id = auth.uid()
    )
  );

-- Venue managers and owners can create invitations
CREATE POLICY "Venue managers can create invitations"
  ON venue_employee_invitations
  FOR INSERT
  WITH CHECK (
    venue_id IN (
      SELECT venue_id 
      FROM venue_employees 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'owner')
    )
  );

-- Venue managers and owners can update invitations (for resending)
CREATE POLICY "Venue managers can update invitations"
  ON venue_employee_invitations
  FOR UPDATE
  USING (
    venue_id IN (
      SELECT venue_id 
      FROM venue_employees 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'owner')
    )
  );

-- Venue managers and owners can delete invitations
CREATE POLICY "Venue managers can delete invitations"
  ON venue_employee_invitations
  FOR DELETE
  USING (
    venue_id IN (
      SELECT venue_id 
      FROM venue_employees 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'owner')
    )
  );

-- Anyone can accept an invitation (public access via token)
CREATE POLICY "Anyone can accept invitation with valid token"
  ON venue_employee_invitations
  FOR UPDATE
  USING (
    status = 'pending' 
    AND expires_at > NOW()
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_venue_employee_invitations_updated_at
  BEFORE UPDATE ON venue_employee_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE venue_employee_invitations IS 'Tracks invitations sent to potential venue employees';
COMMENT ON COLUMN venue_employee_invitations.invitation_token IS 'Secure random token for invitation acceptance';
COMMENT ON COLUMN venue_employee_invitations.expires_at IS 'Invitation expires 7 days after creation';
COMMENT ON COLUMN venue_employee_invitations.status IS 'pending: not yet accepted, accepted: employee created, expired: past expiration date, failed: email send failed';
