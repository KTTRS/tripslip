/**
 * Property-Based Tests - Venue Capacity Management (Task 12.4)
 * 
 * Tests two core properties:
 * - Property 19: Booking Capacity Reduction
 * - Property 20: Overbooking Prevention
 * 
 * **Validates: Requirements 9.6, 9.7**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VenueBookingService, CreateBookingInput } from '../../venue-booking-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Venue Capacity Management (Task 12.4)', () => {
  let supabase: SupabaseClient;
  let bookingService: VenueBookingService;
  let testVenueId: string;
  let testExperienceId: string;
  let testUserId: string;
  const createdBookingIds: string[] = [];
  const createdTripIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    bookingService = new VenueBookingService(supabase);

    // Use a properly formatted UUID for test user
    testUserId = crypto.randomUUID();

    // Create test teacher (required for trips foreign key)
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        id: testUserId,
        first_name: 'Test',
        last_name: 'Teacher',
        email: `test${Date.now()}@teacher.com`,
      });

    if (teacherError) throw teacherError;

    // Create test venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: `Test Capacity Venue ${Date.now()}`,
        description: 'A test venue for capacity property testing',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
        contact_email: `test${Date.now()}@venue.com`,
        contact_phone: '555-0100',
      })
      .select()
      .single();

    if (venueError) throw venueError;
    testVenueId = venue.id;

    // Create test experience with specific capacity limits
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .insert({
        venue_id: testVenueId,
        title: `Test Experience ${Date.now()}`,
        description: 'A test experience for capacity property testing',
        duration_minutes: 120,
        capacity: 100,
        min_students: 10,
        max_students: 100, // Set a clear max capacity
        active: true,
        published: true,
      })
      .select()
      .single();

    if (expError) throw expError;
    testExperienceId = experience.id;
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
   * Property 19: Booking Capacity Reduction
   * 
   * For any confirmed booking at a venue on a specific date and time, 
   * the available capacity for that time slot SHALL be reduced by the 
   * number of students in the booking.
   * 
   * **Validates: Requirements 9.6**
   */
  it('Property 19: Confirmed bookings reduce available capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            studentCount: fc.integer({ min: 10, max: 30 }),
            startTime: fc.constantFrom('09:00:00', '10:00:00', '11:00:00'),
            endTime: fc.constantFrom('12:00:00', '13:00:00', '14:00:00'),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (bookings) => {
          const testDate = '2024-07-15';
          const bookingIds: string[] = [];

          // Clean up any existing bookings for this test scenario
          await supabase
            .from('venue_bookings')
            .delete()
            .eq('experience_id', testExperienceId)
            .eq('scheduled_date', testDate);

          // Track all bookings to calculate overlapping capacity
          const allBookings: Array<{ startTime: string; endTime: string; studentCount: number }> = [];

          for (const bookingData of bookings) {
            // Create a trip for this booking
            const { data: trip, error: tripError } = await supabase
              .from('trips')
              .insert({
                experience_id: testExperienceId,
                teacher_id: testUserId,
                trip_date: testDate,
                status: 'pending',
              })
              .select()
              .single();

            if (tripError || !trip) {
              throw new Error(`Failed to create trip: ${tripError?.message || 'Unknown error'}`);
            }

            createdTripIds.push(trip.id);

            const input: CreateBookingInput = {
              trip_id: trip.id,
              venue_id: testVenueId,
              experience_id: testExperienceId,
              scheduled_date: testDate,
              start_time: bookingData.startTime,
              end_time: bookingData.endTime,
              student_count: bookingData.studentCount,
              quoted_price_cents: 5000,
            };

            // Create and confirm the booking
            const booking = await bookingService.createBooking(input);
            await bookingService.confirmBooking(booking.id);
            bookingIds.push(booking.id);
            createdBookingIds.push(booking.id);

            // Add to tracking
            allBookings.push({
              startTime: bookingData.startTime,
              endTime: bookingData.endTime,
              studentCount: bookingData.studentCount,
            });

            // Calculate expected capacity for this specific time slot
            // by checking which bookings overlap with it
            let overlappingCapacity = 0;
            for (const existingBooking of allBookings) {
              const hasOverlap =
                (bookingData.startTime >= existingBooking.startTime && bookingData.startTime < existingBooking.endTime) ||
                (bookingData.endTime > existingBooking.startTime && bookingData.endTime <= existingBooking.endTime) ||
                (bookingData.startTime <= existingBooking.startTime && bookingData.endTime >= existingBooking.endTime);

              if (hasOverlap) {
                overlappingCapacity += existingBooking.studentCount;
              }
            }

            // Check availability after creating booking
            const availabilityAfter = await bookingService.checkAvailability(
              testVenueId,
              testExperienceId,
              testDate,
              bookingData.startTime,
              bookingData.endTime,
              0 // Check remaining capacity without requesting any students
            );

            // Property: Available capacity should be reduced by all overlapping bookings
            const expectedRemainingCapacity = 100 - overlappingCapacity;
            
            // Use the remainingCapacity value directly
            expect(availabilityAfter.remainingCapacity).toBe(expectedRemainingCapacity);
          }

          // Clean up
          for (const bookingId of bookingIds) {
            await supabase.from('venue_bookings').delete().eq('id', bookingId);
            const index = createdBookingIds.indexOf(bookingId);
            if (index > -1) createdBookingIds.splice(index, 1);
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  /**
   * Property 19: Multiple bookings in same time slot reduce capacity cumulatively
   * 
   * For any sequence of bookings in the same time slot, the total capacity 
   * reduction SHALL equal the sum of all student counts.
   * 
   * **Validates: Requirements 9.6**
   */
  it('Property 19: Multiple bookings cumulatively reduce capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.integer({ min: 10, max: 25 }),
          { minLength: 2, maxLength: 4 }
        ),
        async (studentCounts) => {
          const testDate = '2024-07-20';
          const startTime = '09:00:00';
          const endTime = '15:00:00';
          const bookingIds: string[] = [];
          let totalStudents = 0;

          // Clean up any existing bookings for this test scenario
          await supabase
            .from('venue_bookings')
            .delete()
            .eq('experience_id', testExperienceId)
            .eq('scheduled_date', testDate);

          // Create multiple bookings in the same time slot
          for (const studentCount of studentCounts) {
            // Check if we can still book
            const availability = await bookingService.checkAvailability(
              testVenueId,
              testExperienceId,
              testDate,
              startTime,
              endTime,
              studentCount
            );

            // If we've exceeded capacity, stop creating bookings
            if (!availability.available) {
              break;
            }

            const { data: trip, error: tripError } = await supabase
              .from('trips')
              .insert({
                experience_id: testExperienceId,
                teacher_id: testUserId,
                trip_date: testDate,
                status: 'pending',
              })
              .select()
              .single();

            if (tripError || !trip) {
              throw new Error(`Failed to create trip: ${tripError?.message || 'Unknown error'}`);
            }

            createdTripIds.push(trip.id);

            const input: CreateBookingInput = {
              trip_id: trip.id,
              venue_id: testVenueId,
              experience_id: testExperienceId,
              scheduled_date: testDate,
              start_time: startTime,
              end_time: endTime,
              student_count: studentCount,
              quoted_price_cents: 5000,
            };

            const booking = await bookingService.createBooking(input);
            await bookingService.confirmBooking(booking.id);
            bookingIds.push(booking.id);
            createdBookingIds.push(booking.id);
            totalStudents += studentCount;
          }

          // Property: Check that remaining capacity equals max capacity minus total students
          const finalAvailability = await bookingService.checkAvailability(
            testVenueId,
            testExperienceId,
            testDate,
            startTime,
            endTime,
            0 // Check remaining capacity without requesting any students
          );

          const expectedRemainingCapacity = 100 - totalStudents;
          
          // The remaining capacity should match expected, regardless of whether more bookings are available
          expect(finalAvailability.remainingCapacity).toBe(expectedRemainingCapacity);

          // Clean up
          for (const bookingId of bookingIds) {
            await supabase.from('venue_bookings').delete().eq('id', bookingId);
            const index = createdBookingIds.indexOf(bookingId);
            if (index > -1) createdBookingIds.splice(index, 1);
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  /**
   * Property 20: Overbooking Prevention
   * 
   * For any time slot where available capacity equals zero, attempting to 
   * create a new booking for that time slot SHALL be rejected.
   * 
   * **Validates: Requirements 9.7**
   */
  it('Property 20: Cannot create bookings when capacity is zero', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 20 }), // Must be >= min_students (10)
        async (additionalStudents) => {
          const testDate = '2024-07-25';
          const startTime = '10:00:00';
          const endTime = '16:00:00';
          const bookingIds: string[] = [];

          // Clean up any existing bookings for this test scenario
          await supabase
            .from('venue_bookings')
            .delete()
            .eq('experience_id', testExperienceId)
            .eq('scheduled_date', testDate);

          // Fill the capacity completely (max_students = 100)
          const { data: trip1, error: trip1Error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: testDate,
              status: 'pending',
            })
            .select()
            .single();

          if (trip1Error || !trip1) {
            throw new Error(`Failed to create trip: ${trip1Error?.message || 'Unknown error'}`);
          }

          createdTripIds.push(trip1.id);

          const fullCapacityBooking: CreateBookingInput = {
            trip_id: trip1.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: testDate,
            start_time: startTime,
            end_time: endTime,
            student_count: 100, // Fill to max capacity
            quoted_price_cents: 10000,
          };

          const booking1 = await bookingService.createBooking(fullCapacityBooking);
          await bookingService.confirmBooking(booking1.id);
          bookingIds.push(booking1.id);
          createdBookingIds.push(booking1.id);

          // Verify capacity is now zero
          const availabilityCheck = await bookingService.checkAvailability(
            testVenueId,
            testExperienceId,
            testDate,
            startTime,
            endTime,
            1
          );

          expect(availabilityCheck.available).toBe(false);
          expect(availabilityCheck.remainingCapacity).toBe(0);

          // Property: Attempting to create another booking should fail
          const { data: trip2, error: trip2Error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: testDate,
              status: 'pending',
            })
            .select()
            .single();

          if (trip2Error || !trip2) {
            throw new Error(`Failed to create trip: ${trip2Error?.message || 'Unknown error'}`);
          }

          createdTripIds.push(trip2.id);

          const overbookingAttempt: CreateBookingInput = {
            trip_id: trip2.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: testDate,
            start_time: startTime,
            end_time: endTime,
            student_count: additionalStudents, // Use the generated value which is >= 1
            quoted_price_cents: 5000,
          };

          const result = await bookingService.createBookingWithAvailabilityCheck(
            overbookingAttempt
          );

          // Property: The booking should be rejected
          expect(result.error).toBeDefined();
          expect(result.booking).toBeUndefined();
          expect(result.error).toContain('capacity');

          // Clean up
          for (const bookingId of bookingIds) {
            await supabase.from('venue_bookings').delete().eq('id', bookingId);
            const index = createdBookingIds.indexOf(bookingId);
            if (index > -1) createdBookingIds.splice(index, 1);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * Property 20: Overbooking prevention with partial capacity
   * 
   * For any time slot with remaining capacity less than the requested 
   * student count, the booking SHALL be rejected.
   * 
   * **Validates: Requirements 9.7**
   */
  it('Property 20: Cannot create bookings exceeding remaining capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          firstBookingSize: fc.integer({ min: 50, max: 80 }),
          secondBookingSize: fc.integer({ min: 30, max: 60 }),
        }),
        async ({ firstBookingSize, secondBookingSize }) => {
          const testDate = '2024-07-30';
          const startTime = '11:00:00';
          const endTime = '17:00:00';
          const bookingIds: string[] = [];

          // Clean up any existing bookings for this test scenario
          await supabase
            .from('venue_bookings')
            .delete()
            .eq('experience_id', testExperienceId)
            .eq('scheduled_date', testDate);

          // Create first booking
          const { data: trip1, error: trip1Error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: testDate,
              status: 'pending',
            })
            .select()
            .single();

          if (trip1Error || !trip1) {
            throw new Error(`Failed to create trip: ${trip1Error?.message || 'Unknown error'}`);
          }

          createdTripIds.push(trip1.id);

          const firstBooking: CreateBookingInput = {
            trip_id: trip1.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: testDate,
            start_time: startTime,
            end_time: endTime,
            student_count: firstBookingSize,
            quoted_price_cents: 5000,
          };

          const booking1 = await bookingService.createBooking(firstBooking);
          await bookingService.confirmBooking(booking1.id);
          bookingIds.push(booking1.id);
          createdBookingIds.push(booking1.id);

          // Check remaining capacity
          const remainingCapacity = 100 - firstBookingSize;

          // Try to create second booking
          const { data: trip2, error: trip2Error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: testDate,
              status: 'pending',
            })
            .select()
            .single();

          if (trip2Error || !trip2) {
            throw new Error(`Failed to create trip: ${trip2Error?.message || 'Unknown error'}`);
          }

          createdTripIds.push(trip2.id);

          const secondBooking: CreateBookingInput = {
            trip_id: trip2.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: testDate,
            start_time: startTime,
            end_time: endTime,
            student_count: secondBookingSize,
            quoted_price_cents: 5000,
          };

          const result = await bookingService.createBookingWithAvailabilityCheck(
            secondBooking
          );

          // Property: If second booking exceeds remaining capacity, it should be rejected
          if (secondBookingSize > remainingCapacity) {
            expect(result.error).toBeDefined();
            expect(result.booking).toBeUndefined();
          } else {
            // If within capacity, it should succeed
            expect(result.booking).toBeDefined();
            expect(result.error).toBeUndefined();
            if (result.booking) {
              bookingIds.push(result.booking.id);
              createdBookingIds.push(result.booking.id);
            }
          }

          // Clean up
          for (const bookingId of bookingIds) {
            await supabase.from('venue_bookings').delete().eq('id', bookingId);
            const index = createdBookingIds.indexOf(bookingId);
            if (index > -1) createdBookingIds.splice(index, 1);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * Property 20: Cancelled bookings restore capacity
   * 
   * For any cancelled booking, the capacity SHALL be restored and 
   * available for new bookings.
   * 
   * **Validates: Requirements 9.6, 9.7**
   */
  it('Property 20: Cancelled bookings restore capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 30, max: 70 }),
        async (studentCount) => {
          const testDate = '2024-08-05';
          const startTime = '09:00:00';
          const endTime = '15:00:00';
          const bookingIds: string[] = [];

          // Clean up any existing bookings for this test scenario
          await supabase
            .from('venue_bookings')
            .delete()
            .eq('experience_id', testExperienceId)
            .eq('scheduled_date', testDate);

          // Check initial capacity (without requesting any students to get true remaining)
          const initialAvailability = await bookingService.checkAvailability(
            testVenueId,
            testExperienceId,
            testDate,
            startTime,
            endTime,
            0 // Check remaining capacity without requesting any students
          );

          const initialRemainingCapacity = initialAvailability.remainingCapacity;

          // Create and confirm a booking
          const { data: trip1, error: trip1Error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: testDate,
              status: 'pending',
            })
            .select()
            .single();

          if (trip1Error || !trip1) {
            throw new Error(`Failed to create trip: ${trip1Error?.message || 'Unknown error'}`);
          }

          createdTripIds.push(trip1.id);

          const bookingInput: CreateBookingInput = {
            trip_id: trip1.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: testDate,
            start_time: startTime,
            end_time: endTime,
            student_count: studentCount,
            quoted_price_cents: 5000,
          };

          const booking = await bookingService.createBooking(bookingInput);
          await bookingService.confirmBooking(booking.id);
          bookingIds.push(booking.id);
          createdBookingIds.push(booking.id);

          // Check capacity after booking (without requesting any students to get true remaining)
          const afterBookingAvailability = await bookingService.checkAvailability(
            testVenueId,
            testExperienceId,
            testDate,
            startTime,
            endTime,
            0 // Check remaining capacity without requesting any students
          );

          // Capacity should be reduced by the student count
          const expectedAfterBooking = initialRemainingCapacity - studentCount;
          expect(afterBookingAvailability.remainingCapacity).toBe(expectedAfterBooking);

          // Cancel the booking
          await bookingService.cancelBooking(booking.id);

          // Check capacity after cancellation (without requesting any students to get true remaining)
          const afterCancellationAvailability = await bookingService.checkAvailability(
            testVenueId,
            testExperienceId,
            testDate,
            startTime,
            endTime,
            0 // Check remaining capacity without requesting any students
          );

          // Property: Capacity should be restored to initial level
          expect(afterCancellationAvailability.remainingCapacity).toBe(
            initialRemainingCapacity
          );
          
          // Verify we can book again with the same student count
          const canBookAgain = await bookingService.checkAvailability(
            testVenueId,
            testExperienceId,
            testDate,
            startTime,
            endTime,
            studentCount
          );
          expect(canBookAgain.available).toBe(true);

          // Clean up
          for (const bookingId of bookingIds) {
            await supabase.from('venue_bookings').delete().eq('id', bookingId);
            const index = createdBookingIds.indexOf(bookingId);
            if (index > -1) createdBookingIds.splice(index, 1);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * Property 19 & 20: Time slot overlap detection
   * 
   * For any two bookings with overlapping time slots, the capacity 
   * reduction SHALL apply to both bookings.
   * 
   * **Validates: Requirements 9.6, 9.7**
   */
  it('Property 19 & 20: Overlapping time slots share capacity constraints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          booking1Students: fc.integer({ min: 40, max: 60 }),
          booking2Students: fc.integer({ min: 40, max: 60 }),
          booking1Start: fc.constantFrom('09:00:00', '10:00:00'),
          booking1End: fc.constantFrom('13:00:00', '14:00:00'),
          booking2Start: fc.constantFrom('11:00:00', '12:00:00'),
          booking2End: fc.constantFrom('15:00:00', '16:00:00'),
        }),
        async (data) => {
          const testDate = '2024-08-10';
          const bookingIds: string[] = [];

          // Clean up any existing bookings for this test scenario
          await supabase
            .from('venue_bookings')
            .delete()
            .eq('experience_id', testExperienceId)
            .eq('scheduled_date', testDate);

          // Create first booking
          const { data: trip1, error: trip1Error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: testDate,
              status: 'pending',
            })
            .select()
            .single();

          if (trip1Error || !trip1) {
            throw new Error(`Failed to create trip: ${trip1Error?.message || 'Unknown error'}`);
          }

          createdTripIds.push(trip1.id);

          const booking1Input: CreateBookingInput = {
            trip_id: trip1.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: testDate,
            start_time: data.booking1Start,
            end_time: data.booking1End,
            student_count: data.booking1Students,
            quoted_price_cents: 5000,
          };

          const booking1 = await bookingService.createBooking(booking1Input);
          await bookingService.confirmBooking(booking1.id);
          bookingIds.push(booking1.id);
          createdBookingIds.push(booking1.id);

          // Try to create second booking with overlapping time
          const { data: trip2, error: trip2Error } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testUserId,
              trip_date: testDate,
              status: 'pending',
            })
            .select()
            .single();

          if (trip2Error || !trip2) {
            throw new Error(`Failed to create trip: ${trip2Error?.message || 'Unknown error'}`);
          }

          createdTripIds.push(trip2.id);

          const booking2Input: CreateBookingInput = {
            trip_id: trip2.id,
            venue_id: testVenueId,
            experience_id: testExperienceId,
            scheduled_date: testDate,
            start_time: data.booking2Start,
            end_time: data.booking2End,
            student_count: data.booking2Students,
            quoted_price_cents: 5000,
          };

          // Check if time slots overlap
          const hasOverlap =
            (data.booking2Start >= data.booking1Start && data.booking2Start < data.booking1End) ||
            (data.booking2End > data.booking1Start && data.booking2End <= data.booking1End) ||
            (data.booking2Start <= data.booking1Start && data.booking2End >= data.booking1End);

          const result = await bookingService.createBookingWithAvailabilityCheck(
            booking2Input
          );

          if (hasOverlap) {
            // Property: If time slots overlap and combined capacity exceeds max, booking should fail
            const combinedCapacity = data.booking1Students + data.booking2Students;
            if (combinedCapacity > 100) {
              expect(result.error).toBeDefined();
              expect(result.booking).toBeUndefined();
            } else {
              // If within capacity, should succeed
              expect(result.booking).toBeDefined();
              if (result.booking) {
                bookingIds.push(result.booking.id);
                createdBookingIds.push(result.booking.id);
              }
            }
          } else {
            // If no overlap, bookings are independent and should succeed
            expect(result.booking).toBeDefined();
            if (result.booking) {
              bookingIds.push(result.booking.id);
              createdBookingIds.push(result.booking.id);
            }
          }

          // Clean up
          for (const bookingId of bookingIds) {
            await supabase.from('venue_bookings').delete().eq('id', bookingId);
            const index = createdBookingIds.indexOf(bookingId);
            if (index > -1) createdBookingIds.splice(index, 1);
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);
});
