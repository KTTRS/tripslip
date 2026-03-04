import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSupabaseClient } from '@tripslip/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Smoke Test: Trip Creation Flow
 * Tests: Venue search → Experience selection → Trip creation
 * 
 * This test verifies the critical trip creation path works end-to-end.
 * Uses real database connections but test environment.
 */

describe('Smoke Test - Trip Creation Flow', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testVenueId: string;
  let testExperienceId: string;
  let createdTripId: string;

  beforeAll(async () => {
    // Verify test environment variables
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    }

    supabase = createSupabaseClient();

    // Sign in as test teacher
    const testEmail = process.env.TEST_TEACHER_EMAIL || 'teacher@tripslip.com';
    const testPassword = process.env.TEST_TEACHER_PASSWORD || 'TestPassword123!';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error || !data.user) {
      throw new Error(`Failed to sign in test teacher: ${error?.message}`);
    }

    testUserId = data.user.id;
  });

  afterAll(async () => {
    // Cleanup: Delete created trip if exists
    if (createdTripId) {
      await supabase.from('trips').delete().eq('id', createdTripId);
    }

    // Sign out
    await supabase.auth.signOut();
  });

  it('should search and find venues', async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, description, city, state')
      .eq('status', 'active')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data!.length).toBeGreaterThan(0);

    // Store first venue for next test
    testVenueId = data![0].id;
    expect(testVenueId).toBeDefined();
  }, 10000);

  it('should retrieve experiences for selected venue', async () => {
    expect(testVenueId).toBeDefined();

    const { data, error } = await supabase
      .from('experiences')
      .select('id, title, description, duration_minutes, base_price_cents, capacity_min, capacity_max')
      .eq('venue_id', testVenueId)
      .eq('status', 'active')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data!.length).toBeGreaterThan(0);

    // Validate experience structure
    const experience = data![0];
    expect(experience.id).toBeDefined();
    expect(experience.title).toBeDefined();
    expect(experience.duration_minutes).toBeGreaterThan(0);
    expect(experience.base_price_cents).toBeGreaterThanOrEqual(0);

    // Store first experience for next test
    testExperienceId = experience.id;
  }, 10000);

  it('should create a new trip with selected experience', async () => {
    expect(testExperienceId).toBeDefined();
    expect(testUserId).toBeDefined();

    const tripDate = new Date();
    tripDate.setDate(tripDate.getDate() + 30); // 30 days from now

    const tripData = {
      teacher_id: testUserId,
      experience_id: testExperienceId,
      title: `Smoke Test Trip - ${Date.now()}`,
      trip_date: tripDate.toISOString(),
      estimated_students: 25,
      estimated_cost_cents: 2500,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBeDefined();
    expect(data!.title).toBe(tripData.title);
    expect(data!.status).toBe('draft');
    expect(data!.teacher_id).toBe(testUserId);
    expect(data!.experience_id).toBe(testExperienceId);

    // Store created trip ID for cleanup
    createdTripId = data!.id;
  }, 10000);

  it('should retrieve created trip', async () => {
    expect(createdTripId).toBeDefined();

    const { data, error } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        trip_date,
        status,
        estimated_students,
        estimated_cost_cents,
        experience:experiences (
          id,
          title,
          venue:venues (
            id,
            name
          )
        )
      `)
      .eq('id', createdTripId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBe(createdTripId);
    expect(data!.experience).toBeDefined();
    expect(data!.experience.venue).toBeDefined();
  }, 10000);

  it('should update trip status', async () => {
    expect(createdTripId).toBeDefined();

    const { data, error } = await supabase
      .from('trips')
      .update({ 
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdTripId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.status).toBe('pending_approval');
  }, 10000);
});
