/**
 * Venue Profile Service
 * 
 * Handles CRUD operations for venue profiles with profile completeness
 * calculation, RLS policies, and photo gallery management.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8
 */

import type { SupabaseClient } from './client';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: { lat: number; lng: number };
}

export interface AccessibilityFeature {
  type: 'wheelchair' | 'parking' | 'entrance' | 'restroom' | 
        'hearing' | 'visual' | 'sensory' | 'service_animal';
  available: boolean;
  description?: string;
}

export interface OperatingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  closed: boolean;
}

export interface SeasonalAvailability {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  available: boolean;
  notes?: string;
}

export type AgeGroup = 'preschool' | 'elementary' | 'middle' | 'high' | 'adult';

export interface VenueProfile {
  id: string;
  name: string;
  description: string | null;
  address: Address | null;
  contact_email: string;
  contact_phone: string | null;
  website?: string | null;
  
  // Operational details
  operating_hours: OperatingHours[];
  seasonal_availability: SeasonalAvailability[];
  booking_lead_time_days: number;
  
  // Capacity and features
  capacity_min: number | null;
  capacity_max: number | null;
  supported_age_groups: AgeGroup[];
  accessibility_features: Record<string, AccessibilityFeature>;
  
  // Media
  primary_photo_url: string | null;
  virtual_tour_url: string | null;
  
  // Status
  claimed: boolean;
  verified: boolean;
  profile_completeness: number; // 0-100
  
  // Ratings
  rating: number;
  review_count: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  claimed_at: string | null;
  verified_at: string | null;
  
  // Geographic location (PostGIS)
  location: string | null; // WKT format or GeoJSON
}

export interface CreateVenueProfileParams {
  name: string;
  description?: string;
  address?: Address;
  contact_email: string;
  contact_phone?: string;
  website?: string;
}

export interface UpdateVenueProfileParams {
  name?: string;
  description?: string;
  address?: Address;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  operating_hours?: OperatingHours[];
  seasonal_availability?: SeasonalAvailability[];
  booking_lead_time_days?: number;
  capacity_min?: number;
  capacity_max?: number;
  supported_age_groups?: AgeGroup[];
  accessibility_features?: Record<string, AccessibilityFeature>;
  primary_photo_url?: string;
  virtual_tour_url?: string;
}

export interface VenuePhoto {
  id: string;
  venue_id: string;
  url: string;
  caption?: string;
  display_order: number;
  uploaded_at: string;
}

// =====================================================
// PROFILE COMPLETENESS CALCULATION
// =====================================================

/**
 * Calculates profile completeness percentage based on filled fields
 * Requirements: 1.8
 * 
 * Scoring breakdown:
 * - Basic info (30%): name (5%), description (10%), address (10%), contact (5%)
 * - Operational (20%): operating_hours (10%), booking_lead_time (5%), capacity (5%)
 * - Features (20%): supported_age_groups (10%), accessibility_features (10%)
 * - Media (20%): primary_photo (10%), additional photos (10%)
 * - Details (10%): website (5%), virtual_tour (5%)
 */
function calculateProfileCompleteness(profile: Partial<VenueProfile>, photoCount: number = 0): number {
  let score = 0;
  
  // Basic info (30%)
  if (profile.name) score += 5;
  if (profile.description && profile.description.length > 50) score += 10;
  if (profile.address) score += 10;
  if (profile.contact_email && profile.contact_phone) score += 5;
  
  // Operational (20%)
  if (profile.operating_hours && profile.operating_hours.length > 0) score += 10;
  if (profile.booking_lead_time_days && profile.booking_lead_time_days > 0) score += 5;
  if (profile.capacity_min && profile.capacity_max) score += 5;
  
  // Features (20%)
  if (profile.supported_age_groups && profile.supported_age_groups.length > 0) score += 10;
  if (profile.accessibility_features && Object.keys(profile.accessibility_features).length > 0) score += 10;
  
  // Media (20%)
  if (profile.primary_photo_url) score += 10;
  if (photoCount >= 3) score += 10;
  else if (photoCount > 0) score += 5;
  
  // Details (10%)
  if (profile.website) score += 5;
  if (profile.virtual_tour_url) score += 5;
  
  return Math.min(100, score);
}

// =====================================================
// VENUE PROFILE SERVICE
// =====================================================

export class VenueProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new venue profile
   * Requirements: 1.1, 1.6
   */
  async createVenueProfile(params: CreateVenueProfileParams): Promise<{ data: VenueProfile | null; error: Error | null }> {
    try {
      const venueData: any = {
        name: params.name,
        description: params.description || null,
        address: params.address || null,
        contact_email: params.contact_email,
        contact_phone: params.contact_phone || null,
        website: params.website || null,
      };

      // Set location from address coordinates if provided
      if (params.address?.coordinates) {
        venueData.location = `POINT(${params.address.coordinates.lng} ${params.address.coordinates.lat})`;
      }

      const { data, error } = await this.supabase
        .from('venues')
        .insert(venueData)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      // Calculate initial profile completeness
      const completeness = calculateProfileCompleteness(data as unknown as VenueProfile, 0);
      
      // Update profile completeness
      const { data: updatedData, error: updateError } = await this.supabase
        .from('venues')
        .update({ profile_completeness: completeness })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError };
      }

      return { data: updatedData as unknown as VenueProfile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Gets a venue profile by ID
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  async getVenueProfile(venueId: string): Promise<{ data: VenueProfile | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: data as unknown as VenueProfile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Updates a venue profile
   * Requirements: 1.1, 1.2, 1.4, 1.5, 1.8
   */
  async updateVenueProfile(
    venueId: string,
    params: UpdateVenueProfileParams
  ): Promise<{ data: VenueProfile | null; error: Error | null }> {
    try {
      const updateData: any = {};

      // Map parameters to database columns
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined) updateData.description = params.description;
      if (params.address !== undefined) {
        updateData.address = params.address;
        // Update location if coordinates provided
        if (params.address?.coordinates) {
          updateData.location = `POINT(${params.address.coordinates.lng} ${params.address.coordinates.lat})`;
        }
      }
      if (params.contact_email !== undefined) updateData.contact_email = params.contact_email;
      if (params.contact_phone !== undefined) updateData.contact_phone = params.contact_phone;
      if (params.website !== undefined) updateData.website = params.website;
      if (params.operating_hours !== undefined) updateData.operating_hours = params.operating_hours;
      if (params.seasonal_availability !== undefined) updateData.seasonal_availability = params.seasonal_availability;
      if (params.booking_lead_time_days !== undefined) updateData.booking_lead_time_days = params.booking_lead_time_days;
      if (params.capacity_min !== undefined) updateData.capacity_min = params.capacity_min;
      if (params.capacity_max !== undefined) updateData.capacity_max = params.capacity_max;
      if (params.supported_age_groups !== undefined) updateData.supported_age_groups = params.supported_age_groups;
      if (params.accessibility_features !== undefined) updateData.accessibility_features = params.accessibility_features;
      if (params.primary_photo_url !== undefined) updateData.primary_photo_url = params.primary_photo_url;
      if (params.virtual_tour_url !== undefined) updateData.virtual_tour_url = params.virtual_tour_url;

      // Update the profile
      const { data, error } = await this.supabase
        .from('venues')
        .update(updateData)
        .eq('id', venueId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      // Recalculate profile completeness
      const { data: photoData } = await this.supabase
        .from('venue_photos')
        .select('id')
        .eq('venue_id', venueId);

      const photoCount = photoData?.length || 0;
      const completeness = calculateProfileCompleteness(data as unknown as VenueProfile, photoCount);

      // Update completeness if changed
      if (completeness !== data.profile_completeness) {
        const { data: updatedData, error: updateError } = await this.supabase
          .from('venues')
          .update({ profile_completeness: completeness })
          .eq('id', venueId)
          .select()
          .single();

        if (updateError) {
          return { data: null, error: updateError };
        }

        return { data: updatedData as unknown as VenueProfile, error: null };
      }

      return { data: data as unknown as VenueProfile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Deletes a venue profile
   * Requirements: 1.1
   * Note: This will cascade delete all related records (photos, videos, forms, experiences)
   */
  async deleteVenueProfile(venueId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Lists venue profiles with optional filtering
   * Requirements: 1.1
   */
  async listVenueProfiles(options?: {
    limit?: number;
    offset?: number;
    claimed?: boolean;
    verified?: boolean;
  }): Promise<{ data: VenueProfile[] | null; error: Error | null }> {
    try {
      let query = this.supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.claimed !== undefined) {
        query = query.eq('claimed', options.claimed);
      }

      if (options?.verified !== undefined) {
        query = query.eq('verified', options.verified);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error };
      }

      return { data: data as unknown as VenueProfile[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Gets photos for a venue ordered by display_order
   * Requirements: 1.3
   */
  async getVenuePhotos(venueId: string): Promise<{ data: VenuePhoto[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('venue_photos')
        .select('*')
        .eq('venue_id', venueId)
        .order('display_order', { ascending: true });

      if (error) {
        return { data: null, error };
      }

      return { data: data as VenuePhoto[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Updates photo display order for gallery management
   * Requirements: 1.3
   */
  async updatePhotoOrder(photoId: string, displayOrder: number): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('venue_photos')
        .update({ display_order: displayOrder })
        .eq('id', photoId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Reorders multiple photos at once
   * Requirements: 1.3
   */
  async reorderPhotos(photoOrders: { id: string; displayOrder: number }[]): Promise<{ error: Error | null }> {
    try {
      // Update each photo's display order
      const updates = photoOrders.map(({ id, displayOrder }) =>
        this.supabase
          .from('venue_photos')
          .update({ display_order: displayOrder })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error).map(r => r.error);

      if (errors.length > 0) {
        return { error: errors[0] as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Recalculates and updates profile completeness
   * Requirements: 1.8
   */
  async recalculateProfileCompleteness(venueId: string): Promise<{ completeness: number | null; error: Error | null }> {
    try {
      // Get venue profile
      const { data: profile, error: profileError } = await this.getVenueProfile(venueId);
      if (profileError || !profile) {
        return { completeness: null, error: profileError };
      }

      // Get photo count
      const { data: photos, error: photoError } = await this.getVenuePhotos(venueId);
      if (photoError) {
        return { completeness: null, error: photoError };
      }

      const photoCount = photos?.length || 0;
      const completeness = calculateProfileCompleteness(profile, photoCount);

      // Update completeness
      const { error: updateError } = await this.supabase
        .from('venues')
        .update({ profile_completeness: completeness })
        .eq('id', venueId);

      if (updateError) {
        return { completeness: null, error: updateError };
      }

      return { completeness, error: null };
    } catch (error) {
      return { completeness: null, error: error as Error };
    }
  }

  /**
   * Sets the primary photo for a venue
   * Requirements: 1.3
   */
  async setPrimaryPhoto(venueId: string, photoUrl: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('venues')
        .update({ primary_photo_url: photoUrl })
        .eq('id', venueId);

      if (!error) {
        // Recalculate completeness since primary photo affects it
        await this.recalculateProfileCompleteness(venueId);
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

/**
 * Creates a VenueProfileService instance
 */
export function createVenueProfileService(supabase: SupabaseClient): VenueProfileService {
  return new VenueProfileService(supabase);
}
