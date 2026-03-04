/**
 * Property-Based Tests - Venue Review System (Task 8.2)
 * 
 * Tests four core properties:
 * - Property 21: Review Rating Range Validation
 * - Property 22: Review Feedback Length Validation
 * - Property 23: Venue Rating Calculation
 * - Property 24: Review Uniqueness Constraint
 * 
 * **Validates: Requirements 10.2, 10.3, 10.6, 10.7, 10.11**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VenueReviewService, CreateReviewInput } from '../../venue-review-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Venue Review System (Task 8.2)', () => {
  let supabase: SupabaseClient;
  let reviewService: VenueReviewService;
  let testVenueId: string;
  let testExperienceId: string;
  let testTripId: string;
  let testUserId: string;
  const createdReviewIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    reviewService = new VenueReviewService(supabase);

    // Use the pre-created test user instead of creating a new one
    const testEmail = 'venue-review-test-user@example.com';
    const testPassword = 'testpassword123';

    // Sign in with existing user
    const signInResult = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInResult.error) {
      throw new Error(
        `Test user ${testEmail} does not exist. Please run 'npm run create-test-users' first.`
      );
    }

    testUserId = signInResult.data.user.id;

    // Create test venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: `Test Review Venue ${Date.now()}`,
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
    const { data: experience, error: experienceError } = await supabase
      .from('experiences')
      .insert({
        venue_id: testVenueId,
        title: 'Test Experience',
        description: 'Test experience for reviews',
        duration_minutes: 60,
        capacity: 50,
        min_students: 10,
        max_students: 50,
      })
      .select()
      .single();

    if (experienceError) throw experienceError;
    testExperienceId = experience.id;

    // Create test trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        experience_id: experience.id,
        teacher_id: testUserId,
        trip_date: '2024-06-15',
        status: 'completed',
      })
      .select()
      .single();

    if (tripError || !trip) {
      throw new Error(`Failed to create trip: ${tripError?.message || 'Unknown error'}`);
    }
    testTripId = trip.id;
  });

  afterEach(async () => {
    // Clean up created reviews
    if (createdReviewIds.length > 0) {
      await supabase.from('venue_reviews').delete().in('id', createdReviewIds);
      createdReviewIds.length = 0;
    }

    // Clean up test trip
    if (testTripId) {
      await supabase.from('trips').delete().eq('id', testTripId);
    }

    // Clean up test venue
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }

    // Note: We keep the test user for reuse
  });

  /**
   * Property 21: Review Rating Range Validation
   * 
   * For any review submission, if the overall rating or any aspect rating 
   * is outside the range 1-5, the submission SHALL be rejected.
   * 
   * **Validates: Requirements 10.2**
   */
  it('Property 21: Overall rating outside 1-5 range is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -100, max: 100 }).filter(n => n < 1 || n > 5),
        fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
        async (invalidRating, feedbackText) => {
          const input: CreateReviewInput = {
            venue_id: testVenueId,
            trip_id: testTripId,
            overall_rating: invalidRating,
            feedback_text: feedbackText,
          };

          // Property: Invalid rating should be rejected
          await expect(reviewService.submitReview(input)).rejects.toThrow(
            'Overall rating must be between 1 and 5'
          );
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 21: Valid overall rating (1-5) is accepted
   * 
   * For any review submission with overall rating between 1 and 5, 
   * the submission SHALL be accepted.
   * 
   * **Validates: Requirements 10.2**
   */
  it('Property 21: Overall rating within 1-5 range is accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
        async (validRating, feedbackText) => {
          const input: CreateReviewInput = {
            venue_id: testVenueId,
            trip_id: testTripId,
            overall_rating: validRating,
            feedback_text: feedbackText,
          };

          // Property: Valid rating should be accepted
          const review = await reviewService.submitReview(input);
          createdReviewIds.push(review.id);

          expect(review.overall_rating).toBe(validRating);
          expect(review.overall_rating).toBeGreaterThanOrEqual(1);
          expect(review.overall_rating).toBeLessThanOrEqual(5);

          // Clean up for next iteration
          await supabase.from('venue_reviews').delete().eq('id', review.id);
          const index = createdReviewIds.indexOf(review.id);
          if (index > -1) createdReviewIds.splice(index, 1);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 21: Aspect ratings outside 1-5 range are rejected
   * 
   * For any review submission with aspect ratings outside the range 1-5, 
   * the submission SHALL be rejected.
   * 
   * **Validates: Requirements 10.2**
   */
  it('Property 21: Aspect ratings outside 1-5 range are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: -100, max: 100 }).filter(n => n < 1 || n > 5),
        fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
        async (validOverall, invalidAspect, feedbackText) => {
          const input: CreateReviewInput = {
            venue_id: testVenueId,
            trip_id: testTripId,
            overall_rating: validOverall,
            educational_value_rating: invalidAspect,
            feedback_text: feedbackText,
          };

          // Property: Invalid aspect rating should be rejected
          await expect(reviewService.submitReview(input)).rejects.toThrow(
            'All aspect ratings must be between 1 and 5'
          );
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 21: All aspect ratings within 1-5 range are accepted
   * 
   * For any review submission with all aspect ratings between 1 and 5, 
   * the submission SHALL be accepted.
   * 
   * **Validates: Requirements 10.2**
   */
  it('Property 21: All aspect ratings within 1-5 range are accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          overall: fc.integer({ min: 1, max: 5 }),
          educational: fc.integer({ min: 1, max: 5 }),
          staff: fc.integer({ min: 1, max: 5 }),
          facilities: fc.integer({ min: 1, max: 5 }),
          value: fc.integer({ min: 1, max: 5 }),
          feedback: fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
        }),
        async (ratings) => {
          const input: CreateReviewInput = {
            venue_id: testVenueId,
            trip_id: testTripId,
            overall_rating: ratings.overall,
            educational_value_rating: ratings.educational,
            staff_quality_rating: ratings.staff,
            facilities_rating: ratings.facilities,
            value_rating: ratings.value,
            feedback_text: ratings.feedback,
          };

          // Property: All valid ratings should be accepted
          const review = await reviewService.submitReview(input);
          createdReviewIds.push(review.id);

          expect(review.overall_rating).toBe(ratings.overall);
          expect(review.educational_value_rating).toBe(ratings.educational);
          expect(review.staff_quality_rating).toBe(ratings.staff);
          expect(review.facilities_rating).toBe(ratings.facilities);
          expect(review.value_rating).toBe(ratings.value);

          // All ratings should be in valid range
          expect(review.overall_rating).toBeGreaterThanOrEqual(1);
          expect(review.overall_rating).toBeLessThanOrEqual(5);
          expect(review.educational_value_rating!).toBeGreaterThanOrEqual(1);
          expect(review.educational_value_rating!).toBeLessThanOrEqual(5);

          // Clean up for next iteration
          await supabase.from('venue_reviews').delete().eq('id', review.id);
          const index = createdReviewIds.indexOf(review.id);
          if (index > -1) createdReviewIds.splice(index, 1);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 22: Review Feedback Length Validation
   * 
   * For any review with written feedback exceeding 2000 characters, 
   * the submission SHALL be rejected.
   * 
   * **Validates: Requirements 10.3**
   */
  it('Property 22: Feedback text under 50 characters is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 1, maxLength: 49 }),
        async (rating, shortFeedback) => {
          const input: CreateReviewInput = {
            venue_id: testVenueId,
            trip_id: testTripId,
            overall_rating: rating,
            feedback_text: shortFeedback,
          };

          // Property: Feedback under 50 characters should be rejected
          await expect(reviewService.submitReview(input)).rejects.toThrow(
            'Feedback text must be at least 50 characters'
          );
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 22: Feedback text at least 50 characters is accepted
   * 
   * For any review with written feedback of at least 50 characters, 
   * the submission SHALL be accepted.
   * 
   * **Validates: Requirements 10.3**
   */
  it('Property 22: Feedback text at least 50 characters is accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 50, maxLength: 2000 }).filter(s => s.trim().length >= 50),
        async (rating, validFeedback) => {
          const input: CreateReviewInput = {
            venue_id: testVenueId,
            trip_id: testTripId,
            overall_rating: rating,
            feedback_text: validFeedback,
          };

          // Property: Feedback with at least 50 characters should be accepted
          const review = await reviewService.submitReview(input);
          createdReviewIds.push(review.id);

          expect(review.feedback_text).toBe(validFeedback);
          expect(review.feedback_text!.length).toBeGreaterThanOrEqual(50);
          expect(review.feedback_text!.length).toBeLessThanOrEqual(2000);

          // Clean up for next iteration
          await supabase.from('venue_reviews').delete().eq('id', review.id);
          const index = createdReviewIds.indexOf(review.id);
          if (index > -1) createdReviewIds.splice(index, 1);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 23: Venue Rating Calculation
   * 
   * For any venue with N non-flagged reviews, the venue's rating SHALL equal 
   * the arithmetic mean of all non-flagged review overall ratings, and the 
   * review count SHALL equal N.
   * 
   * **Validates: Requirements 10.6, 10.7**
   */
  it('Property 23: Venue rating is arithmetic mean of non-flagged reviews', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            rating: fc.integer({ min: 1, max: 5 }),
            feedback: fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (reviews) => {
          // Create multiple reviews for the venue
          const reviewIds: string[] = [];
          
          for (const reviewData of reviews) {
            // Create a new trip for each review to avoid uniqueness constraint
            const { data: trip, error: tripError } = await supabase
              .from('trips')
              .insert({
                experience_id: testExperienceId,
                teacher_id: testUserId,
                trip_date: '2024-06-15',
                status: 'completed',
              })
              .select()
              .single();

            if (tripError || !trip) {
              throw new Error(`Failed to create trip: ${tripError?.message || 'Unknown error'}`);
            }

            const input: CreateReviewInput = {
              venue_id: testVenueId,
              trip_id: trip.id,
              overall_rating: reviewData.rating,
              feedback_text: reviewData.feedback,
            };

            const review = await reviewService.submitReview(input);
            reviewIds.push(review.id);
            createdReviewIds.push(review.id);
          }

          // Wait for trigger to update venue rating
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Get updated venue data
          const { data: venue } = await supabase
            .from('venues')
            .select('rating, review_count')
            .eq('id', testVenueId)
            .single();

          // Calculate expected average
          const expectedAverage = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          const expectedRounded = Math.round(expectedAverage * 100) / 100;

          // Property: Venue rating should equal arithmetic mean
          expect(venue!.rating).toBeCloseTo(expectedRounded, 2);
          
          // Property: Review count should equal number of reviews
          expect(venue!.review_count).toBe(reviews.length);

          // Clean up trips
          for (const reviewId of reviewIds) {
            const { data: review } = await supabase
              .from('venue_reviews')
              .select('trip_id')
              .eq('id', reviewId)
              .single();
            
            if (review) {
              await supabase.from('trips').delete().eq('id', review.trip_id);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 180000);

  /**
   * Property 23: Flagged reviews are excluded from venue rating calculation
   * 
   * For any venue with flagged reviews, those reviews SHALL NOT be included 
   * in the venue's rating calculation.
   * 
   * **Validates: Requirements 10.6, 10.7**
   */
  it('Property 23: Flagged reviews excluded from rating calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            rating: fc.integer({ min: 1, max: 5 }),
            feedback: fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
            flagged: fc.boolean(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (reviews) => {
          // Create multiple reviews for the venue
          const reviewIds: string[] = [];
          
          for (const reviewData of reviews) {
            // Create a new trip for each review
            const { data: trip, error: tripError } = await supabase
              .from('trips')
              .insert({
                experience_id: testExperienceId,
                teacher_id: testUserId,
                trip_date: '2024-06-15',
                status: 'completed',
              })
              .select()
              .single();

            if (tripError || !trip) {
              throw new Error(`Failed to create trip: ${tripError?.message || 'Unknown error'}`);
            }

            const input: CreateReviewInput = {
              venue_id: testVenueId,
              trip_id: trip.id,
              overall_rating: reviewData.rating,
              feedback_text: reviewData.feedback,
            };

            const review = await reviewService.submitReview(input);
            reviewIds.push(review.id);
            createdReviewIds.push(review.id);

            // Flag the review if specified
            if (reviewData.flagged) {
              await reviewService.flagReview(review.id, {
                flag_reason: 'Test flagging',
              });
            }
          }

          // Wait for trigger to update venue rating
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Get updated venue data
          const { data: venue } = await supabase
            .from('venues')
            .select('rating, review_count')
            .eq('id', testVenueId)
            .single();

          // Calculate expected average (only non-flagged reviews)
          const nonFlaggedReviews = reviews.filter(r => !r.flagged);
          
          if (nonFlaggedReviews.length > 0) {
            const expectedAverage = nonFlaggedReviews.reduce((sum, r) => sum + r.rating, 0) / nonFlaggedReviews.length;
            const expectedRounded = Math.round(expectedAverage * 100) / 100;

            // Property: Venue rating should only include non-flagged reviews
            expect(venue!.rating).toBeCloseTo(expectedRounded, 2);
            expect(venue!.review_count).toBe(nonFlaggedReviews.length);
          } else {
            // If all reviews are flagged, rating should be 0
            expect(venue!.rating).toBe(0);
            expect(venue!.review_count).toBe(0);
          }

          // Clean up trips
          for (const reviewId of reviewIds) {
            const { data: review } = await supabase
              .from('venue_reviews')
              .select('trip_id')
              .eq('id', reviewId)
              .single();
            
            if (review) {
              await supabase.from('trips').delete().eq('id', review.trip_id);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 180000);

  /**
   * Property 24: Review Uniqueness Constraint
   * 
   * For any teacher-venue-trip combination, at most one review SHALL exist; 
   * attempting to create a second review for the same combination SHALL be rejected.
   * 
   * **Validates: Requirements 10.11**
   */
  it('Property 24: Duplicate reviews for same venue/trip are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          rating1: fc.integer({ min: 1, max: 5 }),
          rating2: fc.integer({ min: 1, max: 5 }),
          feedback1: fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
          feedback2: fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
        }),
        async (data) => {
          // Create first review
          const input1: CreateReviewInput = {
            venue_id: testVenueId,
            trip_id: testTripId,
            overall_rating: data.rating1,
            feedback_text: data.feedback1,
          };

          const review1 = await reviewService.submitReview(input1);
          createdReviewIds.push(review1.id);

          // Attempt to create duplicate review
          const input2: CreateReviewInput = {
            venue_id: testVenueId,
            trip_id: testTripId,
            overall_rating: data.rating2,
            feedback_text: data.feedback2,
          };

          // Property: Duplicate review should be rejected
          await expect(reviewService.submitReview(input2)).rejects.toThrow(
            'You have already reviewed this venue for this trip'
          );

          // Clean up for next iteration
          await supabase.from('venue_reviews').delete().eq('id', review1.id);
          const index = createdReviewIds.indexOf(review1.id);
          if (index > -1) createdReviewIds.splice(index, 1);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 24: Reviews for different trips are allowed
   * 
   * For any teacher-venue combination, multiple reviews SHALL be allowed 
   * if they are for different trips.
   * 
   * **Validates: Requirements 10.11**
   */
  it('Property 24: Reviews for different trips are allowed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            rating: fc.integer({ min: 1, max: 5 }),
            feedback: fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length >= 50),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (reviews) => {
          const reviewIds: string[] = [];
          const tripIds: string[] = [];

          // Create multiple reviews for different trips
          for (const reviewData of reviews) {
            // Create a new trip for each review
            const { data: trip, error: tripError } = await supabase
              .from('trips')
              .insert({
                experience_id: testExperienceId,
                teacher_id: testUserId,
                trip_date: '2024-06-15',
                status: 'completed',
              })
              .select()
              .single();

            if (tripError || !trip) {
              throw new Error(`Failed to create trip: ${tripError?.message || 'Unknown error'}`);
            }

            tripIds.push(trip.id);

            const input: CreateReviewInput = {
              venue_id: testVenueId,
              trip_id: trip.id,
              overall_rating: reviewData.rating,
              feedback_text: reviewData.feedback,
            };

            // Property: Review for different trip should be accepted
            const review = await reviewService.submitReview(input);
            reviewIds.push(review.id);
            createdReviewIds.push(review.id);

            expect(review.venue_id).toBe(testVenueId);
            expect(review.trip_id).toBe(trip!.id);
          }

          // Property: All reviews should have been created successfully
          expect(reviewIds.length).toBe(reviews.length);

          // Clean up trips
          for (const tripId of tripIds) {
            await supabase.from('trips').delete().eq('id', tripId);
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 180000);
});
