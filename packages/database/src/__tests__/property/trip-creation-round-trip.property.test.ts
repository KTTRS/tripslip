/**
 * Property-Based Tests - Trip Creation Round Trip (Task 4.2)
 * 
 * Tests Property 15: Trip Creation Round Trip
 * For any valid trip data (name, date, venue, experience), if we create a trip 
 * and then retrieve it from the database, the retrieved trip should match the 
 * original data.
 * 
 * **Validates: Requirements 5.1**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use service role key for tests to bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Trip Creation Round Trip (Task 4.2)', () => {
  let supabase: SupabaseClient;
  let testTeacherId: string;
  let testVenueId: string;
  let testExperienceId: string;
  const testTripIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    testTeacherId = crypto.randomUUID();

    // Create test teacher (required for trips)
    await supabase
      .from('teachers')
      .insert({
        id: testTeacherId,
        first_name: 'Test',
        last_name: 'Teacher',
        email: `test${Date.now()}@teacher.com`,
        independent: true,
      });

    // Create test venue
    const { data: venue } = await supabase
      .from('venues')
      .insert({
        name: `Test Venue ${Date.now()}`,
        description: 'Test venue for trip tests',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
        contact_email: `test${Date.now()}@venue.com`,
        contact_phone: '555-0100',
      })
      .select()
      .single();

    testVenueId = venue!.id;

    // Create test experience
    const { data: experience } = await supabase
      .from('experiences')
      .insert({
        venue_id: testVenueId,
        title: `Test Experience ${Date.now()}`,
        description: 'Test experience for trip tests',
        duration_minutes: 120,
        capacity: 50,
        min_students: 10,
        max_students: 50,
        active: true,
        published: true,
      })
      .select()
      .single();

    testExperienceId = experience!.id;
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    if (testTripIds.length > 0) {
      await supabase.from('trips').delete().in('id', testTripIds);
      testTripIds.length = 0;
    }

    // Clean up test infrastructure
    if (testExperienceId) {
      await supabase.from('experiences').delete().eq('id', testExperienceId);
    }
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }
    if (testTeacherId) {
      await supabase.from('teachers').delete().eq('id', testTeacherId);
    }
  });

  /**
   * Property 15: Trip Creation Round Trip
   * 
   * For any valid trip data (date, experience, teacher, student count), creating 
   * a trip then retrieving it should return equivalent data with all required 
   * fields preserved.
   * 
   * This property ensures data consistency in the trip creation and retrieval flow.
   */
  it('Property 15: Trip creation round trip preserves all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate trip date (at least 14 days in future per requirement 5.1)
        fc.integer({ min: 14, max: 365 }),
        // Generate student count (between min and max for experience)
        fc.integer({ min: 10, max: 50 }),
        // Generate trip time (optional)
        fc.option(fc.record({
          hours: fc.integer({ min: 0, max: 23 }),
          minutes: fc.integer({ min: 0, max: 59 })
        })),
        // Generate status
        fc.constantFrom('pending', 'confirmed'),
        // Generate transportation data (optional)
        fc.option(fc.record({
          type: fc.constantFrom('bus', 'walking', 'parent_drop_off'),
          details: fc.string({ minLength: 0, maxLength: 200 })
        })),
        async (daysInFuture, studentCount, tripTimeData, status, transportation) => {
          // Calculate trip date
          const tripDate = new Date();
          tripDate.setDate(tripDate.getDate() + daysInFuture);
          const tripDateString = tripDate.toISOString().split('T')[0];

          // Format trip time if provided
          const tripTime = tripTimeData 
            ? `${String(tripTimeData.hours).padStart(2, '0')}:${String(tripTimeData.minutes).padStart(2, '0')}:00`
            : null;

          // Create trip record
          const { data: createdTrip, error: createError } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: tripDateString,
              trip_time: tripTime,
              student_count: studentCount,
              status: status,
              transportation: transportation || {}
            })
            .select()
            .single();

          if (createError || !createdTrip) {
            throw new Error(`Failed to create trip: ${createError?.message}`);
          }
          testTripIds.push(createdTrip.id);

          // Retrieve the trip record
          const { data: retrievedTrip, error: retrieveError } = await supabase
            .from('trips')
            .select('*')
            .eq('id', createdTrip.id)
            .single();

          if (retrieveError || !retrievedTrip) {
            throw new Error(`Failed to retrieve trip: ${retrieveError?.message}`);
          }

          // Verify round-trip consistency
          expect(retrievedTrip.id).toBe(createdTrip.id);
          expect(retrievedTrip.experience_id).toBe(testExperienceId);
          expect(retrievedTrip.teacher_id).toBe(testTeacherId);
          expect(retrievedTrip.trip_date).toBe(tripDateString);
          expect(retrievedTrip.trip_time).toBe(tripTime);
          expect(retrievedTrip.student_count).toBe(studentCount);
          expect(retrievedTrip.status).toBe(status);
          
          // Verify transportation data
          if (transportation) {
            expect(retrievedTrip.transportation).toEqual(transportation);
          } else {
            expect(retrievedTrip.transportation).toEqual({});
          }

          // Verify timestamps exist
          expect(retrievedTrip.created_at).toBeTruthy();
          expect(retrievedTrip.updated_at).toBeTruthy();
        }
      ),
      { numRuns: 10 } // Reduced runs for database operations
    );
  }, 120000); // 2 minute timeout for database operations

  /**
   * Property 15 (Edge Case): Trip date must be at least 2 weeks in future
   * 
   * Per requirement 5.1, trips must be created with dates at least 2 weeks 
   * in the future. This test verifies the validation logic.
   */
  it('Property 15 (Edge Case): Accepts trip dates at least 14 days in future', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates exactly 14 days or more in future
        fc.integer({ min: 14, max: 30 }),
        async (daysInFuture) => {
          const tripDate = new Date();
          tripDate.setDate(tripDate.getDate() + daysInFuture);
          const tripDateString = tripDate.toISOString().split('T')[0];

          // Create trip with valid future date
          const { data: trip, error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: tripDateString,
              student_count: 20,
              status: 'pending'
            })
            .select()
            .single();

          // Should succeed
          expect(error).toBeNull();
          expect(trip).toBeTruthy();
          expect(trip?.trip_date).toBe(tripDateString);

          if (trip) {
            testTripIds.push(trip.id);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 15 (Edge Case): Student count must be non-negative
   * 
   * The database has a CHECK constraint that student_count >= 0.
   * This test verifies that negative student counts are rejected.
   */
  it('Property 15 (Edge Case): Rejects negative student counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate negative student counts
        fc.integer({ min: -100, max: -1 }),
        async (negativeCount) => {
          const tripDate = new Date();
          tripDate.setDate(tripDate.getDate() + 30);
          const tripDateString = tripDate.toISOString().split('T')[0];

          // Attempt to create trip with negative student count
          const { error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: tripDateString,
              student_count: negativeCount,
              status: 'pending'
            });

          // Should fail due to CHECK constraint
          expect(error).toBeTruthy();
          expect(error?.message).toMatch(/check constraint|violates check/i);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 15 (Edge Case): Status must be valid
   * 
   * The database has a CHECK constraint that status must be one of:
   * 'pending', 'confirmed', 'cancelled', 'completed'
   */
  it('Property 15 (Edge Case): Rejects invalid status values', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate invalid status values
        fc.string({ minLength: 1, maxLength: 20 }).filter(
          s => !['pending', 'confirmed', 'cancelled', 'completed'].includes(s)
        ),
        async (invalidStatus) => {
          const tripDate = new Date();
          tripDate.setDate(tripDate.getDate() + 30);
          const tripDateString = tripDate.toISOString().split('T')[0];

          // Attempt to create trip with invalid status
          const { error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: tripDateString,
              student_count: 20,
              status: invalidStatus
            });

          // Should fail due to CHECK constraint
          expect(error).toBeTruthy();
          expect(error?.message).toMatch(/check constraint|violates check|invalid input value/i);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 15 (Consistency): Multiple retrievals return identical data
   * 
   * Retrieving the same trip record multiple times should always
   * return identical data, demonstrating read consistency.
   */
  it('Property 15 (Consistency): Multiple retrievals return identical trip data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 14, max: 365 }),
        fc.integer({ min: 10, max: 50 }),
        async (daysInFuture, studentCount) => {
          const tripDate = new Date();
          tripDate.setDate(tripDate.getDate() + daysInFuture);
          const tripDateString = tripDate.toISOString().split('T')[0];

          // Create trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: tripDateString,
              student_count: studentCount,
              status: 'pending'
            })
            .select()
            .single();

          if (!trip) throw new Error('Failed to create trip');
          testTripIds.push(trip.id);

          // Retrieve trip multiple times
          const { data: retrieval1 } = await supabase
            .from('trips')
            .select('*')
            .eq('id', trip.id)
            .single();

          const { data: retrieval2 } = await supabase
            .from('trips')
            .select('*')
            .eq('id', trip.id)
            .single();

          const { data: retrieval3 } = await supabase
            .from('trips')
            .select('*')
            .eq('id', trip.id)
            .single();

          // All retrievals should return identical data
          expect(retrieval1).toEqual(retrieval2);
          expect(retrieval2).toEqual(retrieval3);
          expect(retrieval1?.trip_date).toBe(tripDateString);
          expect(retrieval1?.student_count).toBe(studentCount);
          expect(retrieval1?.experience_id).toBe(testExperienceId);
          expect(retrieval1?.teacher_id).toBe(testTeacherId);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 15 (Idempotency): Creating identical trips produces distinct records
   * 
   * Creating multiple trips with the same data should produce distinct records
   * with unique IDs, as there's no uniqueness constraint on trip data.
   */
  it('Property 15 (Idempotency): Creating identical trips produces distinct records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 14, max: 365 }),
        fc.integer({ min: 10, max: 50 }),
        async (daysInFuture, studentCount) => {
          const tripDate = new Date();
          tripDate.setDate(tripDate.getDate() + daysInFuture);
          const tripDateString = tripDate.toISOString().split('T')[0];

          const tripData = {
            experience_id: testExperienceId,
            teacher_id: testTeacherId,
            trip_date: tripDateString,
            student_count: studentCount,
            status: 'pending' as const
          };

          // Create first trip
          const { data: trip1 } = await supabase
            .from('trips')
            .insert(tripData)
            .select()
            .single();

          if (!trip1) throw new Error('Failed to create first trip');
          testTripIds.push(trip1.id);

          // Create second trip with identical data
          const { data: trip2 } = await supabase
            .from('trips')
            .insert(tripData)
            .select()
            .single();

          if (!trip2) throw new Error('Failed to create second trip');
          testTripIds.push(trip2.id);

          // Trips should have different IDs but same data
          expect(trip1.id).not.toBe(trip2.id);
          expect(trip1.experience_id).toBe(trip2.experience_id);
          expect(trip1.teacher_id).toBe(trip2.teacher_id);
          expect(trip1.trip_date).toBe(trip2.trip_date);
          expect(trip1.student_count).toBe(trip2.student_count);
          expect(trip1.status).toBe(trip2.status);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);
});
