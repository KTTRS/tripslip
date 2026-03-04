-- Migration: Add Phone Verification
-- Description: Add phone verification system for SMS opt-in
-- Date: 2024-03-06

-- Create phone verification table
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_phone_verifications_user_id ON phone_verifications(user_id);
CREATE INDEX idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX idx_phone_verifications_code ON phone_verifications(verification_code);
CREATE INDEX idx_phone_verifications_expires ON phone_verifications(expires_at);

-- Add RLS policies
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own verifications
CREATE POLICY "Users can view own phone verifications" ON phone_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phone verifications" ON phone_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone verifications" ON phone_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Add verified phone numbers to user profiles
ALTER TABLE profiles 
ADD COLUMN verified_phone VARCHAR(20),
ADD COLUMN phone_verified_at TIMESTAMPTZ,
ADD COLUMN sms_opt_in BOOLEAN DEFAULT FALSE;

-- Create index for verified phone lookups
CREATE INDEX idx_profiles_verified_phone ON profiles(verified_phone);

-- Add comments
COMMENT ON TABLE phone_verifications IS 'Phone number verification codes for SMS opt-in';
COMMENT ON COLUMN phone_verifications.verification_code IS '6-digit verification code';
COMMENT ON COLUMN phone_verifications.attempts IS 'Number of verification attempts';
COMMENT ON COLUMN phone_verifications.expires_at IS 'When verification code expires (15 minutes)';

COMMENT ON COLUMN profiles.verified_phone IS 'Phone number that has been verified';
COMMENT ON COLUMN profiles.phone_verified_at IS 'When phone was verified';
COMMENT ON COLUMN profiles.sms_opt_in IS 'User has opted in to SMS notifications';