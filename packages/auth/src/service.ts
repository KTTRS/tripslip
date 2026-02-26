import type { SupabaseClient, User, Session } from '@tripslip/database';

/**
 * Authentication service interface for TripSlip platform
 * Supports multiple authentication patterns:
 * - Required auth (venues)
 * - Optional auth with magic links (teachers, parents)
 * - Direct link access (teachers)
 */
export interface AuthService {
  // Venue authentication (required)
  signInWithPassword(email: string, password: string): Promise<{ user: User; session: Session }>;
  
  // Teacher/Parent authentication (optional)
  signInWithOtp(email: string): Promise<void>;
  verifyOtp(email: string, token: string): Promise<{ user: User; session: Session }>;
  
  // Direct link authentication (teachers)
  verifyDirectLink(token: string): Promise<{ tripId: string; data: any }>;
  
  // Magic link authentication (parents)
  verifyMagicLink(token: string): Promise<{ slipId: string; data: any }>;
  
  // Session management
  getSession(): Promise<Session | null>;
  getUser(): Promise<User | null>;
  signOut(): Promise<void>;
  refreshSession(): Promise<Session>;
  
  // Account creation
  signUp(email: string, password: string): Promise<{ user: User; session: Session }>;
}

/**
 * Implementation of AuthService using Supabase
 */
export class SupabaseAuthService implements AuthService {
  constructor(private supabase: SupabaseClient) {}

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Authentication failed');
    }

    return { user: data.user, session: data.session };
  }

  async signInWithOtp(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) throw error;
  }

  async verifyOtp(email: string, token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('OTP verification failed');
    }

    return { user: data.user, session: data.session };
  }

  async verifyDirectLink(token: string) {
    // Query trips table with direct_link_token
    const { data, error } = await (this.supabase as any)
      .from('trips')
      .select('id, *')
      .eq('direct_link_token', token)
      .single();

    if (error) throw new Error('Invalid or expired direct link');
    if (!data) throw new Error('Trip not found');

    return { tripId: data.id, data };
  }

  async verifyMagicLink(token: string) {
    // Query permission_slips table with magic_link_token
    const { data, error } = await (this.supabase as any)
      .from('permission_slips')
      .select('id, *')
      .eq('magic_link_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (error) throw new Error('Invalid or expired magic link');
    if (!data) throw new Error('Permission slip not found');

    return { slipId: data.id, data };
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();
    if (error) throw error;
    if (!data.session) throw new Error('Failed to refresh session');
    return data.session;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Sign up failed');
    }

    return { user: data.user, session: data.session };
  }
}

/**
 * Factory function to create an AuthService instance
 */
export function createAuthService(supabase: SupabaseClient): AuthService {
  return new SupabaseAuthService(supabase);
}
