import { createSupabaseClient } from '@tripslip/database';
import { createAuthService } from '@tripslip/auth';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  'sb-tripslip-parent-auth'
);

export const authService = createAuthService(supabase);
