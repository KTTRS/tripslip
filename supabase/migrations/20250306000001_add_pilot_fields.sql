ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS funding_model TEXT DEFAULT 'parent_pay';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS assistance_fund_cents INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS configured_addons JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS transportation JSONB;

ALTER TABLE permission_slips ADD COLUMN IF NOT EXISTS financial_assistance_requested BOOLEAN DEFAULT false;
ALTER TABLE permission_slips ADD COLUMN IF NOT EXISTS assistance_amount_covered INTEGER DEFAULT 0;

ALTER TABLE venues ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'platform';

CREATE TABLE IF NOT EXISTS trip_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  required BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'uploaded',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trip-forms', 'trip-forms', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
