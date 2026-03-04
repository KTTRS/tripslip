-- Enhance Approval Workflow System (Task 13.3)
-- Migration: 20240101000031_enhance_approval_workflow.sql
-- 
-- This migration implements:
-- - Configurable approval chain system
-- - Multi-level approval routing
-- - Approval delegation functionality
-- - Enhanced approval status tracking
--
-- **Validates: Requirements 11.5, 11.6, 11.7, 11.8, 12.1, 12.2, 12.3, 12.4, 12.6, 12.7, 13.1-13.6**

-- =====================================================
-- APPROVAL CHAIN CONFIGURATION
-- =====================================================

-- Define approval chains based on trip characteristics
CREATE TABLE approval_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Conditions for when this chain applies
  min_cost_cents INTEGER, -- Minimum trip cost to trigger this chain
  max_cost_cents INTEGER, -- Maximum trip cost for this chain
  requires_overnight BOOLEAN DEFAULT false, -- Applies to overnight trips
  requires_out_of_state BOOLEAN DEFAULT false, -- Applies to out-of-state trips
  requires_international BOOLEAN DEFAULT false, -- Applies to international trips
  min_duration_days INTEGER, -- Minimum trip duration
  
  -- Chain configuration
  approval_type TEXT NOT NULL DEFAULT 'sequential' CHECK (approval_type IN ('sequential', 'parallel')),
  
  -- Status
  active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority chains are checked first
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_approval_chains_school ON approval_chains(school_id);
CREATE INDEX idx_approval_chains_active ON approval_chains(active) WHERE active = true;
CREATE INDEX idx_approval_chains_priority ON approval_chains(priority DESC);

-- =====================================================
-- APPROVAL CHAIN STEPS
-- =====================================================

-- Define the steps/levels in an approval chain
CREATE TABLE approval_chain_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES approval_chains(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL, -- Order of this step in the chain (1, 2, 3, etc.)
  role_required TEXT NOT NULL, -- Role required for this step (principal, assistant_principal, district_admin, etc.)
  approver_user_id UUID REFERENCES auth.users(id), -- Specific user if assigned
  approver_name TEXT, -- Name of the approver (for display)
  
  -- Delegation
  can_delegate BOOLEAN NOT NULL DEFAULT false,
  delegated_to UUID REFERENCES auth.users(id),
  delegated_at TIMESTAMPTZ,
  delegation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(chain_id, step_order)
);

CREATE INDEX idx_approval_chain_steps_chain ON approval_chain_steps(chain_id, step_order);
CREATE INDEX idx_approval_chain_steps_approver ON approval_chain_steps(approver_user_id);
CREATE INDEX idx_approval_chain_steps_delegated ON approval_chain_steps(delegated_to);

-- =====================================================
-- ENHANCE TRIP APPROVALS TABLE
-- =====================================================

-- Add new columns to existing trip_approvals table
ALTER TABLE trip_approvals 
  ADD COLUMN IF NOT EXISTS chain_id UUID REFERENCES approval_chains(id),
  ADD COLUMN IF NOT EXISTS step_id UUID REFERENCES approval_chain_steps(id),
  ADD COLUMN IF NOT EXISTS step_order INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS changes_requested TEXT,
  ADD COLUMN IF NOT EXISTS teacher_response TEXT,
  ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delegated_from UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- Update the decision column to be nullable (since we now have status)
ALTER TABLE trip_approvals ALTER COLUMN decision DROP NOT NULL;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_trip_approvals_status ON trip_approvals(status);
CREATE INDEX IF NOT EXISTS idx_trip_approvals_chain ON trip_approvals(chain_id);
CREATE INDEX IF NOT EXISTS idx_trip_approvals_deadline ON trip_approvals(deadline) WHERE deadline IS NOT NULL;

-- =====================================================
-- TRIP APPROVAL ROUTING
-- =====================================================

-- Track which approval chain was selected for a trip
CREATE TABLE trip_approval_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  chain_id UUID NOT NULL REFERENCES approval_chains(id),
  
  -- Trip characteristics that triggered this chain
  trip_cost_cents INTEGER,
  is_overnight BOOLEAN,
  is_out_of_state BOOLEAN,
  is_international BOOLEAN,
  duration_days INTEGER,
  
  -- Routing status
  routing_status TEXT NOT NULL DEFAULT 'pending' CHECK (routing_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  current_step_order INTEGER,
  
  -- Timestamps
  routed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_approval_routing_trip ON trip_approval_routing(trip_id);
CREATE INDEX idx_trip_approval_routing_chain ON trip_approval_routing(chain_id);
CREATE INDEX idx_trip_approval_routing_status ON trip_approval_routing(routing_status);

-- =====================================================
-- APPROVAL CONVERSATION THREAD
-- =====================================================

-- Track conversation between administrators and teachers
CREATE TABLE approval_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES trip_approvals(id) ON DELETE CASCADE,
  
  -- Message details
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL, -- 'teacher', 'administrator'
  message TEXT NOT NULL,
  
  -- Message type
  message_type TEXT NOT NULL DEFAULT 'comment' CHECK (message_type IN ('comment', 'question', 'response', 'change_request', 'alternative_suggestion')),
  
  -- References
  parent_message_id UUID REFERENCES approval_conversations(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_conversations_trip ON approval_conversations(trip_id, created_at);
CREATE INDEX idx_approval_conversations_approval ON approval_conversations(approval_id);
CREATE INDEX idx_approval_conversations_sender ON approval_conversations(sender_id);
CREATE INDEX idx_approval_conversations_parent ON approval_conversations(parent_message_id);

-- =====================================================
-- APPROVAL DELEGATION LOG
-- =====================================================

-- Track delegation history
CREATE TABLE approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES approval_chain_steps(id) ON DELETE CASCADE,
  delegated_from UUID NOT NULL REFERENCES auth.users(id),
  delegated_to UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_approval_delegations_step ON approval_delegations(step_id);
CREATE INDEX idx_approval_delegations_from ON approval_delegations(delegated_from);
CREATE INDEX idx_approval_delegations_to ON approval_delegations(delegated_to);
CREATE INDEX idx_approval_delegations_active ON approval_delegations(active) WHERE active = true;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to determine which approval chain applies to a trip
CREATE OR REPLACE FUNCTION get_approval_chain_for_trip(
  p_trip_id UUID,
  p_school_id UUID,
  p_cost_cents INTEGER,
  p_is_overnight BOOLEAN,
  p_is_out_of_state BOOLEAN,
  p_is_international BOOLEAN,
  p_duration_days INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_chain_id UUID;
BEGIN
  -- Find the first matching chain based on priority
  SELECT id INTO v_chain_id
  FROM approval_chains
  WHERE school_id = p_school_id
    AND active = true
    AND (min_cost_cents IS NULL OR p_cost_cents >= min_cost_cents)
    AND (max_cost_cents IS NULL OR p_cost_cents <= max_cost_cents)
    AND (NOT requires_overnight OR p_is_overnight)
    AND (NOT requires_out_of_state OR p_is_out_of_state)
    AND (NOT requires_international OR p_is_international)
    AND (min_duration_days IS NULL OR p_duration_days >= min_duration_days)
  ORDER BY priority DESC, created_at ASC
  LIMIT 1;
  
  RETURN v_chain_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create approval records for a trip based on its chain
CREATE OR REPLACE FUNCTION create_trip_approvals_from_chain(
  p_trip_id UUID,
  p_chain_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_step RECORD;
  v_approver_id UUID;
BEGIN
  -- Create an approval record for each step in the chain
  FOR v_step IN 
    SELECT * FROM approval_chain_steps 
    WHERE chain_id = p_chain_id 
    ORDER BY step_order
  LOOP
    -- Determine the approver (use delegated_to if delegation exists, otherwise use approver_user_id)
    v_approver_id := COALESCE(v_step.delegated_to, v_step.approver_user_id);
    
    INSERT INTO trip_approvals (
      trip_id,
      chain_id,
      step_id,
      step_order,
      administrator_id,
      administrator_name,
      status,
      decision,
      delegated_from
    ) VALUES (
      p_trip_id,
      p_chain_id,
      v_step.id,
      v_step.step_order,
      v_approver_id,
      COALESCE(v_step.approver_name, 'Pending Assignment'),
      'pending',
      NULL,
      CASE WHEN v_step.delegated_to IS NOT NULL THEN v_step.approver_user_id ELSE NULL END
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get the current active approver for a trip
CREATE OR REPLACE FUNCTION get_current_approver_for_trip(p_trip_id UUID)
RETURNS TABLE (
  approval_id UUID,
  administrator_id UUID,
  administrator_name TEXT,
  step_order INTEGER,
  deadline TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.administrator_id,
    ta.administrator_name,
    ta.step_order,
    ta.deadline
  FROM trip_approvals ta
  JOIN trip_approval_routing tar ON tar.trip_id = ta.trip_id
  WHERE ta.trip_id = p_trip_id
    AND ta.status = 'pending'
    AND (tar.current_step_order IS NULL OR ta.step_order = tar.current_step_order)
  ORDER BY ta.step_order
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Approval Chains
ALTER TABLE approval_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can view their school's approval chains"
  ON approval_chains FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can manage their school's approval chains"
  ON approval_chains FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE user_id = auth.uid()
    )
  );

-- Approval Chain Steps
ALTER TABLE approval_chain_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval chain steps for their school"
  ON approval_chain_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM approval_chains ac
      WHERE ac.id = approval_chain_steps.chain_id
      AND ac.school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "School admins can manage approval chain steps"
  ON approval_chain_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM approval_chains ac
      WHERE ac.id = approval_chain_steps.chain_id
      AND ac.school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Trip Approval Routing
ALTER TABLE trip_approval_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trip approval routing for their school"
  ON trip_approval_routing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      JOIN teachers te ON t.teacher_id = te.id
      WHERE t.id = trip_approval_routing.trip_id
      AND te.school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Approval Conversations
ALTER TABLE approval_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval conversations for their trips"
  ON approval_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      JOIN teachers te ON t.teacher_id = te.id
      WHERE t.id = approval_conversations.trip_id
      AND te.school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create approval conversations"
  ON approval_conversations FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trips t
      JOIN teachers te ON t.teacher_id = te.id
      WHERE t.id = approval_conversations.trip_id
      AND te.school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Approval Delegations
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view delegations involving them"
  ON approval_delegations FOR SELECT
  USING (
    delegated_from = auth.uid() OR delegated_to = auth.uid()
  );

CREATE POLICY "Users can create delegations from themselves"
  ON approval_delegations FOR INSERT
  WITH CHECK (
    delegated_from = auth.uid()
  );

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

CREATE TRIGGER audit_approval_chains
  AFTER INSERT OR UPDATE OR DELETE ON approval_chains
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_approval_chain_steps
  AFTER INSERT OR UPDATE OR DELETE ON approval_chain_steps
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_trip_approval_routing
  AFTER INSERT OR UPDATE OR DELETE ON trip_approval_routing
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_approval_conversations
  AFTER INSERT OR UPDATE OR DELETE ON approval_conversations
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_approval_delegations
  AFTER INSERT OR UPDATE OR DELETE ON approval_delegations
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Update updated_at timestamp on approval_chains
CREATE OR REPLACE FUNCTION update_approval_chains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_approval_chains_timestamp
  BEFORE UPDATE ON approval_chains
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_chains_updated_at();

-- Update updated_at timestamp on trip_approval_routing
CREATE TRIGGER update_trip_approval_routing_timestamp
  BEFORE UPDATE ON trip_approval_routing
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_chains_updated_at();

