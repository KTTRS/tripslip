import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSupabaseClient } from '@tripslip/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Smoke Test: Authentication Flow
 * Tests: Login → Session validation → Logout
 * 
 * This test verifies the critical authentication path works end-to-end.
 * Uses real database connections but test environment.
 */

describe('Smoke Test - Authentication Flow', () => {
  let supabase: SupabaseClient;
  const testEmail = process.env.TEST_USER_EMAIL || 'test@tripslip.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  beforeAll(() => {
    // Verify test environment variables
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    }

    supabase = createSupabaseClient();
  });

  afterAll(async () => {
    // Cleanup: Sign out after tests
    await supabase.auth.signOut();
  });

  it('should successfully sign in with valid credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe(testEmail);
    expect(data.session).toBeDefined();
    expect(data.session?.access_token).toBeDefined();
  }, 10000);

  it('should retrieve valid session after login', async () => {
    const { data, error } = await supabase.auth.getSession();

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.session?.user).toBeDefined();
    expect(data.session?.user.email).toBe(testEmail);
    expect(data.session?.expires_at).toBeGreaterThan(Date.now() / 1000);
  }, 5000);

  it('should retrieve current user', async () => {
    const { data, error } = await supabase.auth.getUser();

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
    expect(data.user.id).toBeDefined();
  }, 5000);

  it('should successfully sign out', async () => {
    const { error } = await supabase.auth.signOut();

    expect(error).toBeNull();

    // Verify session is cleared
    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeNull();
  }, 5000);

  it('should fail to sign in with invalid credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'WrongPassword123!',
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('Invalid');
    expect(data.user).toBeNull();
    expect(data.session).toBeNull();
  }, 10000);
});
