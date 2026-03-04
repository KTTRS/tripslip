/**
 * Property-Based Tests - Availability Real-Time Update (Task 6.4)
 * 
 * Tests Property 21: Availability Real-Time Update
 * For any experience availability update, searches performed immediately after 
 * the update should reflect the new availability.
 * 
 * **Validates: Requirements 6.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use service role key for tests to bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Availability Real-Time Update (Task 6.4)', () => {
  let supabase: SupabaseClient;
  const testVenueIds: string[] = [];
  const testExperienceIds: string[] = [];
  const testAvailabilityIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    if (testAvailabilityIds.length > 0) {
      await supabase.from('availability').delete().in('id', testAvailabilityIds);
      testAvailabilityIds.length = 0;
    }

    if (testExperienceIds.length > 0) {
      await supabase.from('experiences').delete().in('id', testExperienceIds);
      testExperienceIds.length = 0;
    }

    if (testVenueIds.length > 0) {
      await supabase.from('venues').delete().in('id', testVenueIds);
      testVenueIds.length = 0;
    }
  });

  // Helper function to create a test experience for each property test
  async function createTestExperience(): Promise<string> {
    // Create test venue
    const { data: venue } = await supabase
      .from('venues')
      .insert({
        name: `Test Venue ${Date.now()}-${Math.random()}`,
        description: 'Test venue for availability tests',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
        contact_email: `test${Date.now()}-${Math.random()}@venue.com`,
        contact_phone: '555-0100',
      })
      .select()
      .single();

    testVenueIds.push(venue!.id);

    // Create test experience
    const { data: experience } = await supabase
      .from('experiences')
      .insert({
        venue_id: venue!.id,
        title: `Test Experience ${Date.now()}-${Math.random()}`,
        description: 'Test experience for availability tests',
        duration_minutes: 120,
        capacity: 50,
        min_students: 10,
        max_students: 50,
        published: true,
        active: true,
      })
      .select()
      .single();

    testExperienceIds.push(experience!.id);
    return experience!.id;
  }

  /**
   * Property 21: Availability Real-Time Update
   * 
   * For any experience availability update (adding a date, updating capacity, 
   * removing a date), searches performed immediately after the update should 
   * reflect the new availability.
   * 
   * This property ensures that availability changes are immediately visible
   * to teachers searching for experiences.
   */
  it('Property 21: Availability updates are immediately queryable after creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate future date (1-90 days from now)
        fc.integer({ min: 1, max: 90 }),
        // Generate capacity
        fc.integer({ min: 1, max: 200 }),
        // Generate booked count (less than capacity)
        fc.integer({ min: 0, max: 50 }),
        async (daysFromNow, capacity, bookedCountRaw) => {
          // Create a unique experience for this test run
          const testExperienceId = await createTestExperience();

          // Ensure booked_count <= capacity
          const bookedCount = Math.min(bookedCountRaw, capacity - 1);

          // Calculate future date
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + daysFromNow);
          const dateString = futureDate.toISOString().split('T')[0];

          // Create availability record
          const { data: created, error: createError } = await supabase
            .from('availability')
            .insert({
              experience_id: testExperienceId,
              available_date: dateString,
              capacity: capacity,
              booked_count: bookedCount,
            })
            .select()
            .single();

          if (createError || !created) {
            throw new Error(`Failed to create availability: ${createError?.message}`);
          }
          testAvailabilityIds.push(created.id);

          // Immediately query for the availability record
          const { data: retrieved, error: retrieveError } = await supabase
            .from('availability')
            .select('*')
            .eq('id', created.id)
            .single();

          if (retrieveError || !retrieved) {
            throw new Error(`Failed to retrieve availability: ${retrieveError?.message}`);
          }

          // Verify real-time consistency - all fields should match
          expect(retrieved.id).toBe(created.id);
          expect(retrieved.experience_id).toBe(testExperienceId);
          expect(retrieved.available_date).toBe(dateString);
          expect(retrieved.capacity).toBe(capacity);
          expect(retrieved.booked_count).toBe(bookedCount);

          // Verify timestamps exist
          expect(retrieved.created_at).toBeTruthy();
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * Property 21: Capacity updates are immediately visible
   * 
   * When updating the capacity of an availability record, the new capacity
   * should be immediately queryable.
   */
  it('Property 21: Capacity updates are immediately reflected in queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial capacity
        fc.integer({ min: 10, max: 100 }),
        // Generate new capacity
        fc.integer({ min: 10, max: 100 }),
        async (initialCapacity, newCapacity) => {
          // Create a unique experience for this test run
          const testExperienceId = await createTestExperience();

          // Create availability record
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          const dateString = futureDate.toISOString().split('T')[0];

          const { data: created } = await supabase
            .from('availability')
            .insert({
              experience_id: testExperienceId,
              available_date: dateString,
              capacity: initialCapacity,
              booked_count: 0,
            })
            .select()
            .single();

          if (!created) throw new Error('Failed to create availability');
          testAvailabilityIds.push(created.id);

          // Update capacity
          const { error: updateError } = await supabase
            .from('availability')
            .update({ capacity: newCapacity })
            .eq('id', created.id);

          if (updateError) {
            throw new Error(`Failed to update capacity: ${updateError.message}`);
          }

          // Immediately query for the updated record
          const { data: retrieved } = await supabase
            .from('availability')
            .select('*')
            .eq('id', created.id)
            .single();

          if (!retrieved) throw new Error('Failed to retrieve updated availability');

          // Verify the capacity was updated in real-time
          expect(retrieved.capacity).toBe(newCapacity);
          expect(retrieved.id).toBe(created.id);
          expect(retrieved.experience_id).toBe(testExperienceId);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * Property 21: Booked count updates are immediately visible
   * 
   * When updating the booked_count (simulating a booking), the new count
   * should be immediately queryable.
   */
  it('Property 21: Booked count updates are immediately reflected in queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate capacity
        fc.integer({ min: 20, max: 100 }),
        // Generate initial booked count
        fc.integer({ min: 0, max: 10 }),
        // Generate additional bookings
        fc.integer({ min: 1, max: 10 }),
        async (capacity, initialBooked, additionalBookings) => {
          // Create a unique experience for this test run
          const testExperienceId = await createTestExperience();

          // Ensure we don't exceed capacity
          const safeInitialBooked = Math.min(initialBooked, capacity - additionalBookings);
          const newBookedCount = safeInitialBooked + additionalBookings;

          if (newBookedCount > capacity) return; // Skip if would exceed capacity

          // Create availability record
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const dateString = futureDate.toISOString().split('T')[0];

          const { data: created } = await supabase
            .from('availability')
            .insert({
              experience_id: testExperienceId,
              available_date: dateString,
              capacity: capacity,
              booked_count: safeInitialBooked,
            })
            .select()
            .single();

          if (!created) throw new Error('Failed to create availability');
          testAvailabilityIds.push(created.id);

          // Update booked count (simulating a booking)
          const { error: updateError } = await supabase
            .from('availability')
            .update({ booked_count: newBookedCount })
            .eq('id', created.id);

          if (updateError) {
            throw new Error(`Failed to update booked count: ${updateError.message}`);
          }

          // Immediately query for the updated record
          const { data: retrieved } = await supabase
            .from('availability')
            .select('*')
            .eq('id', created.id)
            .single();

          if (!retrieved) throw new Error('Failed to retrieve updated availability');

          // Verify the booked count was updated in real-time
          expect(retrieved.booked_count).toBe(newBookedCount);
          expect(retrieved.capacity).toBe(capacity);
          expect(retrieved.id).toBe(created.id);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * Property 21: Date removal is immediately reflected
   * 
   * When deleting an availability record, it should immediately become
   * unavailable in queries.
   */
  it('Property 21: Deleted availability dates are immediately unavailable in queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate capacity
        fc.integer({ min: 10, max: 100 }),
        async (capacity) => {
          // Create a unique experience for this test run
          const testExperienceId = await createTestExperience();

          // Create availability record
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 60);
          const dateString = futureDate.toISOString().split('T')[0];

          const { data: created } = await supabase
            .from('availability')
            .insert({
              experience_id: testExperienceId,
              available_date: dateString,
              capacity: capacity,
              booked_count: 0,
            })
            .select()
            .single();

          if (!created) throw new Error('Failed to create availability');
          const availabilityId = created.id;

          // Verify it exists
          const { data: beforeDelete } = await supabase
            .from('availability')
            .select('*')
            .eq('id', availabilityId)
            .single();

          expect(beforeDelete).toBeTruthy();
          expect(beforeDelete?.id).toBe(availabilityId);

          // Delete the availability record
          const { error: deleteError } = await supabase
            .from('availability')
            .delete()
            .eq('id', availabilityId);

          if (deleteError) {
            throw new Error(`Failed to delete availability: ${deleteError.message}`);
          }

          // Immediately query for the deleted record
          const { data: afterDelete, error: retrieveError } = await supabase
            .from('availability')
            .select('*')
            .eq('id', availabilityId)
            .single();

          // Verify the record is no longer available
          expect(afterDelete).toBeNull();
          expect(retrieveError).toBeTruthy();
          expect(retrieveError?.code).toBe('PGRST116'); // Not found error
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * Property 21: Multiple reads return consistent data
   * 
   * Reading the same availability record multiple times in quick succession
   * should return identical data, demonstrating read consistency.
   */
  it('Property 21: Multiple consecutive reads return identical availability data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate capacity and booked count
        fc.integer({ min: 20, max: 100 }),
        fc.integer({ min: 0, max: 50 }),
        async (capacity, bookedCountRaw) => {
          // Create a unique experience for this test run
          const testExperienceId = await createTestExperience();

          const bookedCount = Math.min(bookedCountRaw, capacity);

          // Create availability record
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 75);
          const dateString = futureDate.toISOString().split('T')[0];

          const { data: created } = await supabase
            .from('availability')
            .insert({
              experience_id: testExperienceId,
              available_date: dateString,
              capacity: capacity,
              booked_count: bookedCount,
            })
            .select()
            .single();

          if (!created) throw new Error('Failed to create availability');
          testAvailabilityIds.push(created.id);

          // Perform multiple reads in quick succession
          const { data: read1 } = await supabase
            .from('availability')
            .select('*')
            .eq('id', created.id)
            .single();

          const { data: read2 } = await supabase
            .from('availability')
            .select('*')
            .eq('id', created.id)
            .single();

          const { data: read3 } = await supabase
            .from('availability')
            .select('*')
            .eq('id', created.id)
            .single();

          // All reads should return identical data
          expect(read1).toEqual(read2);
          expect(read2).toEqual(read3);
          expect(read1?.capacity).toBe(capacity);
          expect(read1?.booked_count).toBe(bookedCount);
          expect(read1?.available_date).toBe(dateString);
          expect(read1?.experience_id).toBe(testExperienceId);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * Property 21: Experience-level queries reflect all availability updates
   * 
   * When querying all availability for an experience, the results should
   * immediately reflect any additions, updates, or deletions.
   */
  it('Property 21: Experience-level availability queries reflect all updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of dates to add (2-5)
        fc.integer({ min: 2, max: 5 }),
        async (dateCount) => {
          // Create a unique experience for this test run
          const testExperienceId = await createTestExperience();

          const createdIds: string[] = [];

          // Create multiple availability dates
          for (let i = 0; i < dateCount; i++) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (i + 1) * 10);
            const dateString = futureDate.toISOString().split('T')[0];

            const { data: created } = await supabase
              .from('availability')
              .insert({
                experience_id: testExperienceId,
                available_date: dateString,
                capacity: 30 + (i * 10),
                booked_count: 0,
              })
              .select()
              .single();

            if (!created) throw new Error('Failed to create availability');
            createdIds.push(created.id);
            testAvailabilityIds.push(created.id);
          }

          // Query all availability for the experience
          const { data: allAvailability } = await supabase
            .from('availability')
            .select('*')
            .eq('experience_id', testExperienceId)
            .order('available_date', { ascending: true });

          // Verify all created dates are present
          expect(allAvailability?.length).toBe(dateCount);

          // Verify each created ID is in the results
          for (const id of createdIds) {
            const found = allAvailability?.find(a => a.id === id);
            expect(found).toBeTruthy();
          }

          // Update one of the records
          const updateId = createdIds[0];
          await supabase
            .from('availability')
            .update({ capacity: 999 })
            .eq('id', updateId);

          // Query again immediately
          const { data: afterUpdate } = await supabase
            .from('availability')
            .select('*')
            .eq('experience_id', testExperienceId)
            .order('available_date', { ascending: true });

          // Verify the update is reflected
          const updatedRecord = afterUpdate?.find(a => a.id === updateId);
          expect(updatedRecord?.capacity).toBe(999);

          // Delete one of the records
          const deleteId = createdIds[1];
          await supabase
            .from('availability')
            .delete()
            .eq('id', deleteId);

          // Query again immediately
          const { data: afterDelete } = await supabase
            .from('availability')
            .select('*')
            .eq('experience_id', testExperienceId)
            .order('available_date', { ascending: true });

          // Verify the deletion is reflected
          expect(afterDelete?.length).toBe(dateCount - 1);
          const deletedRecord = afterDelete?.find(a => a.id === deleteId);
          expect(deletedRecord).toBeUndefined();
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 21 (Edge Case): Unique constraint on experience_id + available_date
   * 
   * The database enforces a unique constraint on (experience_id, available_date).
   * Attempting to create duplicate dates should fail immediately.
   */
  it('Property 21 (Edge Case): Duplicate dates are rejected immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate capacity
        fc.integer({ min: 10, max: 100 }),
        async (capacity) => {
          // Create a unique experience for this test run
          const testExperienceId = await createTestExperience();

          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 90);
          const dateString = futureDate.toISOString().split('T')[0];

          // Create first availability record
          const { data: first } = await supabase
            .from('availability')
            .insert({
              experience_id: testExperienceId,
              available_date: dateString,
              capacity: capacity,
              booked_count: 0,
            })
            .select()
            .single();

          if (!first) throw new Error('Failed to create first availability');
          testAvailabilityIds.push(first.id);

          // Attempt to create duplicate
          const { error: duplicateError } = await supabase
            .from('availability')
            .insert({
              experience_id: testExperienceId,
              available_date: dateString,
              capacity: capacity + 10,
              booked_count: 0,
            });

          // Should fail due to unique constraint
          expect(duplicateError).toBeTruthy();
          expect(duplicateError?.message).toMatch(/unique|duplicate/i);

          // Verify only one record exists
          const { data: allRecords } = await supabase
            .from('availability')
            .select('*')
            .eq('experience_id', testExperienceId)
            .eq('available_date', dateString);

          expect(allRecords?.length).toBe(1);
          expect(allRecords![0].id).toBe(first.id);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);
});
