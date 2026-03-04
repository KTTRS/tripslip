-- Migration: Add Currency Support
-- Description: Add currency fields to venues and experiences tables for multi-currency support
-- Date: 2024-03-06

-- Add currency column to venues table
ALTER TABLE venues
ADD COLUMN currency VARCHAR(3) DEFAULT 'usd' NOT NULL;

-- Add comment
COMMENT ON COLUMN venues.currency IS 'ISO 4217 currency code (e.g., usd, eur, gbp, cad)';

-- Add currency column to experiences table
ALTER TABLE experiences
ADD COLUMN currency VARCHAR(3) DEFAULT 'usd' NOT NULL;

-- Add comment
COMMENT ON COLUMN experiences.currency IS 'ISO 4217 currency code (e.g., usd, eur, gbp, cad)';

-- Create index for currency filtering
CREATE INDEX idx_venues_currency ON venues(currency);
CREATE INDEX idx_experiences_currency ON experiences(currency);

-- Add check constraint to ensure valid currency codes (common ones)
ALTER TABLE venues
ADD CONSTRAINT venues_currency_check 
CHECK (currency IN ('usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'cny', 'inr', 'mxn', 'brl'));

ALTER TABLE experiences
ADD CONSTRAINT experiences_currency_check 
CHECK (currency IN ('usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'cny', 'inr', 'mxn', 'brl'));

-- Update existing records to have default currency
UPDATE venues SET currency = 'usd' WHERE currency IS NULL;
UPDATE experiences SET currency = 'usd' WHERE currency IS NULL;
