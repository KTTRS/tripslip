import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    // Fetch all user data
    const [permissionSlips, payments, documents] = await Promise.all([
      supabase.from('permission_slips').select('*').eq('parent_id', userId),
      supabase.from('payments').select('*').eq('user_id', userId),
      supabase.from('documents').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      user_id: userId,
      exported_at: new Date().toISOString(),
      permission_slips: permissionSlips.data || [],
      payments: payments.data || [],
      documents: documents.data || [],
    };

    return new Response(JSON.stringify(exportData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
