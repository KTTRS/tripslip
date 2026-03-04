-- Add Stripe Connect fields to venues table
-- This migration adds the necessary fields for Stripe Connect integration

-- Add Stripe Connect account fields to venues table
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pending' CHECK (stripe_account_status IN ('pending', 'active', 'inactive', 'incomplete'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_venues_stripe_account_id ON venues(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_venues_stripe_account_status ON venues(stripe_account_status);

-- Add comments for documentation
COMMENT ON COLUMN venues.stripe_account_id IS 'Stripe Connect account ID for this venue';
COMMENT ON COLUMN venues.stripe_account_status IS 'Status of the Stripe Connect account: pending, active, inactive, incomplete';

-- Update RLS policies to ensure venue users can only access their own Stripe data
-- The existing RLS policies should already handle this, but let's be explicit

-- Create a policy for venue users to update their own Stripe account info
CREATE POLICY "Venue users can update their own Stripe account info" ON venues
FOR UPDATE USING (
  id IN (
    SELECT venue_id 
    FROM venue_users 
    WHERE user_id = auth.uid()
  )
);

-- Ensure venue users can read their own Stripe account info
-- This should already be covered by existing policies, but let's be explicit
CREATE POLICY "Venue users can read their own Stripe account info" ON venues
FOR SELECT USING (
  id IN (
    SELECT venue_id 
    FROM venue_users 
    WHERE user_id = auth.uid()
  )
);