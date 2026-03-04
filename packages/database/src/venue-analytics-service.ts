/**
 * Venue Analytics Service
 * 
 * Provides access to pre-computed venue analytics from materialized view
 * for improved dashboard performance.
 * 
 * Requirements: 20.1, 20.2
 */

import type { SupabaseClient } from './client';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface VenueAnalytics {
  venueId: string;
  venueName: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenueCents: number;
  avgGroupSize: number;
  currentRating: number;
  reviewCount: number;
  profileViews: number;
  conversionRatePercent: number;
}

export interface AnalyticsFilters {
  venueId?: string;
  minBookings?: number;
  minRevenue?: number;
  sortBy?: 'bookings' | 'revenue' | 'conversion' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

// =====================================================
// VENUE ANALYTICS SERVICE
// =====================================================

export class VenueAnalyticsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get analytics for a specific venue
   * Requirement 20.1, 20.2
   */
  async getVenueAnalytics(venueId: string): Promise<VenueAnalytics | null> {
    try {
      const { data, error } = await this.supabase
        .from('venue_analytics_summary')
        .select('*')
        .eq('venue_id', venueId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        throw new Error(`Failed to fetch venue analytics: ${error.message}`);
      }

      return this.mapToAnalytics(data);
    } catch (error) {
      throw new Error(
        `Failed to get venue analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get analytics for multiple venues with filtering and sorting
   * Requirement 20.1, 20.2
   */
  async getAnalyticsList(filters: AnalyticsFilters = {}): Promise<VenueAnalytics[]> {
    try {
      let query = this.supabase
        .from('venue_analytics_summary')
        .select('*');

      // Apply filters
      if (filters.minBookings !== undefined) {
        query = query.gte('total_bookings', filters.minBookings);
      }

      if (filters.minRevenue !== undefined) {
        query = query.gte('total_revenue_cents', filters.minRevenue);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'bookings';
      const sortOrder = filters.sortOrder || 'desc';
      
      switch (sortBy) {
        case 'bookings':
          query = query.order('total_bookings', { ascending: sortOrder === 'asc' });
          break;
        case 'revenue':
          query = query.order('total_revenue_cents', { ascending: sortOrder === 'asc' });
          break;
        case 'conversion':
          query = query.order('conversion_rate_percent', { ascending: sortOrder === 'asc' });
          break;
        case 'rating':
          query = query.order('current_rating', { ascending: sortOrder === 'asc' });
          break;
      }

      // Apply limit
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch analytics list: ${error.message}`);
      }

      return (data || []).map(row => this.mapToAnalytics(row));
    } catch (error) {
      throw new Error(
        `Failed to get analytics list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get top performing venues by bookings
   * Requirement 20.1
   */
  async getTopVenuesByBookings(limit: number = 10): Promise<VenueAnalytics[]> {
    return this.getAnalyticsList({
      sortBy: 'bookings',
      sortOrder: 'desc',
      limit
    });
  }

  /**
   * Get top performing venues by revenue
   * Requirement 20.1
   */
  async getTopVenuesByRevenue(limit: number = 10): Promise<VenueAnalytics[]> {
    return this.getAnalyticsList({
      sortBy: 'revenue',
      sortOrder: 'desc',
      limit
    });
  }

  /**
   * Get venues with best conversion rates
   * Requirement 20.2
   */
  async getTopVenuesByConversion(limit: number = 10): Promise<VenueAnalytics[]> {
    return this.getAnalyticsList({
      sortBy: 'conversion',
      sortOrder: 'desc',
      limit,
      minBookings: 1 // Only include venues with at least 1 booking
    });
  }

  /**
   * Refresh the materialized view
   * Should be called periodically (e.g., hourly or daily)
   * Requirement 20.1, 20.2
   */
  async refreshAnalytics(): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('refresh_venue_analytics');

      if (error) {
        throw new Error(`Failed to refresh analytics: ${error.message}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to refresh analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map database row to VenueAnalytics interface
   */
  private mapToAnalytics(row: any): VenueAnalytics {
    return {
      venueId: row.venue_id,
      venueName: row.venue_name,
      totalBookings: row.total_bookings || 0,
      completedBookings: row.completed_bookings || 0,
      cancelledBookings: row.cancelled_bookings || 0,
      totalRevenueCents: row.total_revenue_cents || 0,
      avgGroupSize: row.avg_group_size || 0,
      currentRating: row.current_rating || 0,
      reviewCount: row.review_count || 0,
      profileViews: row.profile_views || 0,
      conversionRatePercent: row.conversion_rate_percent || 0
    };
  }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export function createVenueAnalyticsService(supabase: SupabaseClient): VenueAnalyticsService {
  return new VenueAnalyticsService(supabase);
}
