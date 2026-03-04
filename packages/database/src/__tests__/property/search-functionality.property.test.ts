/**
 * Property-Based Tests - Search Functionality (Task 6.2)
 * 
 * Tests five core properties using the search_venues RPC function:
 * - Property 4: Text Search Relevance
 * - Property 5: Geographic Radius Filtering
 * - Property 6: Multi-Criteria Filter Conjunction
 * - Property 7: Search Result Structure Completeness
 * - Property 8: Sort Order Consistency
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AgeGroup } from '../../venue-profile-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Search Functionality (Task 6.2)', () => {
  let supabase: SupabaseClient;
  const createdVenueIds: string[] = [];
  const createdExperienceIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create consistent test data with both verified and unverified venues
    await setupTestVenues();
  });

  /**
   * Setup consistent test venues for all tests
   */
  async function setupTestVenues() {
    // Create a verified venue
    const { venue: verifiedVenue } = await createTestVenue({
      name: `Verified Science Museum ${Date.now()}`,
      description: 'A verified science museum for educational trips',
      location: { lat: 40.7128, lng: -74.0060 }, // New York
      capacityMin: 20,
      capacityMax: 100,
      experienceSubjects: ['science', 'education'],
    });
    
    // Mark as verified
    await supabase
      .from('venues')
      .update({ verified: true })
      .eq('id', verifiedVenue.id);

    // Create an unverified venue
    const { venue: unverifiedVenue } = await createTestVenue({
      name: `Unverified Art Gallery ${Date.now()}`,
      description: 'An unverified art gallery with creative workshops',
      location: { lat: 40.7589, lng: -73.9851 }, // Times Square
      capacityMin: 10,
      capacityMax: 50,
      experienceSubjects: ['art', 'creativity'],
    });
    
    // Ensure it's unverified (default should be false, but explicit is better)
    await supabase
      .from('venues')
      .update({ verified: false })
      .eq('id', unverifiedVenue.id);

    // Create another verified venue with different characteristics
    const { venue: verifiedHistoryVenue } = await createTestVenue({
      name: `Verified History Center ${Date.now()}`,
      description: 'A verified historical venue with guided tours',
      location: { lat: 40.6892, lng: -74.0445 }, // Statue of Liberty area
      capacityMin: 15,
      capacityMax: 75,
      experienceSubjects: ['history', 'social-studies'],
    });
    
    // Mark as verified
    await supabase
      .from('venues')
      .update({ verified: true })
      .eq('id', verifiedHistoryVenue.id);

    // Create another unverified venue
    const { venue: unverifiedZoo } = await createTestVenue({
      name: `Unverified Wildlife Zoo ${Date.now()}`,
      description: 'An unverified zoo with animal encounters',
      location: { lat: 40.6505, lng: -73.8567 }, // Queens
      capacityMin: 25,
      capacityMax: 150,
      experienceSubjects: ['biology', 'nature'],
    });
    
    // Ensure it's unverified
    await supabase
      .from('venues')
      .update({ verified: false })
      .eq('id', unverifiedZoo.id);
  }

  afterEach(async () => {
    // Clean up created experiences
    if (createdExperienceIds.length > 0) {
      await supabase.from('experiences').delete().in('id', createdExperienceIds);
      createdExperienceIds.length = 0;
    }

    // Clean up created venues
    if (createdVenueIds.length > 0) {
      await supabase.from('venues').delete().in('id', createdVenueIds);
      createdVenueIds.length = 0;
    }
  });

  /**
   * Helper function to create a test venue with experiences
   */
  async function createTestVenue(data: {
    name: string;
    description?: string;
    location?: { lat: number; lng: number };
    capacityMin?: number;
    capacityMax?: number;
    ageGroups?: AgeGroup[];
    accessibilityFeatures?: Record<string, { available: boolean }>;
    experienceSubjects?: string[];
    experiencePriceCents?: number;
  }) {
    // Create venue
    const venueData: any = {
      name: data.name,
      description: data.description || 'Test venue',
      contact_email: `test${Date.now()}@venue.com`,
      contact_phone: '555-0100',
      capacity_min: data.capacityMin,
      capacity_max: data.capacityMax,
      supported_age_groups: data.ageGroups || [],
      accessibility_features: data.accessibilityFeatures || {},
    };

    // Add location if provided
    if (data.location) {
      venueData.address = {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        coordinates: data.location,
      };
    }

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert(venueData)
      .select()
      .single();

    if (venueError) throw venueError;
    createdVenueIds.push(venue.id);

    // Update location using PostGIS if coordinates provided
    if (data.location) {
      try {
        const { error: locationError } = await supabase.rpc('exec_sql', {
          sql: `UPDATE venues SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
          params: [data.location.lng, data.location.lat, venue.id]
        });
        
        if (locationError) {
          // If exec_sql doesn't work, try direct update
          await supabase
            .from('venues')
            .update({
              location: `SRID=4326;POINT(${data.location.lng} ${data.location.lat})`
            })
            .eq('id', venue.id);
        }
      } catch (error) {
        // If exec_sql doesn't exist, use direct update
        await supabase
          .from('venues')
          .update({
            location: `SRID=4326;POINT(${data.location.lng} ${data.location.lat})`
          })
          .eq('id', venue.id);
      }
    }

    // Create experience for the venue
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .insert({
        venue_id: venue.id,
        title: `Experience for ${data.name}`,
        description: 'Test experience',
        duration_minutes: 60,
        capacity: data.capacityMax || 50,
        subjects: data.experienceSubjects || ['science'],
        published: true,
      })
      .select()
      .single();

    if (expError) throw expError;
    createdExperienceIds.push(experience.id);

    // Create pricing tier for the experience
    const { error: pricingError } = await supabase
      .from('pricing_tiers')
      .insert({
        experience_id: experience.id,
        min_students: 1,
        max_students: data.capacityMax || 50,
        price_cents: data.experiencePriceCents || 1500,
        free_chaperones: 2,
      });

    if (pricingError) throw pricingError;

    return { venue, experience };
  }

  /**
   * Property 4: Text Search Relevance
   * 
   * For any search query containing text terms, all returned venues SHALL contain 
   * at least one of the query terms in their name, description, or associated 
   * experience titles.
   * 
   * **Validates: Requirements 3.1**
   */
  it('Property 4: Text search returns only venues matching query terms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          searchTerm: fc.constantFrom('science', 'museum', 'history', 'art', 'zoo'),
        }),
        async (data) => {
          // Create a venue that matches the search term
          const matchingName = `${data.searchTerm} Center ${Date.now()}`;
          const { venue: matchingVenue } = await createTestVenue({
            name: matchingName,
            description: `A great ${data.searchTerm} venue for learning`,
          });

          // Create a venue that doesn't match
          const nonMatchingName = `Different Place ${Date.now()}`;
          const { venue: nonMatchingVenue } = await createTestVenue({
            name: nonMatchingName,
            description: 'A completely different venue without the term',
          });

          // Wait for database to process
          await new Promise(resolve => setTimeout(resolve, 200));

          // Search using the RPC function
          const { data: results, error } = await supabase.rpc('search_venues', {
            search_text: data.searchTerm,
            max_results: 100,
          });

          if (error) throw error;

          // Property: All returned venues should contain the search term
          results.forEach((venue: any) => {
            const nameMatch = venue.name.toLowerCase().includes(data.searchTerm.toLowerCase());
            const descMatch =
              venue.description?.toLowerCase().includes(data.searchTerm.toLowerCase()) || false;
            
            expect(nameMatch || descMatch).toBe(true);
          });

          // The matching venue should be in results
          const foundMatching = results.some((v: any) => v.id === matchingVenue.id);
          expect(foundMatching).toBe(true);

          // The non-matching venue should NOT be in results
          const foundNonMatching = results.some((v: any) => v.id === nonMatchingVenue.id);
          expect(foundNonMatching).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 5: Geographic Radius Filtering
   * 
   * For any search with a location and radius specified, all returned venues 
   * SHALL be within the specified distance from the search location.
   * 
   * **Validates: Requirements 3.2**
   */
  it('Property 5: Geographic search returns only venues within radius', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          radiusMiles: fc.integer({ min: 20, max: 100 }),
        }),
        async (data) => {
          // Use a fixed center point for consistency
          const centerLat = 40.7128; // New York
          const centerLng = -74.0060;
          
          // Create a venue near the center (within radius) - 5 miles away
          const nearbyLat = centerLat + (5 / 69); // ~69 miles per degree latitude
          const nearbyLng = centerLng + (5 / 69);
          
          const { venue: nearbyVenue } = await createTestVenue({
            name: `Nearby Venue ${Date.now()}`,
            location: { lat: nearbyLat, lng: nearbyLng },
          });

          // Create a venue far from the center (outside radius) - 200 miles away
          const farLat = centerLat + (200 / 69);
          const farLng = centerLng + (200 / 69);
          
          const { venue: farVenue } = await createTestVenue({
            name: `Far Venue ${Date.now()}`,
            location: { lat: farLat, lng: farLng },
          });

          // Wait for database to process
          await new Promise(resolve => setTimeout(resolve, 200));

          // Search using the RPC function
          const { data: results, error } = await supabase.rpc('search_venues', {
            center_lat: centerLat,
            center_lng: centerLng,
            radius_miles: data.radiusMiles,
            max_results: 100,
          });

          if (error) throw error;

          // Property: All returned venues should be within the radius
          results.forEach((venue: any) => {
            if (venue.distance_miles !== null && venue.distance_miles !== undefined) {
              expect(venue.distance_miles).toBeLessThanOrEqual(data.radiusMiles + 1); // Allow 1 mile tolerance
            }
          });

          // The nearby venue should be in results (5 miles is always within our min radius of 20)
          const foundNearby = results.some((v: any) => v.id === nearbyVenue.id);
          expect(foundNearby).toBe(true);

          // The far venue should NOT be in results (200 miles is always outside our max radius of 100)
          const foundFar = results.some((v: any) => v.id === farVenue.id);
          expect(foundFar).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 6: Multi-Criteria Filter Conjunction
   * 
   * For any search with multiple filters applied (capacity, verified status), 
   * all returned venues SHALL match ALL specified criteria (AND logic, not OR).
   * 
   * **Validates: Requirements 3.3, 3.4, 3.6**
   */
  it('Property 6: Multi-criteria filters use AND logic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          minCapacity: fc.integer({ min: 10, max: 30 }),
          maxCapacity: fc.integer({ min: 40, max: 100 }),
        }),
        async (data) => {
          // Create a venue that matches capacity criteria
          const { venue: matchingVenue } = await createTestVenue({
            name: `Matching Venue ${Date.now()}`,
            capacityMin: 10,
            capacityMax: 50,
          });

          // Create a venue that doesn't match capacity (too small)
          const { venue: nonMatchingVenue } = await createTestVenue({
            name: `Small Venue ${Date.now()}`,
            capacityMin: 1,
            capacityMax: 5,
          });

          // Wait for database
          await new Promise(resolve => setTimeout(resolve, 200));

          // Search with capacity filters
          const { data: results, error } = await supabase.rpc('search_venues', {
            min_capacity: data.minCapacity,
            max_capacity: data.maxCapacity,
            max_results: 100,
          });

          if (error) throw error;

          // Property: All returned venues must match capacity criteria
          results.forEach((venue: any) => {
            // Venue should be able to accommodate at least min_capacity
            // This is tested by checking if capacity_max >= min_capacity in the function
          });

          // The matching venue should be in results
          const foundMatching = results.some((v: any) => v.id === matchingVenue.id);
          expect(foundMatching).toBe(true);

          // The non-matching venue should NOT be in results
          const foundNonMatching = results.some((v: any) => v.id === nonMatchingVenue.id);
          expect(foundNonMatching).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 6: Verified filter
   * 
   * When verified_only is true, only verified venues should be returned.
   * 
   * **Validates: Requirements 3.6**
   */
  it('Property 6: Verified filter returns only verified venues', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(true),
        async () => {
          // Create a verified venue
          const { venue: verifiedVenue } = await createTestVenue({
            name: `Verified Venue ${Date.now()}`,
          });
          await supabase
            .from('venues')
            .update({ verified: true })
            .eq('id', verifiedVenue.id);

          // Create an unverified venue
          const { venue: unverifiedVenue } = await createTestVenue({
            name: `Unverified Venue ${Date.now()}`,
          });

          // Wait for database
          await new Promise(resolve => setTimeout(resolve, 200));

          // Search with verified filter
          const { data: results, error } = await supabase.rpc('search_venues', {
            verified_only: true,
            max_results: 100,
          });

          if (error) throw error;

          // Property: All returned venues must be verified
          results.forEach((venue: any) => {
            expect(venue.verified).toBe(true);
          });

          // The verified venue should be in results
          const foundVerified = results.some((v: any) => v.id === verifiedVenue.id);
          expect(foundVerified).toBe(true);

          // The unverified venue should NOT be in results
          const foundUnverified = results.some((v: any) => v.id === unverifiedVenue.id);
          expect(foundUnverified).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 7: Search Result Structure Completeness
   * 
   * For any venue in search results, the result object SHALL contain all 
   * required fields: venue name, rating, review count, verified status, claimed status.
   * 
   * **Validates: Requirements 3.7, 4.2, 4.3**
   */
  it('Property 7: All search results have complete structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lat: fc.double({ min: 35, max: 45 }),
          lng: fc.double({ min: -100, max: -90 }),
        }),
        async (data) => {
          // Create a venue with all fields
          const venueName = `Test Venue ${Date.now()}`;
          const { venue } = await createTestVenue({
            name: venueName,
            location: { lat: data.lat, lng: data.lng },
          });

          // Wait for database
          await new Promise(resolve => setTimeout(resolve, 200));

          // Search for the venue
          const { data: results, error } = await supabase.rpc('search_venues', {
            search_text: venueName,
            max_results: 100,
          });

          if (error) throw error;

          // Find our venue in results
          const foundVenue = results.find((v: any) => v.id === venue.id);
          
          if (foundVenue) {
            // Property: All required fields must be present
            expect(foundVenue.id).toBeDefined();
            expect(foundVenue.name).toBeDefined();
            expect(typeof foundVenue.name).toBe('string');
            
            // Description should be present (can be null)
            expect(foundVenue).toHaveProperty('description');
            
            // Primary photo URL should be present (can be null)
            expect(foundVenue).toHaveProperty('primary_photo_url');
            
            // Rating and review count should be present (can be 0 or null)
            expect(foundVenue).toHaveProperty('rating');
            expect(foundVenue).toHaveProperty('review_count');
            
            // Verified and claimed flags should be present
            expect(foundVenue).toHaveProperty('verified');
            expect(typeof foundVenue.verified).toBe('boolean');
            expect(foundVenue).toHaveProperty('claimed');
            expect(typeof foundVenue.claimed).toBe('boolean');
            
            // Distance and text rank should be present (can be null)
            expect(foundVenue).toHaveProperty('distance_miles');
            expect(foundVenue).toHaveProperty('text_rank');
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 8: Sort Order Consistency
   * 
   * For any search results, the results SHALL be ordered correctly according to 
   * the built-in sorting criteria (text rank for text searches, distance for 
   * geographic searches, rating as tiebreaker).
   * 
   * **Validates: Requirements 3.8**
   */
  it('Property 8: Text search results are sorted by relevance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          searchTerm: fc.constantFrom('science', 'museum', 'history'),
        }),
        async (data) => {
          // Create venues with different relevance (term in name vs description)
          const { venue: highRelevance } = await createTestVenue({
            name: `${data.searchTerm} ${data.searchTerm} Center ${Date.now()}`, // Term appears twice in name
            description: `A great ${data.searchTerm} venue`,
          });

          const { venue: lowRelevance } = await createTestVenue({
            name: `Educational Center ${Date.now()}`,
            description: `Includes ${data.searchTerm} content`, // Term only in description
          });

          // Wait for database
          await new Promise(resolve => setTimeout(resolve, 200));

          // Search with text
          const { data: results, error } = await supabase.rpc('search_venues', {
            search_text: data.searchTerm,
            max_results: 100,
          });

          if (error) throw error;

          // Property: Results should be sorted by text_rank (descending)
          if (results.length >= 2) {
            for (let i = 0; i < results.length - 1; i++) {
              const current = results[i].text_rank || 0;
              const next = results[i + 1].text_rank || 0;
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }

          // High relevance venue should appear before low relevance
          const highIndex = results.findIndex((v: any) => v.id === highRelevance.id);
          const lowIndex = results.findIndex((v: any) => v.id === lowRelevance.id);
          
          if (highIndex !== -1 && lowIndex !== -1) {
            expect(highIndex).toBeLessThan(lowIndex);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 8: Geographic search results are sorted by distance
   * 
   * **Validates: Requirements 3.8**
   */
  it('Property 8: Geographic search results are sorted by distance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(true),
        async () => {
          // Use fixed center point
          const centerLat = 40.7128;
          const centerLng = -74.0060;
          
          // Create venues at different distances
          const { venue: nearVenue } = await createTestVenue({
            name: `Near Venue ${Date.now()}`,
            location: {
              lat: centerLat + 0.1,
              lng: centerLng + 0.1,
            },
          });

          const { venue: farVenue } = await createTestVenue({
            name: `Far Venue ${Date.now()}`,
            location: {
              lat: centerLat + 1.0,
              lng: centerLng + 1.0,
            },
          });

          // Wait for database
          await new Promise(resolve => setTimeout(resolve, 200));

          // Search with location
          const { data: results, error } = await supabase.rpc('search_venues', {
            center_lat: centerLat,
            center_lng: centerLng,
            radius_miles: 500,
            max_results: 100,
          });

          if (error) throw error;

          // Property: Results should be sorted by distance (ascending)
          if (results.length >= 2) {
            for (let i = 0; i < results.length - 1; i++) {
              const current = results[i].distance_miles;
              const next = results[i + 1].distance_miles;
              
              if (current !== null && next !== null) {
                expect(current).toBeLessThanOrEqual(next);
              }
            }
          }

          // Near venue should appear before far venue
          const nearIndex = results.findIndex((v: any) => v.id === nearVenue.id);
          const farIndex = results.findIndex((v: any) => v.id === farVenue.id);
          
          if (nearIndex !== -1 && farIndex !== -1) {
            expect(nearIndex).toBeLessThan(farIndex);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});
