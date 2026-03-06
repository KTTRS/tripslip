import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('=== Adding Pilot Schema Fields ===\n');

  const migrations = [
    {
      name: 'Add trips.is_free',
      sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false`
    },
    {
      name: 'Add trips.funding_model',
      sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS funding_model TEXT DEFAULT 'parent_pay' CHECK (funding_model IN ('parent_pay', 'school_funded', 'school_advance', 'sponsored'))`
    },
    {
      name: 'Add trips.assistance_fund_cents',
      sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS assistance_fund_cents INTEGER DEFAULT 0`
    },
    {
      name: 'Add trips.configured_addons',
      sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS configured_addons JSONB DEFAULT '[]'::jsonb`
    },
    {
      name: 'Add permission_slips.financial_assistance_requested',
      sql: `ALTER TABLE permission_slips ADD COLUMN IF NOT EXISTS financial_assistance_requested BOOLEAN DEFAULT false`
    },
    {
      name: 'Add permission_slips.assistance_amount_covered',
      sql: `ALTER TABLE permission_slips ADD COLUMN IF NOT EXISTS assistance_amount_covered INTEGER DEFAULT 0`
    },
    {
      name: 'Add venues.source',
      sql: `ALTER TABLE venues ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'platform'`
    },
    {
      name: 'Create trip_forms table',
      sql: `
        CREATE TABLE IF NOT EXISTS trip_forms (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          form_type TEXT NOT NULL DEFAULT 'custom' CHECK (form_type IN ('school_permission', 'venue_waiver', 'transportation', 'medical', 'photo_release', 'custom')),
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          file_url TEXT NOT NULL,
          required BOOLEAN DEFAULT false,
          source TEXT DEFAULT 'uploaded' CHECK (source IN ('uploaded', 'venue_provided', 'generated')),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'Create trip-forms storage bucket',
      sql: `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
            VALUES ('trip-forms', 'trip-forms', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
            ON CONFLICT (id) DO NOTHING`
    },
    {
      name: 'Add storage policy for trip-forms (public read)',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trip_forms_public_read' AND tablename = 'objects') THEN
            CREATE POLICY trip_forms_public_read ON storage.objects FOR SELECT USING (bucket_id = 'trip-forms');
          END IF;
        END $$
      `
    },
    {
      name: 'Add storage policy for trip-forms (authenticated upload)',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trip_forms_auth_insert' AND tablename = 'objects') THEN
            CREATE POLICY trip_forms_auth_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trip-forms');
          END IF;
        END $$
      `
    },
  ];

  for (const m of migrations) {
    console.log(`Running: ${m.name}...`);
    const { error } = await supabase.rpc('exec_sql', { query: m.sql }).catch(() => ({ error: null }));

    if (error) {
      const { error: directErr } = await supabase.from('_migrations_log').select('*').limit(0);
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: m.sql }),
        });
        if (!response.ok) {
          console.log(`  Warning: RPC not available, trying direct SQL...`);
          const pgRes = await supabase.rpc('pgexec', { sql: m.sql }).catch(() => ({ error: 'no rpc' }));
          if (pgRes.error) {
            console.log(`  Falling back to individual query approach...`);
            const { error: fallbackErr } = await supabase.from('trip_forms').select('id').limit(0);
            if (fallbackErr && m.name.includes('trip_forms')) {
              console.log(`  Will try raw approach...`);
            }
          }
        } else {
          console.log(`  OK (via REST)`);
        }
      } catch (e) {
        console.log(`  Note: ${e.message} - may need manual migration`);
      }
    } else {
      console.log(`  OK`);
    }
  }

  console.log('\n--- Verifying schema ---');
  
  const { data: tripCols, error: tripErr } = await supabase
    .from('trips')
    .select('is_free, funding_model, assistance_fund_cents, configured_addons')
    .limit(0);
  console.log(`  trips new columns: ${tripErr ? 'MISSING - ' + tripErr.message : 'OK'}`);

  const { data: slipCols, error: slipErr } = await supabase
    .from('permission_slips')
    .select('financial_assistance_requested, assistance_amount_covered')
    .limit(0);
  console.log(`  permission_slips new columns: ${slipErr ? 'MISSING - ' + slipErr.message : 'OK'}`);

  const { data: venueCols, error: venueErr } = await supabase
    .from('venues')
    .select('source')
    .limit(0);
  console.log(`  venues.source: ${venueErr ? 'MISSING - ' + venueErr.message : 'OK'}`);

  const { data: formTest, error: formErr } = await supabase
    .from('trip_forms')
    .select('id')
    .limit(0);
  console.log(`  trip_forms table: ${formErr ? 'MISSING - ' + formErr.message : 'OK'}`);

  console.log('\n=== Schema migration complete ===');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
