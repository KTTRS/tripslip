-- Create venue claim requests table
-- Migration: 20240101000023_create_venue_claim_requests.sql
-- Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7

-- =====================================================
-- VENUE CLAIM REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_email TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verification_token TEXT,
  email_verification_sent_at TIMESTAMPTZ,
  
  -- Proof of affiliation
  proof_type TEXT NOT NULL CHECK (proof_type IN ('business_license', 'employment_verification', 'domain_email')),
  proof_document_url TEXT,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rejection CHECK (
    (status = 'rejected' AND rejection_reason IS NOT NULL) OR 
    (status != 'rejected')
  ),
  CONSTRAINT valid_review CHECK (
    (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) OR 
    (status NOT IN ('approved', 'rejected'))
  )
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_venue_claims_venue ON venue_claim_requests(venue_id);
CREATE INDEX idx_venue_claims_requester ON venue_claim_requests(requester_id);
CREATE INDEX idx_venue_claims_status ON venue_claim_requests(status);
CREATE INDEX idx_venue_claims_created ON venue_claim_requests(created_at DESC);

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_venue_claim_requests_updated_at
  BEFORE UPDATE ON venue_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO PREVENT DUPLICATE CLAIMS
-- =====================================================

CREATE OR REPLACE FUNCTION check_venue_claim_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if venue is already claimed
  IF EXISTS (
    SELECT 1 FROM venues 
    WHERE id = NEW.venue_id AND claimed = true
  ) THEN
    RAISE EXCEPTION 'Venue is already claimed';
  END IF;
  
  -- Check if there's already an approved or pending claim for this venue
  IF EXISTS (
    SELECT 1 FROM venue_claim_requests 
    WHERE venue_id = NEW.venue_id 
    AND status IN ('approved', 'pending', 'under_review')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'There is already a pending or approved claim for this venue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_venue_claim_eligibility_trigger
  BEFORE INSERT OR UPDATE ON venue_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_venue_claim_eligibility();

-- =====================================================
-- FUNCTION TO HANDLE CLAIM APPROVAL
-- =====================================================

CREATE OR REPLACE FUNCTION handle_venue_claim_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Update venue as claimed
    UPDATE venues 
    SET 
      claimed = true,
      claimed_at = NOW(),
      claimed_by = NEW.requester_id
    WHERE id = NEW.venue_id;
    
    -- Check if requester already has a venue_admin role assignment for this venue
    IF NOT EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = NEW.requester_id
      AND ur.name = 'venue_admin'
      AND ura.organization_type = 'venue'
      AND ura.organization_id = NEW.venue_id
    ) THEN
      -- Grant venue_admin role to the requester
      INSERT INTO user_role_assignments (
        user_id,
        role_id,
        organization_type,
        organization_id,
        is_active
      )
      SELECT 
        NEW.requester_id,
        ur.id,
        'venue',
        NEW.venue_id,
        true
      FROM user_roles ur
      WHERE ur.name = 'venue_admin';
    END IF;
    
    -- Also add to venue_users table with administrator role
    INSERT INTO venue_users (venue_id, user_id, role)
    VALUES (NEW.venue_id, NEW.requester_id, 'administrator')
    ON CONFLICT (venue_id, user_id) 
    DO UPDATE SET role = 'administrator';
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_venue_claim_approval_trigger
  AFTER INSERT OR UPDATE ON venue_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_venue_claim_approval();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE venue_claim_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own claim requests
CREATE POLICY "Users can view their own claim requests"
  ON venue_claim_requests
  FOR SELECT
  USING (auth.uid() = requester_id);

-- Users can create claim requests
CREATE POLICY "Users can create claim requests"
  ON venue_claim_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update their own pending claim requests (for email verification)
CREATE POLICY "Users can update their own pending claims"
  ON venue_claim_requests
  FOR UPDATE
  USING (
    auth.uid() = requester_id 
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = requester_id 
    AND status = 'pending'
  );

-- TripSlip admins can view all claim requests
CREATE POLICY "TripSlip admins can view all claim requests"
  ON venue_claim_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'tripslip_admin'
      AND ura.is_active = true
    )
  );

-- TripSlip admins can update claim requests (for review)
CREATE POLICY "TripSlip admins can update claim requests"
  ON venue_claim_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'tripslip_admin'
      AND ura.is_active = true
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE venue_claim_requests IS 'Tracks venue ownership claim requests from venue representatives';
COMMENT ON COLUMN venue_claim_requests.business_email IS 'Business email address for verification';
COMMENT ON COLUMN venue_claim_requests.email_verified IS 'Whether the business email has been verified';
COMMENT ON COLUMN venue_claim_requests.proof_type IS 'Type of proof provided for venue affiliation';
COMMENT ON COLUMN venue_claim_requests.proof_document_url IS 'URL to uploaded proof document';
COMMENT ON COLUMN venue_claim_requests.status IS 'Current status of the claim request';
COMMENT ON COLUMN venue_claim_requests.reviewed_by IS 'Admin user who reviewed the claim';
COMMENT ON COLUMN venue_claim_requests.rejection_reason IS 'Reason for rejection if claim was denied';
