// Supabase client utilities
export { createSupabaseClient } from './client';
export type { SupabaseClient } from './client';

// Database types
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './types';

// Re-export Supabase types for convenience
export type {
  User,
  Session,
  AuthError,
  AuthResponse,
  AuthTokenResponse,
} from '@supabase/supabase-js';
