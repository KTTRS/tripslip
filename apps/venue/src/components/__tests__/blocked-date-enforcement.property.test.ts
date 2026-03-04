/**
 * Property-Based Tests - Blocked Date Enforcement (Task 6.5)
 * 
 * Tests Property 23: Blocked Date Enforcement
 * For any date marked as blocked for an experience, attempting to create a 
 * booking for that date should be rejected.
 * 
 * **Validates: Requirements 6.10**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VenueBookingService, CreateBookingInput } from '@tripslip/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use service role key for tests to bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Blocked Date Enforcement (Task 6.5)', () => {
  let supabase: SupabaseClient;
  let bookingService: VenueBookingService;
  const testVenueIds: string[] = [];
  const testExperienceIds: string[] = [];
  const testAvailabilityIds: string[] = [];
  const testTripIds: string[] = [];
  const testBookingIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    bookingService = new VenueBookingService(supabase);
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    if (testBookingIds.length > 0) {
      await supabase.from('venue_bookings').delete().in('id', testBookingIds);
      testBookingIds.length = 0;
    }

    if (testTripIds.length > 0) {
      await supabase.from('trips').delete().in('id', testTripIds);
      testTripIds.length = 0;
    }

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

  // Helper function to create a test venue and experience
  async function createTestVenueAndExperience(): Promise<{ venueId: string; experienceId: string }> {
    // Create test venue
    const { data: venue } = await supabase
      .from('venues')
      .insert({
        name: `Test Venue ${Date.now()}-${Math.random()}`,
        description: 'Test venue for blocked date tests',
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
        description: 'Test experience for blocked date tests',
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
    return { venueId: venue!.id, experienceId: experience!.id };
  }

  // Helper function to create a test trip
  async function createTestTrip(experienceId: string): Promise<string> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    // Create a test teacher first (required for trips)
    const { data: teacher } = await supabase
      .from('teachers')
      .insert({
        first_name: 'Test',
        last_name: `Teacher ${Date.now()}`,
        email: `teacher${Date.now()}-${Math.random()}@test.com`,
      })
      .select()
      .single();

    if (!teacher) throw new Error('Failed to create test teacher');

    const { data: trip } = await supabase
      .from('trips')
      .insert({
        experience_id: experienceId,
        teacher_id: teacher.id,
        trip_date: futureDate.toISOString().split('T')[0],
        student_count: 0,
        status: 'pending',
      })
      .select()
      .single();

    if (!trip) throw new Error('Failed to create test trip');
    testTripIds.push(trip.id);
    return trip.id;
  }

  /**
   * Property 23: Blocked Date Enforcement
   * 
   * For any date marked as blocked (capacity = 0) for an experience, 
   * attempting to create a booking for that date should be rejected.
   * 
   * This property ensures that venues can effectively block dates when
   * they are unavailable (maintenance, private events, etc.).
   */
  it('Property 23: Bookings on blocked dates (capacity = 0) are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate future date (1-90 days from now)
        fc.integer({ min: 1, max: 90 }),
        // Generate student count
        fc.integer({ min: 10, max: 50 }),
        async (daysFromNow, studentCount) => {
          // Create test venue and experience
          const { venueId, experienceId } = await createTestVenueAndExperience();

          // Calculate future date
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + daysFromNow);
          const dateString = futureDate.toISOString().split('T')[0];

          // Block the date by setting capacity to 0
          const { data: blockedDate, error: blockError } = await supabase
            .from('availability')
            .insert({
              experience_id: experienceId,
              available_date: dateString,
              capacity: 0, // BLOCKED
              booked_count: 0,
              start_time: '09:00',
              end_time: '15:00',
            })
            .select()
            .single();

          if (blockError || !blockedDate) {
            throw new Error(`Failed to create blocked date: ${blockError?.message}`);
          }
          testAvailabilityIds.push(blockedDate.id);

          // Create a test trip
          const tripId = await createTestTrip(experienceId);

          // Attempt to create a booking on the blocked date
          const bookingInput: CreateBookingInput = {
            trip_id: tripId,
            venue_id: venueId,
            experience_id: experienceId,
            scheduled_date: dateString,
            start_time: '09:00',
            end_time: '15:00',
            student_count: studentCount,
            quoted_price_cents: 5000,
          };

          // The booking should be rejected
          let bookingFailed = false;
          let errorMessage = '';

          try {
            const booking = await bookingService.createBooking(bookingInput);
            // If we get here, the booking was created (should not happen)
            testBookingIds.push(booking.id);
          } catch (error) {
            bookingFailed = true;
            errorMessage = error instanceof Error ? error.message : 'Unknown error';
          }

          // Verify the booking was rejected
          expect(bookingFailed).toBe(true);
          expect(errorMessage.toLowerCase()).toMatch(/blocked|unavailable|not available|capacity/);

          // Verify no booking was created in the database
          const { data: bookings } = await supabase
            .from('venue_bookings')
            .select('*')
            .eq('experience_id', experienceId)
            .eq('scheduled_date', dateString);

          expect(bookings?.length || 0).toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * Property 23: Blocked dates are queryable and identifiable
   * 
   * Blocked dates (capacity = 0) should be clearly identifiable when
   * querying availability, allowing UIs to display them appropriately.
   */
  it('Property 23: Blocked dates are identifiable in availability queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of dates to create (mix of blocked and available)
        fc.integer({ min: 2, max: 5 }),
        async (dateCount) => {
          // Create test venue and experience
          const { experienceId } = await createTestVenueAndExperience();

          const createdDates: Array<{ id: string; date: string; capacity: number }> = [];

          // Create a mix of blocked and available dates
          for (let i = 0; i < dateCount; i++) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (i + 1) * 10);
            const dateString = futureDate.toISOString().split('T')[0];

            // Alternate between blocked (0) and available (30) capacity
            const capacity = i % 2 === 0 ? 0 : 30;

            const { data: availDate } = await supabase
              .from('availability')
              .insert({
                experience_id: experienceId,
                available_date: dateString,
                capacity: capacity,
                booked_count: 0,
              })
              .select()
              .single();

            if (!availDate) throw new Error('Failed to create availability date');
            testAvailabilityIds.push(availDate.id);
            createdDates.push({ id: availDate.id, date: dateString, capacity });
          }

          // Query all availability for the experience
          const { data: allAvailability } = await supabase
            .from('availability')
            .select('*')
            .eq('experience_id', experienceId)
            .order('available_date', { ascending: true });

          expect(allAvailability?.length).toBe(dateCount);

          // Verify each date's blocked status is correctly reflected
          for (const created of createdDates) {
            const found = allAvailability?.find(a => a.id === created.id);
            expect(found).toBeTruthy();
            expect(found?.capacity).toBe(created.capacity);

            // Blocked dates should have capacity = 0
            if (created.capacity === 0) {
              expect(found?.capacity).toBe(0);
            } else {
              expect(found?.capacity).toBeGreaterThan(0);
            }
          }

          // Count blocked vs available dates
          const blockedCount = allAvailability?.filter(a => a.capacity === 0).length || 0;
          const availableCount = allAvailability?.filter(a => a.capacity > 0).length || 0;

          expect(blockedCount + availableCount).toBe(dateCount);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 23: Updating capacity to 0 blocks the date
   * 
   * When a venue updates an existing availability date to set capacity = 0,
   * the date should become blocked and reject new bookings.
   */
  it('Property 23: Updating capacity to 0 blocks the date for new bookings', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial capacity
        fc.integer({ min: 20, max: 100 }),
        // Generate student count for booking attempt
        fc.integer({ min: 10, max: 50 }),
        async (initialCapacity, studentCount) => {
          // Create test venue and experience
          const { venueId, experienceId } = await createTestVenueAndExperience();

          // Create an available date
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const dateString = futureDate.toISOString().split('T')[0];

          const { data: availDate } = await supabase
            .from('availability')
            .insert({
              experience_id: experienceId,
              available_date: dateString,
              capacity: initialCapacity,
              booked_count: 0,
            })
            .select()
            .single();

          if (!availDate) throw new Error('Failed to create availability date');
          testAvailabilityIds.push(availDate.id);

          // Verify the date is initially available
          expect(availDate.capacity).toBe(initialCapacity);

          // Update capacity to 0 (block the date)
          const { error: updateError } = await supabase
            .from('availability')
            .update({ capacity: 0 })
            .eq('id', availDate.id);

          if (updateError) {
            throw new Error(`Failed to update capacity: ${updateError.message}`);
          }

          // Verify the update
          const { data: updated } = await supabase
            .from('availability')
            .select('*')
            .eq('id', availDate.id)
            .single();

          expect(updated?.capacity).toBe(0);

          // Create a test trip
          const tripId = await createTestTrip(experienceId);

          // Attempt to create a booking on the now-blocked date
          const bookingInput: CreateBookingInput = {
            trip_id: tripId,
            venue_id: venueId,
            experience_id: experienceId,
            scheduled_date: dateString,
            start_time: '09:00',
            end_time: '15:00',
            student_count: studentCount,
            quoted_price_cents: 5000,
          };

          // The booking should be rejected
          let bookingFailed = false;

          try {
            const booking = await bookingService.createBooking(bookingInput);
            testBookingIds.push(booking.id);
          } catch (error) {
            bookingFailed = true;
          }

          // Verify the booking was rejected
          expect(bookingFailed).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * Property 23: Blocked dates with existing bookings remain blocked
   * 
   * Even if a date has existing bookings, setting capacity to 0 should
   * block new bookings while preserving existing ones.
   */
  it('Property 23: Blocked dates preserve existing bookings but reject new ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial capacity
        fc.integer({ min: 30, max: 100 }),
        // Generate student count for first booking
        fc.integer({ min: 10, max: 20 }),
        // Generate student count for second booking attempt
        fc.integer({ min: 10, max: 20 }),
        async (initialCapacity, firstBookingSize, secondBookingSize) => {
          // Create test venue and experience
          const { venueId, experienceId } = await createTestVenueAndExperience();

          // Create an available date
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 60);
          const dateString = futureDate.toISOString().split('T')[0];

          const { data: availDate } = await supabase
            .from('availability')
            .insert({
              experience_id: experienceId,
              available_date: dateString,
              capacity: initialCapacity,
              booked_count: 0,
            })
            .select()
            .single();

          if (!availDate) throw new Error('Failed to create availability date');
          testAvailabilityIds.push(availDate.id);

          // Create first trip and booking (before blocking)
          const firstTripId = await createTestTrip(experienceId);

          const firstBookingInput: CreateBookingInput = {
            trip_id: firstTripId,
            venue_id: venueId,
            experience_id: experienceId,
            scheduled_date: dateString,
            start_time: '09:00',
            end_time: '12:00',
            student_count: firstBookingSize,
            quoted_price_cents: 5000,
          };

          const firstBooking = await bookingService.createBooking(firstBookingInput);
          testBookingIds.push(firstBooking.id);

          // Verify first booking was created
          expect(firstBooking.id).toBeTruthy();
          expect(firstBooking.status).toBe('pending');

          // Now block the date by setting capacity to 0
          await supabase
            .from('availability')
            .update({ capacity: 0 })
            .eq('id', availDate.id);

          // Verify the date is now blocked
          const { data: blockedDate } = await supabase
            .from('availability')
            .select('*')
            .eq('id', availDate.id)
            .single();

          expect(blockedDate?.capacity).toBe(0);

          // Attempt to create a second booking on the blocked date
          const secondTripId = await createTestTrip(experienceId);

          const secondBookingInput: CreateBookingInput = {
            trip_id: secondTripId,
            venue_id: venueId,
            experience_id: experienceId,
            scheduled_date: dateString,
            start_time: '13:00',
            end_time: '16:00',
            student_count: secondBookingSize,
            quoted_price_cents: 5000,
          };

          // The second booking should be rejected
          let secondBookingFailed = false;

          try {
            const secondBooking = await bookingService.createBooking(secondBookingInput);
            testBookingIds.push(secondBooking.id);
          } catch (error) {
            secondBookingFailed = true;
          }

          expect(secondBookingFailed).toBe(true);

          // Verify the first booking still exists
          const { data: existingBooking } = await supabase
            .from('venue_bookings')
            .select('*')
            .eq('id', firstBooking.id)
            .single();

          expect(existingBooking).toBeTruthy();
          expect(existingBooking?.id).toBe(firstBooking.id);

          // Verify only one booking exists for this date
          const { data: allBookings } = await supabase
            .from('venue_bookings')
            .select('*')
            .eq('experience_id', experienceId)
            .eq('scheduled_date', dateString);

          expect(allBookings?.length).toBe(1);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 23: Unblocking a date (capacity > 0) allows bookings
   * 
   * When a venue updates a blocked date to have capacity > 0,
   * the date should become available for bookings again.
   */
  it('Property 23: Unblocking a date (setting capacity > 0) allows new bookings', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate new capacity
        fc.integer({ min: 20, max: 100 }),
        // Generate student count
        fc.integer({ min: 10, max: 50 }),
        async (newCapacity, studentCount) => {
          // Ensure student count doesn't exceed capacity
          const safeStudentCount = Math.min(studentCount, newCapacity);

          // Create test venue and experience
          const { venueId, experienceId } = await createTestVenueAndExperience();

          // Create a blocked date (capacity = 0)
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 75);
          const dateString = futureDate.toISOString().split('T')[0];

          const { data: blockedDate } = await supabase
            .from('availability')
            .insert({
              experience_id: experienceId,
              available_date: dateString,
              capacity: 0, // BLOCKED
              booked_count: 0,
            })
            .select()
            .single();

          if (!blockedDate) throw new Error('Failed to create blocked date');
          testAvailabilityIds.push(blockedDate.id);

          // Verify the date is blocked
          expect(blockedDate.capacity).toBe(0);

          // Unblock the date by setting capacity > 0
          const { error: updateError } = await supabase
            .from('availability')
            .update({ capacity: newCapacity })
            .eq('id', blockedDate.id);

          if (updateError) {
            throw new Error(`Failed to update capacity: ${updateError.message}`);
          }

          // Verify the update
          const { data: unblocked } = await supabase
            .from('availability')
            .select('*')
            .eq('id', blockedDate.id)
            .single();

          expect(unblocked?.capacity).toBe(newCapacity);

          // Create a test trip
          const tripId = await createTestTrip(experienceId);

          // Attempt to create a booking on the now-available date
          const bookingInput: CreateBookingInput = {
            trip_id: tripId,
            venue_id: venueId,
            experience_id: experienceId,
            scheduled_date: dateString,
            start_time: '09:00',
            end_time: '15:00',
            student_count: safeStudentCount,
            quoted_price_cents: 5000,
          };

          // The booking should succeed
          let booking;
          let bookingError;

          try {
            booking = await bookingService.createBooking(bookingInput);
            testBookingIds.push(booking.id);
          } catch (error) {
            bookingError = error;
          }

          // Verify the booking was created successfully
          expect(bookingError).toBeUndefined();
          expect(booking).toBeTruthy();
          expect(booking?.status).toBe('pending');

          // Verify the booking exists in the database
          const { data: createdBooking } = await supabase
            .from('venue_bookings')
            .select('*')
            .eq('id', booking!.id)
            .single();

          expect(createdBooking).toBeTruthy();
          expect(createdBooking?.scheduled_date).toBe(dateString);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);
});
