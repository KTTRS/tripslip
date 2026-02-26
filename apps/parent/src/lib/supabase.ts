import { createSupabaseClient } from '@tripslip/database';
import { createAuthService } from '@tripslip/auth';

// Create Supabase client
export const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Create auth service
export const authService = createAuthService(supabase);
