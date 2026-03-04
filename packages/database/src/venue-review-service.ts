/**
 * Venue Review Service
 * 
 * Provides functionality for managing venue reviews and ratings.
 * Supports multi-aspect ratings, venue responses, and moderation.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9, 10.10
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// Types and Interfaces
// =====================================================

export interface VenueReview {
  id: string;
  venue_id: string;
  trip_id: string;
  user_id: string;
  overall_rating: number;
  educational_value_rating: number | null;
  staff_quality_rating: number | null;
  facilities_rating: number | null;
  value_rating: number | null;
  feedback_text: string | null;
  photos: string[];
  venue_response: string | null;
  venue_response_at: string | null;
  venue_response_by: string | null;
  flagged: boolean;
  flag_reason: string | null;
  reviewed_by_admin: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewInput {
  venue_id: string;
  trip_id: string;
  overall_rating: number;
  educational_value_rating?: number;
  staff_quality_rating?: number;
  facilities_rating?: number;
  value_rating?: number;
  feedback_text?: string;
  photos?: string[];
}

export interface UpdateReviewInput {
  overall_rating?: number;
  educational_value_rating?: number;
  staff_quality_rating?: number;
  facilities_rating?: number;
  value_rating?: number;
  feedback_text?: string;
  photos?: string[];
}

export interface AddVenueResponseInput {
  venue_response: string;
}

export interface FlagReviewInput {
  flag_reason: string;
}

export interface ModerateReviewInput {
  reviewed_by_admin: boolean;
  admin_notes?: string;
  flagged?: boolean;
}

export interface ReviewWithVenueInfo extends VenueReview {
  venue_name?: string;
  venue_location?: string;
}

export interface ReviewWithUserInfo extends VenueReview {
  user_name?: string;
  user_email?: string;
}

export interface VenueRatingStats {
  venue_id: string;
  average_overall_rating: number;
  average_educational_value: number;
  average_staff_quality: number;
  average_facilities: number;
  average_value: number;
  total_reviews: number;
}

// =====================================================
// Venue Review Service
// =====================================================

export class VenueReviewService {
  constructor(private supabase: SupabaseClient) {}

  // =====================================================
  // Review Management
  // =====================================================

  /**
   * Submit a new review
   * Requirement 10.1: Teachers can submit reviews after trip completion
   * Requirement 10.2: Reviews include overall rating and multi-aspect ratings
   * Requirement 10.3: Reviews include text feedback
   * Requirement 10.4: Reviews can include photos
   */
  async submitReview(input: CreateReviewInput): Promise<VenueReview> {
    // Validate overall rating
    if (input.overall_rating < 1 || input.overall_rating > 5) {
      throw new Error('Overall rating must be between 1 and 5');
    }

    // Validate feedback text length if provided
    if (input.feedback_text && input.feedback_text.trim().length < 50) {
      throw new Error('Feedback text must be at least 50 characters');
    }

    // Validate aspect ratings if provided
    const aspectRatings = [
      input.educational_value_rating,
      input.staff_quality_rating,
      input.facilities_rating,
      input.value_rating,
    ];

    for (const rating of aspectRatings) {
      if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
        throw new Error('All aspect ratings must be between 1 and 5');
      }
    }

    const { data, error } = await this.supabase
      .from('venue_reviews')
      .insert({
        venue_id: input.venue_id,
        trip_id: input.trip_id,
        user_id: (await this.supabase.auth.getUser()).data.user?.id,
        overall_rating: input.overall_rating,
        educational_value_rating: input.educational_value_rating || null,
        staff_quality_rating: input.staff_quality_rating || null,
        facilities_rating: input.facilities_rating || null,
        value_rating: input.value_rating || null,
        feedback_text: input.feedback_text || null,
        photos: input.photos || [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already reviewed this venue for this trip');
      }
      throw error;
    }

    return data;
  }

  /**
   * Get all reviews for a venue
   * Requirement 10.6, 10.7: Display reviews with ratings
   */
  async getVenueReviews(
    venueId: string,
    options?: {
      includeFlaged?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'overall_rating';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<VenueReview[]> {
    let query = this.supabase
      .from('venue_reviews')
      .select('*')
      .eq('venue_id', venueId);

    // Filter out flagged reviews unless explicitly requested
    if (!options?.includeFlaged) {
      query = query.eq('flagged', false);
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single review by ID
   */
  async getReviewById(reviewId: string): Promise<VenueReview | null> {
    const { data, error } = await this.supabase
      .from('venue_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Get reviews by a specific user
   */
  async getUserReviews(userId: string): Promise<VenueReview[]> {
    const { data, error } = await this.supabase
      .from('venue_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get review for a specific trip
   */
  async getTripReview(tripId: string): Promise<VenueReview | null> {
    const { data, error } = await this.supabase
      .from('venue_reviews')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    input: UpdateReviewInput
  ): Promise<VenueReview> {
    // Validate ratings if provided
    if (input.overall_rating !== undefined && (input.overall_rating < 1 || input.overall_rating > 5)) {
      throw new Error('Overall rating must be between 1 and 5');
    }

    // Validate feedback text length if provided
    if (input.feedback_text !== undefined && input.feedback_text.trim().length < 50) {
      throw new Error('Feedback text must be at least 50 characters');
    }

    const updateData: any = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('venue_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await this.supabase
      .from('venue_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  }

  // =====================================================
  // Venue Response Management
  // =====================================================

  /**
   * Add venue response to a review
   * Requirement 10.5: Venues can respond to reviews
   */
  async addVenueResponse(
    reviewId: string,
    input: AddVenueResponseInput
  ): Promise<VenueReview> {
    if (!input.venue_response || input.venue_response.trim().length === 0) {
      throw new Error('Venue response cannot be empty');
    }

    const currentUser = (await this.supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('venue_reviews')
      .update({
        venue_response: input.venue_response,
        venue_response_at: new Date().toISOString(),
        venue_response_by: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove venue response from a review
   */
  async removeVenueResponse(reviewId: string): Promise<VenueReview> {
    const { data, error } = await this.supabase
      .from('venue_reviews')
      .update({
        venue_response: null,
        venue_response_at: null,
        venue_response_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // Review Moderation
  // =====================================================

  /**
   * Flag a review for moderation
   * Requirement 10.9: Reviews can be flagged for moderation
   */
  async flagReview(reviewId: string, input: FlagReviewInput): Promise<VenueReview> {
    if (!input.flag_reason || input.flag_reason.trim().length === 0) {
      throw new Error('Flag reason is required');
    }

    const { data, error } = await this.supabase
      .from('venue_reviews')
      .update({
        flagged: true,
        flag_reason: input.flag_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Moderate a flagged review
   * Requirement 10.10: Flagged reviews are reviewed by administrators
   */
  async moderateReview(
    reviewId: string,
    input: ModerateReviewInput
  ): Promise<VenueReview> {
    const updateData: any = {
      reviewed_by_admin: input.reviewed_by_admin,
      updated_at: new Date().toISOString(),
    };

    if (input.admin_notes !== undefined) {
      updateData.admin_notes = input.admin_notes;
    }

    if (input.flagged !== undefined) {
      updateData.flagged = input.flagged;
    }

    const { data, error } = await this.supabase
      .from('venue_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all flagged reviews
   */
  async getFlaggedReviews(): Promise<VenueReview[]> {
    const { data, error } = await this.supabase
      .from('venue_reviews')
      .select('*')
      .eq('flagged', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get unmoderated flagged reviews
   */
  async getUnmoderatedReviews(): Promise<VenueReview[]> {
    const { data, error } = await this.supabase
      .from('venue_reviews')
      .select('*')
      .eq('flagged', true)
      .eq('reviewed_by_admin', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // Statistics and Analytics
  // =====================================================

  /**
   * Get rating statistics for a venue
   */
  async getVenueRatingStats(venueId: string): Promise<VenueRatingStats> {
    const { data, error } = await this.supabase
      .from('venue_reviews')
      .select('*')
      .eq('venue_id', venueId)
      .eq('flagged', false);

    if (error) throw error;

    const reviews = data || [];
    const count = reviews.length;

    if (count === 0) {
      return {
        venue_id: venueId,
        average_overall_rating: 0,
        average_educational_value: 0,
        average_staff_quality: 0,
        average_facilities: 0,
        average_value: 0,
        total_reviews: 0,
      };
    }

    const sum = (arr: (number | null)[]) => {
      const filtered = arr.filter((v): v is number => v !== null);
      return filtered.length > 0
        ? filtered.reduce((a, b) => a + b, 0) / filtered.length
        : 0;
    };

    return {
      venue_id: venueId,
      average_overall_rating: sum(reviews.map((r) => r.overall_rating)),
      average_educational_value: sum(reviews.map((r) => r.educational_value_rating)),
      average_staff_quality: sum(reviews.map((r) => r.staff_quality_rating)),
      average_facilities: sum(reviews.map((r) => r.facilities_rating)),
      average_value: sum(reviews.map((r) => r.value_rating)),
      total_reviews: count,
    };
  }

  /**
   * Check if user can review a venue for a trip
   */
  async canUserReviewTrip(userId: string, tripId: string): Promise<boolean> {
    // Check if review already exists
    const { data: existingReview } = await this.supabase
      .from('venue_reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('trip_id', tripId)
      .single();

    return !existingReview;
  }

  /**
   * Get recent reviews across all venues
   */
  async getRecentReviews(limit: number = 10): Promise<VenueReview[]> {
    const { data, error } = await this.supabase
      .from('venue_reviews')
      .select('*')
      .eq('flagged', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get reviews with venue response
   */
  async getReviewsWithResponses(venueId?: string): Promise<VenueReview[]> {
    let query = this.supabase
      .from('venue_reviews')
      .select('*')
      .not('venue_response', 'is', null)
      .eq('flagged', false);

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    query = query.order('venue_response_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
}

// =====================================================
// Factory Function
// =====================================================

export function createVenueReviewService(
  supabase: SupabaseClient
): VenueReviewService {
  return new VenueReviewService(supabase);
}
