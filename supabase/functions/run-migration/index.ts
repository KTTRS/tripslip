import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    { db: { schema: "public" } }
  );

  const migrations = [
    `ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false`,
    `ALTER TABLE trips ADD COLUMN IF NOT EXISTS funding_model TEXT DEFAULT 'parent_pay'`,
    `ALTER TABLE trips ADD COLUMN IF NOT EXISTS assistance_fund_cents INTEGER DEFAULT 0`,
    `ALTER TABLE trips ADD COLUMN IF NOT EXISTS configured_addons JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE permission_slips ADD COLUMN IF NOT EXISTS financial_assistance_requested BOOLEAN DEFAULT false`,
    `ALTER TABLE permission_slips ADD COLUMN IF NOT EXISTS assistance_amount_covered INTEGER DEFAULT 0`,
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'platform'`,
    `CREATE TABLE IF NOT EXISTS trip_forms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      form_type TEXT NOT NULL DEFAULT 'custom',
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      file_url TEXT NOT NULL,
      required BOOLEAN DEFAULT false,
      source TEXT DEFAULT 'uploaded',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
     VALUES ('trip-forms', 'trip-forms', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
     ON CONFLICT (id) DO NOTHING`,
  ];

  const results = [];
  for (const sql of migrations) {
    try {
      const { data, error } = await supabaseAdmin.rpc("exec_sql", { sql_query: sql });
      if (error) {
        results.push({ sql: sql.substring(0, 60), status: "rpc_error", error: error.message });
      } else {
        results.push({ sql: sql.substring(0, 60), status: "ok" });
      }
    } catch (e) {
      results.push({ sql: sql.substring(0, 60), status: "exception", error: e.message });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
