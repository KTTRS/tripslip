-- Create payment and financial tables
-- Migration: 20240101000002_create_payments_and_refunds.sql

-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_slip_id UUID NOT NULL REFERENCES permission_slips(id) ON DELETE RESTRICT,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_fee_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  error_message TEXT,
  is_split_payment BOOLEAN NOT NULL DEFAULT false,
  split_payment_group_id UUID,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_cents > 0),
  CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'))
);

-- =====================================================
-- REFUNDS
-- =====================================================

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL,
  stripe_refund_id TEXT UNIQUE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_cents > 0),
  CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled'))
);

-- =====================================================
-- INDEXES FOR PAYMENTS AND REFUNDS
-- =====================================================

-- Payment indexes
CREATE INDEX idx_payments_slip ON payments(permission_slip_id);
CREATE INDEX idx_payments_parent ON payments(parent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_payments_split_group ON payments(split_payment_group_id) 
  WHERE split_payment_group_id IS NOT NULL;
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Refund indexes
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_stripe_refund ON refunds(stripe_refund_id) 
  WHERE stripe_refund_id IS NOT NULL;

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS FOR PAYMENTS
-- =====================================================

-- Function to calculate total paid for a permission slip
CREATE OR REPLACE FUNCTION get_slip_total_paid(slip_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount_cents), 0)::INTEGER
  FROM payments
  WHERE permission_slip_id = slip_id 
    AND status = 'succeeded';
$$ LANGUAGE sql STABLE;

-- Function to calculate total refunded for a payment
CREATE OR REPLACE FUNCTION get_payment_total_refunded(payment_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount_cents), 0)::INTEGER
  FROM refunds
  WHERE payment_id = payment_id 
    AND status = 'succeeded';
$$ LANGUAGE sql STABLE;

-- Function to check if split payment group is complete
CREATE OR REPLACE FUNCTION is_split_payment_complete(group_id UUID, expected_total_cents INTEGER)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(SUM(amount_cents), 0) >= expected_total_cents
  FROM payments
  WHERE split_payment_group_id = group_id 
    AND status = 'succeeded';
$$ LANGUAGE sql STABLE;
