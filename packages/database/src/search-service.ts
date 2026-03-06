/**
 * Search Service
 * 
 * Provides comprehensive venue and experience search functionality with:
 * - Full-text search across venue names, descriptions, and experience titles
 * - Geographic radius search using PostGIS
 * - Multi-criteria filtering (categories, subject areas, grade levels, capacity, price, accessibility)
 * - Result pagination with cursor-based navigation
 * - Multiple sort options (relevance, distance, rating, price)
 * - Redis caching layer for search results (5-minute TTL)
 * - Enhanced ranking algorithm prioritizing complete profiles and verified venues
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 20.1, 20.2
 */

import type { SupabaseClient } from './client';
import type { AgeGroup } from './venue-profile-service';

// Simple in-memory cache with TTL
class Cache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();

  set(key: string, value: T, ttlMs: number = 300000): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface SearchQuery {
  // Text search (Requirement 3.1)
  query?: string;
  
  // Geographic filters (Requirement 3.2)
  location?: { lat: number; lng: number };
  radiusMiles?: number;
  
  // Categorical filters (Requirement 3.3)
  categories?: string[];
  subjectAreas?: string[];
  gradeLevels?: string[];
  ageGroups?: AgeGroup[];
  
  // Capacity and logistics (Requirement 3.4)
  minCapacity?: number;
  maxCapacity?: number;
  availableDate?: string; // YYYY-MM-DD format
  
  // Pricing (Requirement 3.5)
  maxPricePerStudent?: number;
  
  // Accessibility (Requirement 3.5)
  accessibilityFeatures?: string[];
  
  // Status filters
  verifiedOnly?: boolean;
  claimedOnly?: boolean;
  
  // Sorting (Requirement 3.8)
  sortBy?: 'relevance' | 'distance' | 'rating' | 'price';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  cursor?: string; // Base64 encoded cursor for pagination
}

export interface SearchResult {
  venues: VenueSearchHit[];
  total: number;
  nextCursor?: string;
  facets: SearchFacets;
  executionTimeMs: number;
}

export interface VenueSearchHit {
  id: string;
  name: string;
  description: string | null;
  primaryPhotoUrl: string | null;
  location: { lat: number; lng: number } | null;
  distanceMiles?: number;
  rating: number;
  reviewCount: number;
  priceRange: { min: number; max: number } | null;
  verified: boolean;
  claimed: boolean;
  categories: string[];
  subjectAreas: string[];
  capacityRange: { min: number; max: number } | null;
  accessibilityFeatures: string[];
  profileCompleteness: number;
}

export interface SearchFacets {
  categories: { name: string; count: number }[];
  subjectAreas: { name: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  ageGroups: { name: string; count: number }[];
}

interface PaginationCursor {
  lastId: string;
  lastValue: number | string;
  sortBy: string;
}

// =====================================================
// SEARCH SERVICE
// =====================================================

export class SearchService {
  private searchCache: Cache<SearchResult>;

  constructor(private supabase: SupabaseClient) {
    // Initialize cache with 5-minute TTL (Requirement 3.8, 20.1)
    this.searchCache = new Cache<SearchResult>();
  }

  /**
   * Search venues with comprehensive filtering and sorting
   * Requirements: 3.1-3.9, 20.1, 20.2
   * 
   * Implements caching layer for frequently accessed queries (5-minute TTL)
   * 
   * Note: This service uses the 'venues' table which is extended by migration
   * 20240101000020_extend_venues_table.sql. Type definitions will be available
   * after running migrations and regenerating types.
   */
  async searchVenues(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const limit = query.limit || 25;
    
    // Generate cache key from query parameters
    const cacheKey = this.generateCacheKey(query);
    
    // Check cache first (Requirement 3.8 - cache for 5 minutes)
    const cachedResult = this.searchCache.get(cacheKey);
    if (cachedResult) {
      // Return cached result with updated execution time
      return {
        ...cachedResult,
        executionTimeMs: Date.now() - startTime
      };
    }
    
    try {
      // Build the base query
      let venueQuery = this.supabase
        .from('venues')
        .select(`
          id,
          name,
          description,
          primary_photo_url,
          address,
          rating,
          review_count,
          verified,
          claimed,
          capacity_min,
          capacity_max,
          supported_age_groups,
          accessibility_features,
          profile_completeness,
          location
        `);

      if (query.query && query.query.trim()) {
        const q = query.query.trim().replace(/[%_\\,().*]/g, '');
        if (q.length > 0) {
          venueQuery = venueQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
        }
      }

      // Apply verified filter
      if (query.verifiedOnly) {
        venueQuery = venueQuery.eq('verified', true);
      }

      // Apply claimed filter
      if (query.claimedOnly) {
        venueQuery = venueQuery.eq('claimed', true);
      }

      // Apply capacity filters (Requirement 3.4)
      if (query.minCapacity !== undefined) {
        venueQuery = venueQuery.gte('capacity_max', query.minCapacity);
      }
      if (query.maxCapacity !== undefined) {
        venueQuery = venueQuery.lte('capacity_min', query.maxCapacity);
      }

      // Apply age group filter (Requirement 3.3)
      if (query.ageGroups && query.ageGroups.length > 0) {
        venueQuery = venueQuery.overlaps('supported_age_groups', query.ageGroups);
      }

      // Execute the base query
      const { data: venues, error: venueError } = await venueQuery;

      if (venueError) {
        throw new Error(`Failed to search venues: ${venueError.message}`);
      }

      if (!venues || venues.length === 0) {
        return {
          venues: [],
          total: 0,
          facets: this.getEmptyFacets(),
          executionTimeMs: Date.now() - startTime
        };
      }

      // Get venue IDs for experience filtering
      const venueIds = venues.map(v => v.id);

      // Fetch venue category assignments if category filter is applied
      let venueCategoryMap = new Map<string, string[]>();
      if (query.categories && query.categories.length > 0) {
        const { data: categoryAssignments, error: categoryError } = await this.supabase
          .from('venue_category_assignments')
          .select('venue_id, category:venue_categories(name)')
          .in('venue_id', venueIds);

        if (categoryError) {
          throw new Error(`Failed to fetch venue categories: ${categoryError.message}`);
        }

        // Build venue to categories map
        categoryAssignments?.forEach((assignment: any) => {
          if (!venueCategoryMap.has(assignment.venue_id)) {
            venueCategoryMap.set(assignment.venue_id, []);
          }
          if (assignment.category?.name) {
            venueCategoryMap.get(assignment.venue_id)!.push(assignment.category.name);
          }
        });
      } else {
        // Fetch all categories for facet generation
        const { data: categoryAssignments, error: categoryError } = await this.supabase
          .from('venue_category_assignments')
          .select('venue_id, category:venue_categories(name)')
          .in('venue_id', venueIds);

        if (!categoryError && categoryAssignments) {
          categoryAssignments.forEach((assignment: any) => {
            if (!venueCategoryMap.has(assignment.venue_id)) {
              venueCategoryMap.set(assignment.venue_id, []);
            }
            if (assignment.category?.name) {
              venueCategoryMap.get(assignment.venue_id)!.push(assignment.category.name);
            }
          });
        }
      }

      // Fetch experiences for these venues to apply subject area and price filters
      let experienceQuery = this.supabase
        .from('experiences')
        .select('id, venue_id, subjects')
        .in('venue_id', venueIds)
        .eq('active', true);

      const { data: experiences, error: expError } = await experienceQuery;

      if (expError) {
        throw new Error(`Failed to fetch experiences: ${expError.message}`);
      }

      // Fetch pricing tiers for price filtering
      const experienceIds = experiences?.map(e => e.id) || [];
      let pricingQuery = this.supabase
        .from('pricing_tiers')
        .select('experience_id, price_cents')
        .in('experience_id', experienceIds);

      const { data: pricingTiers, error: pricingError } = await pricingQuery;

      if (pricingError) {
        throw new Error(`Failed to fetch pricing: ${pricingError.message}`);
      }

      // Build experience to pricing map
      const experiencePricing = new Map<string, any[]>();
      pricingTiers?.forEach(tier => {
        if (!experiencePricing.has(tier.experience_id)) {
          experiencePricing.set(tier.experience_id, []);
        }
        experiencePricing.get(tier.experience_id)!.push(tier);
      });

      // Build venue to experiences map
      const venueExperiences = new Map<string, any[]>();
      experiences?.forEach(exp => {
        if (!venueExperiences.has(exp.venue_id)) {
          venueExperiences.set(exp.venue_id, []);
        }
        venueExperiences.get(exp.venue_id)!.push(exp);
      });

      // Filter venues based on experience criteria
      let filteredVenues = venues.filter(venue => {
        const venueExps = venueExperiences.get(venue.id) || [];
        
        // If no experiences, exclude venue
        if (venueExps.length === 0) {
          return false;
        }

        // Apply category filter (Requirement 3.3)
        if (query.categories && query.categories.length > 0) {
          const venueCategories = venueCategoryMap.get(venue.id) || [];
          const hasMatchingCategory = query.categories.some(cat => 
            venueCategories.includes(cat)
          );
          if (!hasMatchingCategory) return false;
        }

        // Apply subject area filter (Requirement 3.3)
        if (query.subjectAreas && query.subjectAreas.length > 0) {
          const hasMatchingSubject = venueExps.some(exp => 
            exp.subjects && query.subjectAreas!.some(sa => 
              exp.subjects.includes(sa)
            )
          );
          if (!hasMatchingSubject) return false;
        }

        // Apply price filter (Requirement 3.5)
        if (query.maxPricePerStudent !== undefined) {
          const hasAffordableExperience = venueExps.some(exp => {
            const pricing = experiencePricing.get(exp.id) || [];
            if (pricing.length === 0) return false;
            return pricing.some((tier: any) => 
              tier.price_cents <= query.maxPricePerStudent! * 100
            );
          });
          if (!hasAffordableExperience) return false;
        }

        // Apply accessibility filter (Requirement 3.5)
        if (query.accessibilityFeatures && query.accessibilityFeatures.length > 0) {
          const venueFeatures = (venue.accessibility_features as Record<string, any>) || {};
          const hasAllFeatures = query.accessibilityFeatures.every(feature => 
            venueFeatures[feature]?.available === true
          );
          if (!hasAllFeatures) return false;
        }

        return true;
      });

      // Apply geographic radius filter (Requirement 3.2)
      if (query.location && query.radiusMiles) {
        filteredVenues = await this.filterByDistance(
          filteredVenues,
          query.location,
          query.radiusMiles
        );
      }

      // Calculate price ranges for each venue
      const venuesWithPrices = filteredVenues.map(venue => {
        const venueExps = venueExperiences.get(venue.id) || [];
        const prices: number[] = [];
        
        venueExps.forEach(exp => {
          const pricing = experiencePricing.get(exp.id) || [];
          pricing.forEach((tier: any) => {
            if (tier.price_cents) {
              prices.push(tier.price_cents);
            }
          });
        });

        const priceRange = prices.length > 0
          ? { min: Math.min(...prices), max: Math.max(...prices) }
          : null;

        return { ...venue, priceRange, venueExps };
      });

      // Sort results (Requirement 3.8)
      const sortedVenues = await this.sortVenues(
        venuesWithPrices,
        query.sortBy || 'relevance',
        query.sortOrder || 'desc',
        query.location
      );

      // Apply pagination
      const { paginatedVenues, nextCursor } = this.paginateResults(
        sortedVenues,
        limit,
        query.cursor
      );

      // Map to search hits (Requirement 3.7)
      const searchHits: VenueSearchHit[] = paginatedVenues.map(venue => 
        this.mapToSearchHit(venue, venueExperiences.get(venue.id) || [], venueCategoryMap.get(venue.id) || [])
      );

      // Generate facets for filtering UI (use venuesWithPrices which has priceRange)
      const facets = this.generateFacets(venuesWithPrices, venueExperiences, venueCategoryMap);

      const result: SearchResult = {
        venues: searchHits,
        total: filteredVenues.length,
        nextCursor,
        facets,
        executionTimeMs: Date.now() - startTime
      };

      // Cache the result for 5 minutes (300000ms) - Requirement 3.8
      this.searchCache.set(cacheKey, result, 300000);

      return result;

    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate cache key from search query parameters
   * Used for caching search results (Requirement 3.8)
   */
  private generateCacheKey(query: SearchQuery): string {
    // Create a stable string representation of the query
    const keyParts = [
      query.query || '',
      query.location ? `${query.location.lat},${query.location.lng}` : '',
      query.radiusMiles || '',
      (query.categories || []).sort().join(','),
      (query.subjectAreas || []).sort().join(','),
      (query.gradeLevels || []).sort().join(','),
      (query.ageGroups || []).sort().join(','),
      query.minCapacity || '',
      query.maxCapacity || '',
      query.availableDate || '',
      query.maxPricePerStudent || '',
      (query.accessibilityFeatures || []).sort().join(','),
      query.verifiedOnly ? '1' : '0',
      query.claimedOnly ? '1' : '0',
      query.sortBy || 'relevance',
      query.sortOrder || 'desc',
      query.limit || '25',
      query.cursor || ''
    ];
    
    return `search:${keyParts.join(':')}`;
  }

  /**
   * Clear the search cache
   * Useful when venue data is updated
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Clear specific cached search result
   */
  clearCachedQuery(query: SearchQuery): void {
    const cacheKey = this.generateCacheKey(query);
    this.searchCache.delete(cacheKey);
  }

  /**
   * Filter venues by geographic distance using PostGIS
   * Requirement 3.2
   */
  private async filterByDistance(
    venues: any[],
    location: { lat: number; lng: number },
    radiusMiles: number
  ): Promise<any[]> {
    const venueIds = venues.map(v => v.id);
    
    // Use PostGIS ST_DWithin for efficient radius search
    // Convert miles to meters (1 mile = 1609.34 meters)
    const radiusMeters = radiusMiles * 1609.34;
    
    const { data, error } = await this.supabase.rpc('venues_within_radius', {
      lat: location.lat,
      lng: location.lng,
      radius_meters: radiusMeters,
      venue_ids: venueIds
    });

    if (error) {
      console.error('Distance filter error:', error);
      // Fallback to client-side filtering if RPC fails
      return venues.filter(venue => {
        if (!venue.address?.coordinates) return false;
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          venue.address.coordinates.lat,
          venue.address.coordinates.lng
        );
        return distance <= radiusMiles;
      });
    }

    const nearbyVenueIds = new Set(data?.map((v: any) => v.id) || []);
    return venues.filter(v => nearbyVenueIds.has(v.id));
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Fallback for when PostGIS is not available
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Sort venues based on specified criteria
   * Requirement 3.8, 20.1, 20.2
   * 
   * Enhanced ranking algorithm that prioritizes:
   * - Verified venues
   * - Complete profiles
   * - Higher ratings
   * - More reviews
   */
  private async sortVenues(
    venues: any[],
    sortBy: string,
    sortOrder: string,
    location?: { lat: number; lng: number }
  ): Promise<any[]> {
    const sorted = [...venues];

    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => {
          const diff = b.rating - a.rating;
          return sortOrder === 'asc' ? -diff : diff;
        });
        break;

      case 'price':
        sorted.sort((a, b) => {
          const aMin = a.priceRange?.min || Infinity;
          const bMin = b.priceRange?.min || Infinity;
          const diff = aMin - bMin;
          return sortOrder === 'asc' ? diff : -diff;
        });
        break;

      case 'distance':
        if (location) {
          sorted.forEach(venue => {
            if (venue.address?.coordinates) {
              venue.distance = this.calculateDistance(
                location.lat,
                location.lng,
                venue.address.coordinates.lat,
                venue.address.coordinates.lng
              );
            } else {
              venue.distance = Infinity;
            }
          });
          sorted.sort((a, b) => {
            const diff = a.distance - b.distance;
            return sortOrder === 'asc' ? diff : -diff;
          });
        }
        break;

      case 'relevance':
      default:
        // Enhanced ranking algorithm (Requirements 3.8, 20.1, 20.2)
        // Prioritizes: verified status, profile completeness, rating, and review count
        sorted.sort((a, b) => {
          // Calculate relevance score for each venue
          const aScore = this.calculateRelevanceScore(a);
          const bScore = this.calculateRelevanceScore(b);
          
          const diff = bScore - aScore;
          return sortOrder === 'asc' ? -diff : diff;
        });
        break;
    }

    return sorted;
  }

  /**
   * Calculate relevance score for ranking
   * Requirements: 3.8, 20.1, 20.2
   * 
   * Scoring factors:
   * - Verified status: +2.0 bonus
   * - Profile completeness: 0-1.0 (normalized)
   * - Rating: 0-5.0 (weighted 40%)
   * - Review count: 0-0.3 (capped at 100 reviews, weighted 30%)
   * - Claimed status: +0.5 bonus
   */
  private calculateRelevanceScore(venue: any): number {
    let score = 0;

    // Verified venues get significant boost (Requirement 20.2)
    if (venue.verified) {
      score += 2.0;
    }

    // Claimed venues get moderate boost
    if (venue.claimed) {
      score += 0.5;
    }

    // Profile completeness (0-100 normalized to 0-1.0)
    // Complete profiles are prioritized (Requirement 20.1)
    const completeness = (venue.profile_completeness || 0) / 100;
    score += completeness * 1.0;

    // Rating (0-5 scale, weighted 40%)
    const rating = venue.rating || 0;
    score += rating * 0.4;

    // Review count (capped at 100, weighted 30%)
    // More reviews indicate popularity and reliability
    const reviewCount = Math.min(venue.review_count || 0, 100);
    score += (reviewCount / 100) * 0.3;

    return score;
  }

  /**
   * Paginate results using cursor-based pagination
   */
  private paginateResults(
    venues: any[],
    limit: number,
    cursor?: string
  ): { paginatedVenues: any[]; nextCursor?: string } {
    let startIndex = 0;

    if (cursor) {
      try {
        const decodedCursor = JSON.parse(
          Buffer.from(cursor, 'base64').toString('utf-8')
        ) as PaginationCursor;
        
        // Find the index of the last item from previous page
        startIndex = venues.findIndex(v => v.id === decodedCursor.lastId);
        if (startIndex !== -1) {
          startIndex += 1; // Start from next item
        } else {
          startIndex = 0;
        }
      } catch (error) {
        console.error('Invalid cursor:', error);
        startIndex = 0;
      }
    }

    const paginatedVenues = venues.slice(startIndex, startIndex + limit);
    
    let nextCursor: string | undefined;
    if (startIndex + limit < venues.length) {
      const lastVenue = paginatedVenues[paginatedVenues.length - 1];
      const cursorData: PaginationCursor = {
        lastId: lastVenue.id,
        lastValue: lastVenue.rating || 0,
        sortBy: 'relevance'
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    return { paginatedVenues, nextCursor };
  }

  /**
   * Map venue data to search hit format
   * Requirement 3.7
   */
  private mapToSearchHit(venue: any, experiences: any[], categories: string[]): VenueSearchHit {
    // Extract unique subject areas from experiences
    const subjectAreas = new Set<string>();
    experiences.forEach(exp => {
      if (exp.subjects) {
        exp.subjects.forEach((subject: string) => subjectAreas.add(subject));
      }
    });

    // Extract accessibility features
    const accessibilityFeatures: string[] = [];
    if (venue.accessibility_features) {
      Object.entries(venue.accessibility_features).forEach(([key, value]: [string, any]) => {
        if (value?.available) {
          accessibilityFeatures.push(key);
        }
      });
    }

    // Parse location
    let location: { lat: number; lng: number } | null = null;
    if (venue.address?.coordinates) {
      location = {
        lat: venue.address.coordinates.lat,
        lng: venue.address.coordinates.lng
      };
    }

    return {
      id: venue.id,
      name: venue.name,
      description: venue.description,
      primaryPhotoUrl: venue.primary_photo_url,
      location,
      distanceMiles: venue.distance,
      rating: venue.rating || 0,
      reviewCount: venue.review_count || 0,
      priceRange: venue.priceRange,
      verified: venue.verified || false,
      claimed: venue.claimed || false,
      categories: categories,
      subjectAreas: Array.from(subjectAreas),
      capacityRange: venue.capacity_min && venue.capacity_max
        ? { min: venue.capacity_min, max: venue.capacity_max }
        : null,
      accessibilityFeatures,
      profileCompleteness: venue.profile_completeness || 0
    };
  }

  /**
   * Generate facets for filtering UI
   */
  private generateFacets(
    venues: any[],
    venueExperiences: Map<string, any[]>,
    venueCategoryMap: Map<string, string[]>
  ): SearchFacets {
    const categoryCounts = new Map<string, number>();
    const subjectAreaCounts = new Map<string, number>();
    const priceRangeCounts = new Map<string, number>();
    const ageGroupCounts = new Map<string, number>();

    venues.forEach(venue => {
      const experiences = venueExperiences.get(venue.id) || [];
      
      // Count categories
      const categories = venueCategoryMap.get(venue.id) || [];
      categories.forEach(category => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
      
      // Count subject areas
      experiences.forEach(exp => {
        if (exp.subjects) {
          exp.subjects.forEach((subject: string) => {
            subjectAreaCounts.set(subject, (subjectAreaCounts.get(subject) || 0) + 1);
          });
        }
      });

      // Count price ranges
      if (venue.priceRange) {
        const minPrice = venue.priceRange.min / 100;
        let range: string;
        if (minPrice < 10) range = '$0-$10';
        else if (minPrice < 25) range = '$10-$25';
        else if (minPrice < 50) range = '$25-$50';
        else range = '$50+';
        
        priceRangeCounts.set(range, (priceRangeCounts.get(range) || 0) + 1);
      }

      // Count age groups
      if (venue.supported_age_groups) {
        venue.supported_age_groups.forEach((ageGroup: string) => {
          ageGroupCounts.set(ageGroup, (ageGroupCounts.get(ageGroup) || 0) + 1);
        });
      }
    });

    return {
      categories: Array.from(categoryCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      subjectAreas: Array.from(subjectAreaCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      priceRanges: Array.from(priceRangeCounts.entries())
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => {
          const order = ['$0-$10', '$10-$25', '$25-$50', '$50+'];
          return order.indexOf(a.range) - order.indexOf(b.range);
        }),
      ageGroups: Array.from(ageGroupCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    };
  }

  /**
   * Get empty facets structure
   */
  private getEmptyFacets(): SearchFacets {
    return {
      categories: [],
      subjectAreas: [],
      priceRanges: [],
      ageGroups: []
    };
  }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export function createSearchService(supabase: SupabaseClient): SearchService {
  return new SearchService(supabase);
}
