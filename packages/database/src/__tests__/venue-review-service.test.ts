/**
 * Unit Tests for Venue Review Service
 * 
 * Tests review submission, venue responses, moderation, and statistics.
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9, 10.10
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  VenueReviewService,
  createVenueReviewService,
  CreateReviewInput,
} from '../venue-review-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('VenueReviewService', () => {
  let supabase: SupabaseClient;
  let reviewService: VenueReviewService;
  let testVenueId: string;
  let testTripId: string;
  let testTripId2: string;
  let testTripId3: string;
  let testUserId: string;
  let testReviewId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    reviewService = createVenueReviewService(supabase);

    // Use a fixed test user to avoid creating new users on every test run
    const testEmail = 'venue-review-test-user@example.com';
    const testPassword = 'testpassword123';

    // Try to sign in with existing user
    const signInResult = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInResult.error) {
      // User doesn't exist - skip tests with helpful message
      console.warn('\n⚠️  Test user does not exist. Please create it manually:');
      console.warn('   1. Go to your Supabase dashboard');
      console.warn('   2. Navigate to Authentication > Users');
      console.warn(`   3. Create a user with email: ${testEmail}`);
      console.warn(`   4. Set password: ${testPassword}`);
      console.warn('   5. Confirm the email address\n');
      console.warn('   OR add SUPABASE_SERVICE_ROLE_KEY to .env to auto-create users\n');
      
      // Skip all tests in this suite
      throw new Error(
        `Test user ${testEmail} does not exist. Please create it manually in Supabase dashboard or add SUPABASE_SERVICE_ROLE_KEY to .env`
      );
    }
    
    testUserId = signInResult.data.user.id;

    // Create teacher record for the test user
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        id: testUserId,
        user_id: testUserId,
        first_name: 'Test',
        last_name: 'Teacher',
        email: testEmail,
      });

    if (teacherError && teacherError.code !== '23505') { // Ignore duplicate key errors
      throw teacherError;
    }

    // Create test venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: 'Test Review Venue',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
        contact_email: 'test@venue.com',
        contact_phone: '555-0100',
      })
      .select()
      .single();

    if (venueError) throw venueError;
    testVenueId = venue.id;

    // Create test experience for the venue
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

    if (tripError) throw tripError;
    testTripId = trip.id;

    // Create additional trips for tests that need multiple reviews
    const { data: trip2, error: trip2Error } = await supabase
      .from('trips')
      .insert({
        experience_id: experience.id,
        teacher_id: testUserId,
        trip_date: '2024-06-16',
        status: 'completed',
      })
      .select()
      .single();

    if (trip2Error) throw trip2Error;
    testTripId2 = trip2.id;

    const { data: trip3, error: trip3Error } = await supabase
      .from('trips')
      .insert({
        experience_id: experience.id,
        teacher_id: testUserId,
        trip_date: '2024-06-17',
        status: 'completed',
      })
      .select()
      .single();

    if (trip3Error) throw trip3Error;
    testTripId3 = trip3.id;
  });

  afterAll(async () => {
    // Cleanup - but don't delete the shared test user
    if (testReviewId) {
      await supabase.from('venue_reviews').delete().eq('id', testReviewId);
    }
    if (testTripId3) {
      await supabase.from('trips').delete().eq('id', testTripId3);
    }
    if (testTripId2) {
      await supabase.from('trips').delete().eq('id', testTripId2);
    }
    if (testTripId) {
      await supabase.from('trips').delete().eq('id', testTripId);
    }
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }
    // Note: We keep the test user for reuse across test runs
  });

  describe('submitReview', () => {
    beforeEach(async () => {
      // Clean up any reviews from previous tests
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
    });

    afterEach(async () => {
      // Clean up reviews created in this test block
      if (testReviewId) {
        await supabase.from('venue_reviews').delete().eq('id', testReviewId);
        testReviewId = '';
      }
    });

    it('should submit a review with overall rating', async () => {
      const input: CreateReviewInput = {
        venue_id: testVenueId,
        trip_id: testTripId,
        overall_rating: 5,
        feedback_text: 'This is a great venue with excellent educational value for students. Highly recommended!',
      };

      const review = await reviewService.submitReview(input);
      testReviewId = review.id;

      expect(review).toBeDefined();
      expect(review.venue_id).toBe(testVenueId);
      expect(review.trip_id).toBe(testTripId);
      expect(review.overall_rating).toBe(5);
      expect(review.feedback_text).toBe(input.feedback_text);
      expect(review.flagged).toBe(false);
    });

    it('should submit a review with multi-aspect ratings', async () => {
      const input: CreateReviewInput = {
        venue_id: testVenueId,
        trip_id: testTripId,
        overall_rating: 4,
        educational_value_rating: 5,
        staff_quality_rating: 4,
        facilities_rating: 4,
        value_rating: 3,
        feedback_text: 'Great educational experience with helpful staff and good facilities. Price was a bit high.',
      };

      const review = await reviewService.submitReview(input);
      testReviewId = review.id;

      expect(review.overall_rating).toBe(4);
      expect(review.educational_value_rating).toBe(5);
      expect(review.staff_quality_rating).toBe(4);
      expect(review.facilities_rating).toBe(4);
      expect(review.value_rating).toBe(3);
    });

    it('should submit a review with photos', async () => {
      const input: CreateReviewInput = {
        venue_id: testVenueId,
        trip_id: testTripId,
        overall_rating: 5,
        feedback_text: 'Amazing venue with beautiful exhibits. Students loved the interactive displays!',
        photos: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
        ],
      };

      const review = await reviewService.submitReview(input);
      testReviewId = review.id;

      expect(review.photos).toHaveLength(2);
      expect(review.photos).toContain('https://example.com/photo1.jpg');
    });

    it('should reject review with invalid overall rating', async () => {
      const input: CreateReviewInput = {
        venue_id: testVenueId,
        trip_id: testTripId,
        overall_rating: 6, // Invalid: must be 1-5
        feedback_text: 'This should fail due to invalid rating value for the review system.',
      };

      await expect(reviewService.submitReview(input)).rejects.toThrow(
        'Overall rating must be between 1 and 5'
      );
    });

    it('should reject review with feedback text less than 50 characters', async () => {
      const input: CreateReviewInput = {
        venue_id: testVenueId,
        trip_id: testTripId,
        overall_rating: 4,
        feedback_text: 'Too short', // Less than 50 characters
      };

      await expect(reviewService.submitReview(input)).rejects.toThrow(
        'Feedback text must be at least 50 characters'
      );
    });

    it('should prevent duplicate reviews for same venue/trip', async () => {
      const input: CreateReviewInput = {
        venue_id: testVenueId,
        trip_id: testTripId,
        overall_rating: 4,
        feedback_text: 'First review with sufficient length to meet the minimum character requirement.',
      };

      // Submit first review
      const review = await reviewService.submitReview(input);
      testReviewId = review.id;

      // Attempt to submit duplicate
      await expect(reviewService.submitReview(input)).rejects.toThrow(
        'You have already reviewed this venue for this trip'
      );
    });
  });

  describe('getVenueReviews', () => {
    beforeEach(async () => {
      // Clean up first, then create test reviews
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
      
      // Create multiple test reviews using different trips
      const reviews = [
        {
          venue_id: testVenueId,
          trip_id: testTripId,
          user_id: testUserId,
          overall_rating: 5,
          feedback_text: 'Excellent venue with great educational content for all students!',
        },
        {
          venue_id: testVenueId,
          trip_id: testTripId2,
          user_id: testUserId,
          overall_rating: 4,
          feedback_text: 'Very good venue with helpful staff and interesting exhibits.',
        },
      ];

      const { error } = await supabase.from('venue_reviews').insert(reviews);
      if (error) {
        console.error('Failed to insert test reviews:', error);
        throw error;
      }
    });

    it('should get all reviews for a venue', async () => {
      const reviews = await reviewService.getVenueReviews(testVenueId);

      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews.every((r) => r.venue_id === testVenueId)).toBe(true);
    });

    it('should exclude flagged reviews by default', async () => {
      // Flag one review
      const allReviews = await reviewService.getVenueReviews(testVenueId);
      if (allReviews.length > 0) {
        await reviewService.flagReview(allReviews[0].id, {
          flag_reason: 'Inappropriate content',
        });
      }

      const reviews = await reviewService.getVenueReviews(testVenueId);
      expect(reviews.every((r) => !r.flagged)).toBe(true);
    });

    it('should include flagged reviews when requested', async () => {
      const reviews = await reviewService.getVenueReviews(testVenueId, {
        includeFlaged: true,
      });

      expect(reviews.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const reviews = await reviewService.getVenueReviews(testVenueId, {
        limit: 1,
        offset: 0,
      });

      expect(reviews.length).toBeLessThanOrEqual(1);
    });

    it('should support sorting by rating', async () => {
      const reviews = await reviewService.getVenueReviews(testVenueId, {
        sortBy: 'overall_rating',
        sortOrder: 'desc',
      });

      if (reviews.length > 1) {
        expect(reviews[0].overall_rating).toBeGreaterThanOrEqual(
          reviews[1].overall_rating
        );
      }
    });
  });

  describe('updateReview', () => {
    beforeEach(async () => {
      // Clean up any reviews from previous tests
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
      
      const { data } = await supabase
        .from('venue_reviews')
        .insert({
          venue_id: testVenueId,
          trip_id: testTripId,
          user_id: testUserId,
          overall_rating: 4,
          feedback_text: 'Initial review with sufficient length for testing purposes.',
        })
        .select()
        .single();

      testReviewId = data!.id;
    });

    it('should update review rating', async () => {
      const updated = await reviewService.updateReview(testReviewId, {
        overall_rating: 5,
      });

      expect(updated.overall_rating).toBe(5);
    });

    it('should update review feedback text', async () => {
      const newFeedback = 'Updated feedback with much more detail about our wonderful experience at this venue!';
      const updated = await reviewService.updateReview(testReviewId, {
        feedback_text: newFeedback,
      });

      expect(updated.feedback_text).toBe(newFeedback);
    });

    it('should reject update with invalid rating', async () => {
      await expect(
        reviewService.updateReview(testReviewId, {
          overall_rating: 0,
        })
      ).rejects.toThrow('Overall rating must be between 1 and 5');
    });
  });

  describe('addVenueResponse', () => {
    beforeEach(async () => {
      // Clean up any reviews from previous tests
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
      
      const { data } = await supabase
        .from('venue_reviews')
        .insert({
          venue_id: testVenueId,
          trip_id: testTripId,
          user_id: testUserId,
          overall_rating: 4,
          feedback_text: 'Good venue but could improve in some areas for better experience.',
        })
        .select()
        .single();

      testReviewId = data!.id;
    });

    it('should add venue response to review', async () => {
      const response = 'Thank you for your feedback! We appreciate your visit.';
      const updated = await reviewService.addVenueResponse(testReviewId, {
        venue_response: response,
      });

      expect(updated.venue_response).toBe(response);
      expect(updated.venue_response_at).toBeDefined();
      expect(updated.venue_response_by).toBeDefined();
    });

    it('should reject empty venue response', async () => {
      await expect(
        reviewService.addVenueResponse(testReviewId, {
          venue_response: '',
        })
      ).rejects.toThrow('Venue response cannot be empty');
    });

    it('should remove venue response', async () => {
      // First add a response
      await reviewService.addVenueResponse(testReviewId, {
        venue_response: 'Thank you for your feedback!',
      });

      // Then remove it
      const updated = await reviewService.removeVenueResponse(testReviewId);

      expect(updated.venue_response).toBeNull();
      expect(updated.venue_response_at).toBeNull();
      expect(updated.venue_response_by).toBeNull();
    });
  });

  describe('flagReview', () => {
    beforeEach(async () => {
      // Clean up any reviews from previous tests
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
      
      const { data } = await supabase
        .from('venue_reviews')
        .insert({
          venue_id: testVenueId,
          trip_id: testTripId,
          user_id: testUserId,
          overall_rating: 1,
          feedback_text: 'This review contains inappropriate content that should be flagged.',
        })
        .select()
        .single();

      testReviewId = data!.id;
    });

    it('should flag a review for moderation', async () => {
      const flagged = await reviewService.flagReview(testReviewId, {
        flag_reason: 'Inappropriate language',
      });

      expect(flagged.flagged).toBe(true);
      expect(flagged.flag_reason).toBe('Inappropriate language');
    });

    it('should reject flagging without reason', async () => {
      await expect(
        reviewService.flagReview(testReviewId, {
          flag_reason: '',
        })
      ).rejects.toThrow('Flag reason is required');
    });
  });

  describe('moderateReview', () => {
    beforeEach(async () => {
      // Clean up any reviews from previous tests
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
      
      const { data } = await supabase
        .from('venue_reviews')
        .insert({
          venue_id: testVenueId,
          trip_id: testTripId,
          user_id: testUserId,
          overall_rating: 1,
          feedback_text: 'Flagged review that needs moderation by administrator.',
          flagged: true,
          flag_reason: 'Spam',
        })
        .select()
        .single();

      testReviewId = data!.id;
    });

    it('should moderate a flagged review', async () => {
      const moderated = await reviewService.moderateReview(testReviewId, {
        reviewed_by_admin: true,
        admin_notes: 'Review is acceptable, unflagging',
        flagged: false,
      });

      expect(moderated.reviewed_by_admin).toBe(true);
      expect(moderated.admin_notes).toBe('Review is acceptable, unflagging');
      expect(moderated.flagged).toBe(false);
    });

    it('should keep review flagged if admin decides', async () => {
      const moderated = await reviewService.moderateReview(testReviewId, {
        reviewed_by_admin: true,
        admin_notes: 'Review violates guidelines, keeping flagged',
        flagged: true,
      });

      expect(moderated.reviewed_by_admin).toBe(true);
      expect(moderated.flagged).toBe(true);
    });
  });

  describe('getVenueRatingStats', () => {
    beforeEach(async () => {
      // Clean up first, then create test reviews
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
      
      // Create multiple reviews with different ratings using different trips
      const reviews = [
        {
          venue_id: testVenueId,
          trip_id: testTripId,
          user_id: testUserId,
          overall_rating: 5,
          educational_value_rating: 5,
          staff_quality_rating: 4,
          facilities_rating: 5,
          value_rating: 4,
          feedback_text: 'Excellent venue with outstanding educational programs!',
        },
        {
          venue_id: testVenueId,
          trip_id: testTripId2,
          user_id: testUserId,
          overall_rating: 4,
          educational_value_rating: 4,
          staff_quality_rating: 5,
          facilities_rating: 4,
          value_rating: 3,
          feedback_text: 'Very good venue with helpful staff and good facilities.',
        },
      ];

      const { error } = await supabase.from('venue_reviews').insert(reviews);
      if (error) {
        console.error('Failed to insert test reviews:', error);
        throw error;
      }
    });

    it('should calculate average ratings correctly', async () => {
      const stats = await reviewService.getVenueRatingStats(testVenueId);

      expect(stats.venue_id).toBe(testVenueId);
      expect(stats.total_reviews).toBeGreaterThan(0);
      expect(stats.average_overall_rating).toBeGreaterThan(0);
      expect(stats.average_overall_rating).toBeLessThanOrEqual(5);
    });

    it('should return zero stats for venue with no reviews', async () => {
      // Create a new venue with no reviews
      const { data: newVenue } = await supabase
        .from('venues')
        .insert({
          name: 'No Reviews Venue',
          address: { street: '456 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
          contact_email: 'noreview@venue.com',
          contact_phone: '555-0200',
        })
        .select()
        .single();

      const stats = await reviewService.getVenueRatingStats(newVenue!.id);

      expect(stats.total_reviews).toBe(0);
      expect(stats.average_overall_rating).toBe(0);

      // Cleanup
      await supabase.from('venues').delete().eq('id', newVenue!.id);
    });
  });

  describe('canUserReviewTrip', () => {
    beforeEach(async () => {
      // Clean up any reviews from previous tests
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
    });

    it('should return true if user has not reviewed trip', async () => {
      const canReview = await reviewService.canUserReviewTrip(
        testUserId,
        testTripId
      );

      expect(canReview).toBe(true);
    });

    it('should return false if user has already reviewed trip', async () => {
      // Create a review
      await supabase.from('venue_reviews').insert({
        venue_id: testVenueId,
        trip_id: testTripId,
        user_id: testUserId,
        overall_rating: 4,
        feedback_text: 'Already reviewed this trip with detailed feedback.',
      });

      const canReview = await reviewService.canUserReviewTrip(
        testUserId,
        testTripId
      );

      expect(canReview).toBe(false);
    });
  });

  describe('getFlaggedReviews', () => {
    beforeEach(async () => {
      // Clean up first, then create test reviews
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
      
      // Create flagged and unflagged reviews using different trips
      const { error } = await supabase.from('venue_reviews').insert([
        {
          venue_id: testVenueId,
          trip_id: testTripId,
          user_id: testUserId,
          overall_rating: 1,
          feedback_text: 'Flagged review number one that needs administrator attention.',
          flagged: true,
          flag_reason: 'Spam',
        },
        {
          venue_id: testVenueId,
          trip_id: testTripId2,
          user_id: testUserId,
          overall_rating: 5,
          feedback_text: 'Normal review that is not flagged and should not appear.',
          flagged: false,
        },
      ]);
      
      if (error) {
        console.error('Failed to insert test reviews:', error);
        throw error;
      }
    });

    it('should get all flagged reviews', async () => {
      const flagged = await reviewService.getFlaggedReviews();

      expect(flagged.length).toBeGreaterThan(0);
      expect(flagged.every((r) => r.flagged)).toBe(true);
    });

    it('should get unmoderated flagged reviews', async () => {
      const unmoderated = await reviewService.getUnmoderatedReviews();

      expect(unmoderated.every((r) => r.flagged && !r.reviewed_by_admin)).toBe(
        true
      );
    });
  });

  describe('getRecentReviews', () => {
    beforeEach(async () => {
      // Clean up first, then create test reviews
      await supabase.from('venue_reviews').delete().eq('venue_id', testVenueId);
      
      // Create reviews with different timestamps using different trips
      const { error } = await supabase.from('venue_reviews').insert([
        {
          venue_id: testVenueId,
          trip_id: testTripId,
          user_id: testUserId,
          overall_rating: 5,
          feedback_text: 'Recent review one with excellent feedback about the venue.',
        },
        {
          venue_id: testVenueId,
          trip_id: testTripId2,
          user_id: testUserId,
          overall_rating: 4,
          feedback_text: 'Recent review two with good feedback about the experience.',
        },
      ]);
      
      if (error) {
        console.error('Failed to insert test reviews:', error);
        throw error;
      }
    });

    it('should get recent reviews', async () => {
      const recent = await reviewService.getRecentReviews(5);

      expect(recent.length).toBeGreaterThan(0);
      expect(recent.length).toBeLessThanOrEqual(5);
    });

    it('should order reviews by creation date descending', async () => {
      const recent = await reviewService.getRecentReviews(10);

      if (recent.length > 1) {
        const firstDate = new Date(recent[0].created_at);
        const secondDate = new Date(recent[1].created_at);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });
});
