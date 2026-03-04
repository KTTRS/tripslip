import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RETENTION_PERIOD_DAYS = 7 * 365; // 7 years

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_PERIOD_DAYS);

    // Delete old audit logs
    const { data: deletedLogs, error: logsError } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (logsError) throw logsError;

    // Log the cleanup action
    await supabase.from('audit_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      action: 'DATA_CLEANUP',
      resource_type: 'audit_logs',
      metadata: {
        deleted_count: deletedLogs?.length || 0,
        cutoff_date: cutoffDate.toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedLogs?.length || 0,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
