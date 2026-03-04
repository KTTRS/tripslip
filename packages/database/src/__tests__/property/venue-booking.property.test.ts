/**
 * Property-Based Tests - Venue Booking System (Task 12.2)
 * 
 * Tests two core properties:
 * - Property 31: Booking Confirmation Number Uniqueness
 * - Property 32: Booking Status Lifecycle
 * 
 * **Validates: Requirements 25.3, 25.9**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VenueBookingService, CreateBookingInput, BookingStatus } from '../../venue-booking-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Venue Booking System (Task 12.2)', () => {
  let supabase: SupabaseClient;
  let bookingService: VenueBookingService;
  let testVenueId: string;
  let testExperienceId: string;
  let testTripId: string;
  let testUserId: string;
  const createdBookingIds: string[] = [];
  const createdTripIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    bookingService = new VenueBookingService(supabase);

    // Use a properly formatted UUID for test user
    testUserId = crypto.randomUUID();

    // Create test teacher (required for trips foreign key)
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        id: testUserId,
        first_name: 'Test',
        last_name: 'Teacher',
        email: `test${Date.now()}@teacher.com`,
        independent: true,
      })
      .select()
      .single();

    if (teacherError) throw teacherError;

    // Create test venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: `Test Booking Venue ${Date.now()}`,
        description: 'A test venue for property testing',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
        contact_email: `test${Date.now()}@venue.com`,
        contact_phone: '555-0100',
      })
      .select()
      .single();

    if (venueError) throw venueError;
    testVenueId = venue.id;

    // Create test experience
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .insert({
        venue_id: testVenueId,
        title: `Test Experience ${Date.now()}`,
        description: 'A test experience for property testing',
        duration_minutes: 120,
        capacity: 50,
        min_students: 10,
        max_students: 50,
        active: true,
        published: true,
      })
      .select()
      .single();

    if (expError) throw expError;
    testExperienceId = experience.id;

    // Create test trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        experience_id: testExperienceId,
        teacher_id: testUserId,
        trip_date: '2024-06-15',
        status: 'pending',
      })
      .select()
      .single();

    if (tripError) throw tripError;
    testTripId = trip.id;
    createdTripIds.push(testTripId);
  });

  afterEach(async () => {
    // Clean up created bookings
    if (createdBookingIds.length > 0) {
      await supabase.from('venue_bookings').delete().in('id', createdBookingIds);
      createdBookingIds.length = 0;
    }

    // Clean up test trips
    if (createdTripIds.length > 0) {
      await supabase.from('trips').delete().in('id', createdTripIds);
      createdTripIds.length = 0;
    }

    // Clean up test experience
    if (testExperienceId) {
      await supabase.from('experiences').delete().eq('id', testExperienceId);
    }

    // Clean up test venue
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }

    // Clean up test teacher
    if (testUserId) {
      await supabase.from('teachers').delete().eq('id', testUserId);
    }
  });

  /**
   * Property 31: Booking Confirmation Number Uniqueness
   * 
   * For any two confirmed bookings, they SHALL have different confirmation numbers.
   * 
   * **Validates: Requirements 25.3**
   */
  it('Property 31: All booking confirmation numbers are unique', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            studentCount: fc.integer({ min: 10, max: 50 }),
            chaperoneCount: fc.integer({ min: 1, max: 10 }),
            priceCents: fc.integer({ min: 1000, max: 50000 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (bookings) => {
          const confirmationNumbers: string[] = [];
          const bookingIds: string[] = [];

          // Create a fresh experience for this test iteration to avoid capacity conflicts
          const { data: testExp } = await supabase
            .from('experiences')
            .insert({
              venue_id: testVenueId,
              title: `Test Experience ${Date.now()}-${Math.random()}`,
              description: 'A test experience for property testing',
              duration_minutes: 120,
              capacity: 500, // Large capacity to avoid conflicts
              min_students: 10,
              max_students: 500,
              active: true,
              published: true,
            })
            .select()
            .single();

          // Create multiple bookings
          for (const bookingData of bookings) {
            // Create a new trip for each booking
            const { data: trip } = await supabase
              .from('trips')
              .insert({
                experience_id: testExp!.id,
                teacher_id: testUserId,
                trip_date: '2024-06-15',
                status: 'pending',
              })
              .select()
              .single();

            createdTripIds.push(trip!.id);

            const input: CreateBookingInput = {
              trip_id: trip!.id,
              venue_id: testVenueId,
              experience_id: testExp!.id,
              scheduled_date: '2024-06-15',
              start_time: '09:00:00',
              end_time: '15:00:00',
              student_count: bookingData.studentCount,
              chaperone_count: bookingData.chaperoneCount,
              quoted_price_cents: bookingData.priceCents,
            };

            const booking = await bookingService.createBooking(input);
            bookingIds.push(booking.id);
            createdBookingIds.push(booking.id);
            confirmationNumbers.push(booking.confirmation_number);
          }

          // Property: All confirmation numbers should be unique
          const uniqueConfirmationNumbers = new Set(confirmationNumbers);
          expect(uniqueConfirmationNumbers.size).toBe(confirmationNumbers.length);

          // Verify each confirmation number follows the expected format
          for (const confirmationNumber of confirmationNumbers) {
            expect(confirmationNumber).toMatch(/^VB-\d{8}-[A-Z0-9]{4}$/);
          }

          // Clean up for next iteration
          for (const bookingId of bookingIds) {
            await supabase.from('venue_bookings').delete().eq('id', bookingId);
            const index = createdBookingIds.indexOf(bookingId);
            if (index > -1) createdBookingIds.splice(index, 1);
          }

          // Clean up test experience
          await supabase.from('experiences').delete().eq('id', testExp!.id);
        }
      ),
      { numRuns: 50 }
    );
  }, 180000);

  /**
   * Property 31: Confirmation numbers remain unique across time
   * 
   * For any bookings created at different times, their confirmation numbers 
   * SHALL still be unique.
   * 
   * **Validates: Requirements 25.3**
   */
  it('Property 31: Confirmation numbers unique across time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            studentCount: fc.integer({ min: 10, max: 50 }),
            priceCents: fc.integer({ min: 1000, max: 50000 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (bookings) => {
          const confirmationNumbers: string[] = [];
          const bookingIds: string[] = [];

          // Create a fresh experience for this test iteration to avoid capacity conflicts
          const { data: testExp } = await supabase
            .from('experiences')
            .insert({
              venue_id: testVenueId,
              title: `Test Experience ${Date.now()}-${Math.random()}`,
              description: 'A test experience for property testing',
              duration_minutes: 120,
              capacity: 500, // Large capacity to avoid conflicts
              min_students: 10,
              max_students: 500,
              active: true,
              published: true,
            })
            .select()
            .single();

          // Create bookings with small delays between them
          for (const bookingData of bookings) {
            const { data: trip } = await supabase
              .from('trips')
              .insert({
                experience_id: testExp!.id,
                teacher_id: testUserId,
                trip_date: '2024-06-15',
                status: 'pending',
              })
              .select()
              .single();

            createdTripIds.push(trip!.id);

            const input: CreateBookingInput = {
              trip_id: trip!.id,
              venue_id: testVenueId,
              experience_id: testExp!.id,
              scheduled_date: '2024-06-15',
              start_time: '09:00:00',
              end_time: '15:00:00',
              student_count: bookingData.studentCount,
              quoted_price_cents: bookingData.priceCents,
            };

            const booking = await bookingService.createBooking(input);
            bookingIds.push(booking.id);
            createdBookingIds.push(booking.id);
            confirmationNumbers.push(booking.confirmation_number);

            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Property: All confirmation numbers should still be unique
          const uniqueConfirmationNumbers = new Set(confirmationNumbers);
          expect(uniqueConfirmationNumbers.size).toBe(confirmationNumbers.length);

          // Clean up
          for (const bookingId of bookingIds) {
            await supabase.from('venue_bookings').delete().eq('id', bookingId);
            const index = createdBookingIds.indexOf(bookingId);
            if (index > -1) createdBookingIds.splice(index, 1);
          }

          // Clean up test experience
          await supabase.from('experiences').delete().eq('id', testExp!.id);
        }
      ),
      { numRuns: 50 }
    );
  }, 180000);

  /**
   * Property 32: Booking Status Lifecycle
   * 
   * For any booking, valid status transitions SHALL be: 
   * - pending → confirmed → completed
   * - pending → cancelled
   * - confirmed → cancelled
   * - confirmed → modified → completed
   * 
   * And completed or cancelled bookings SHALL NOT transition to other states.
   * 
   * **Validates: Requirements 25.9**
   */
  it('Property 32: Valid status transitions are allowed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          ['pending', 'confirmed', 'completed'] as BookingStatus[],
          ['pending', 'cancelled'] as BookingStatus[],
          ['pending', 'confirmed', 'cancelled'] as BookingStatus[],
          ['pending', 'confirmed', 'modified', 'completed'] as BookingStatus[]
        ),
        async (statusSequence) => {
          // Create a booking
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          const input: CreateBookingInput = {
            trip_id: trip!.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: '2024-06-15',
            start_time: '09:00:00',
            end_time: '15:00:00',
            student_count: 25,
            quoted_price_cents: 5000,
          };

          let booking = await bookingService.createBooking(input);
          createdBookingIds.push(booking.id);

          // Property: Should be able to transition through valid status sequence
          expect(booking.status).toBe('pending');

          for (let i = 1; i < statusSequence.length; i++) {
            const targetStatus = statusSequence[i];

            if (targetStatus === 'confirmed') {
              booking = await bookingService.confirmBooking(booking.id);
            } else if (targetStatus === 'cancelled') {
              booking = await bookingService.cancelBooking(booking.id);
            } else if (targetStatus === 'completed') {
              booking = await bookingService.completeBooking(booking.id);
            } else if (targetStatus === 'modified') {
              booking = await bookingService.updateBooking(booking.id, {
                student_count: 30,
              });
            }

            expect(booking.status).toBe(targetStatus);
          }

          // Clean up
          await supabase.from('venue_bookings').delete().eq('id', booking.id);
          const index = createdBookingIds.indexOf(booking.id);
          if (index > -1) createdBookingIds.splice(index, 1);
        }
      ),
      { numRuns: 20 }
    );
  }, 180000);

  /**
   * Property 32: Completed bookings cannot transition to other states
   * 
   * For any booking in 'completed' status, attempting to transition to any 
   * other status SHALL be rejected or have no effect.
   * 
   * **Validates: Requirements 25.9**
   */
  it('Property 32: Completed bookings cannot transition to other states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 50 }),
        async (studentCount) => {
          // Create and complete a booking
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          const input: CreateBookingInput = {
            trip_id: trip!.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: '2024-06-15',
            start_time: '09:00:00',
            end_time: '15:00:00',
            student_count: studentCount,
            quoted_price_cents: 5000,
          };

          let booking = await bookingService.createBooking(input);
          createdBookingIds.push(booking.id);

          // Confirm and complete the booking
          booking = await bookingService.confirmBooking(booking.id);
          booking = await bookingService.completeBooking(booking.id);

          expect(booking.status).toBe('completed');

          // Property: Attempting to cancel a completed booking should fail or have no effect
          // The service should either throw an error or the status should remain 'completed'
          try {
            const result = await bookingService.cancelBooking(booking.id);
            // If it doesn't throw, the status should still be completed
            expect(result.status).toBe('completed');
          } catch (error) {
            // If it throws, that's also acceptable behavior
            expect(error).toBeDefined();
          }

          // Verify the booking is still completed
          const finalBooking = await bookingService.getBookingById(booking.id);
          expect(finalBooking!.status).toBe('completed');

          // Clean up
          await supabase.from('venue_bookings').delete().eq('id', booking.id);
          const index = createdBookingIds.indexOf(booking.id);
          if (index > -1) createdBookingIds.splice(index, 1);
        }
      ),
      { numRuns: 20 }
    );
  }, 180000);

  /**
   * Property 32: Cancelled bookings cannot transition to other states
   * 
   * For any booking in 'cancelled' status, attempting to transition to any 
   * other status SHALL be rejected or have no effect.
   * 
   * **Validates: Requirements 25.9**
   */
  it('Property 32: Cancelled bookings cannot transition to other states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 50 }),
        async (studentCount) => {
          // Create and cancel a booking
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          const input: CreateBookingInput = {
            trip_id: trip!.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: '2024-06-15',
            start_time: '09:00:00',
            end_time: '15:00:00',
            student_count: studentCount,
            quoted_price_cents: 5000,
          };

          let booking = await bookingService.createBooking(input);
          createdBookingIds.push(booking.id);

          // Cancel the booking
          booking = await bookingService.cancelBooking(booking.id);
          expect(booking.status).toBe('cancelled');

          // Property: Attempting to confirm a cancelled booking should fail or have no effect
          try {
            const result = await bookingService.confirmBooking(booking.id);
            // If it doesn't throw, the status should still be cancelled
            expect(result.status).toBe('cancelled');
          } catch (error) {
            // If it throws, that's also acceptable behavior
            expect(error).toBeDefined();
          }

          // Property: Attempting to complete a cancelled booking should fail or have no effect
          try {
            const result = await bookingService.completeBooking(booking.id);
            // If it doesn't throw, the status should still be cancelled
            expect(result.status).toBe('cancelled');
          } catch (error) {
            // If it throws, that's also acceptable behavior
            expect(error).toBeDefined();
          }

          // Verify the booking is still cancelled
          const finalBooking = await bookingService.getBookingById(booking.id);
          expect(finalBooking!.status).toBe('cancelled');

          // Clean up
          await supabase.from('venue_bookings').delete().eq('id', booking.id);
          const index = createdBookingIds.indexOf(booking.id);
          if (index > -1) createdBookingIds.splice(index, 1);
        }
      ),
      { numRuns: 20 }
    );
  }, 180000);

  /**
   * Property 32: Modified status can transition to completed or cancelled
   * 
   * For any booking in 'modified' status, it SHALL be able to transition 
   * to 'completed' or 'cancelled' status.
   * 
   * **Validates: Requirements 25.9**
   */
  it('Property 32: Modified bookings can transition to completed or cancelled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('completed' as BookingStatus, 'cancelled' as BookingStatus),
        fc.integer({ min: 10, max: 50 }),
        async (finalStatus, studentCount) => {
          // Create a booking and modify it
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          const input: CreateBookingInput = {
            trip_id: trip!.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: '2024-06-15',
            start_time: '09:00:00',
            end_time: '15:00:00',
            student_count: studentCount,
            quoted_price_cents: 5000,
          };

          let booking = await bookingService.createBooking(input);
          createdBookingIds.push(booking.id);

          // Confirm and then modify the booking
          booking = await bookingService.confirmBooking(booking.id);
          booking = await bookingService.updateBooking(booking.id, {
            student_count: studentCount + 5,
          });

          expect(booking.status).toBe('modified');

          // Property: Should be able to transition to completed or cancelled
          if (finalStatus === 'completed') {
            booking = await bookingService.completeBooking(booking.id);
          } else {
            booking = await bookingService.cancelBooking(booking.id);
          }

          expect(booking.status).toBe(finalStatus);

          // Clean up
          await supabase.from('venue_bookings').delete().eq('id', booking.id);
          const index = createdBookingIds.indexOf(booking.id);
          if (index > -1) createdBookingIds.splice(index, 1);
        }
      ),
      { numRuns: 20 }
    );
  }, 180000);
});
