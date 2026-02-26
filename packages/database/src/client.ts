import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Creates a Supabase client instance with TypeScript types
 * 
 * @param supabaseUrl - The Supabase project URL (from VITE_SUPABASE_URL)
 * @param supabaseAnonKey - The Supabase anonymous key (from VITE_SUPABASE_ANON_KEY)
 * @returns Typed Supabase client instance
 * 
 * @example
 * ```ts
 * const supabase = createSupabaseClient(
 *   import.meta.env.VITE_SUPABASE_URL,
 *   import.meta.env.VITE_SUPABASE_ANON_KEY
 * );
 * 
 * // Type-safe queries
 * const { data, error } = await supabase
 *   .from('experiences')
 *   .select('*')
 *   .eq('id', experienceId);
 * ```
 */
export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase URL and Anon Key are required. ' +
      'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Type alias for the Supabase client
 */
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
