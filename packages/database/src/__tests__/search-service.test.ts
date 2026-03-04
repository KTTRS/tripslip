/**
 * Search Service Unit Tests
 * 
 * Tests for venue search functionality including:
 * - Text search
 * - Geographic radius search
 * - Multi-criteria filtering
 * - Sorting and pagination
 * 
 * Requirements: 3.1-3.9
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../search-service';
import type { SupabaseClient } from '../client';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    from: vi.fn(),
    rpc: vi.fn(),
  } as unknown as SupabaseClient;

  return mockClient;
};

describe('SearchService', () => {
  let searchService: SearchService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    searchService = new SearchService(mockSupabase);
  });

  describe('searchVenues', () => {
    it('should return empty results when no venues match', async () => {
      // Mock empty venue response
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          textSearch: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      (mockSupabase.from as any) = mockFrom;

      const result = await searchService.searchVenues({
        query: 'nonexistent venue'
      });

      expect(result.venues).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.facets).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should apply text search filter when query is provided', async () => {
      const mockTextSearch = vi.fn().mockResolvedValue({
        data: [],
        error: null
      });

      const mockSelect = vi.fn().mockReturnValue({
        textSearch: mockTextSearch
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      });

      (mockSupabase.from as any) = mockFrom;

      await searchService.searchVenues({
        query: 'science museum'
      });

      expect(mockFrom).toHaveBeenCalledWith('venues');
      expect(mockTextSearch).toHaveBeenCalledWith(
        'name,description',
        'science museum',
        { type: 'websearch', config: 'english' }
      );
    });

    it('should apply verified filter when verifiedOnly is true', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: [],
        error: null
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      });

      (mockSupabase.from as any) = mockFrom;

      await searchService.searchVenues({
        verifiedOnly: true
      });

      expect(mockEq).toHaveBeenCalledWith('verified', true);
    });

    it('should apply capacity filters correctly', async () => {
      const mockGte = vi.fn().mockReturnValue({
        lte: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      const mockSelect = vi.fn().mockReturnValue({
        gte: mockGte
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      });

      (mockSupabase.from as any) = mockFrom;

      await searchService.searchVenues({
        minCapacity: 20,
        maxCapacity: 100
      });

      expect(mockGte).toHaveBeenCalledWith('capacity_max', 20);
    });

    it('should return search results with correct structure', async () => {
      const mockVenues = [
        {
          id: '123',
          name: 'Science Museum',
          description: 'A great science museum',
          primary_photo_url: 'https://example.com/photo.jpg',
          address: {
            coordinates: { lat: 40.7128, lng: -74.0060 }
          },
          rating: 4.5,
          review_count: 100,
          verified: true,
          claimed: true,
          capacity_min: 10,
          capacity_max: 50,
          supported_age_groups: ['elementary', 'middle'],
          accessibility_features: {
            wheelchair: { available: true }
          },
          profile_completeness: 85
        }
      ];

      const mockExperiences = [
        {
          id: 'exp-123',
          venue_id: '123',
          subjects: ['science', 'biology']
        }
      ];

      const mockPricingTiers = [
        {
          experience_id: 'exp-123',
          price_cents: 1500
        }
      ];

      // Mock venue query
      const mockVenueQuery = {
        data: mockVenues,
        error: null
      };

      // Mock experience query
      const mockExpQuery = {
        data: mockExperiences,
        error: null
      };

      // Mock pricing query
      const mockPricingQuery = {
        data: mockPricingTiers,
        error: null
      };

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'venues') {
          return {
            select: vi.fn().mockResolvedValue(mockVenueQuery)
          };
        } else if (table === 'experiences') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue(mockExpQuery)
              })
            })
          };
        } else if (table === 'pricing_tiers') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue(mockPricingQuery)
            })
          };
        }
      });

      (mockSupabase.from as any) = mockFrom;

      const result = await searchService.searchVenues({
        limit: 10
      });

      expect(result.venues).toHaveLength(1);
      expect(result.venues[0]).toMatchObject({
        id: '123',
        name: 'Science Museum',
        description: 'A great science museum',
        verified: true,
        claimed: true
      });
      expect(result.venues[0].subjectAreas).toContain('science');
      expect(result.venues[0].subjectAreas).toContain('biology');
      expect(result.total).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      (mockSupabase.from as any) = mockFrom;

      await expect(searchService.searchVenues({})).rejects.toThrow();
    });

    it('should use default limit of 25 when not specified', async () => {
      const mockVenues = Array.from({ length: 30 }, (_, i) => ({
        id: `venue-${i}`,
        name: `Venue ${i}`,
        description: 'Test venue',
        rating: 4.0,
        review_count: 10,
        verified: true,
        claimed: false,
        profile_completeness: 50
      }));

      const mockExperiences = mockVenues.map(v => ({
        id: `exp-${v.id}`,
        venue_id: v.id,
        subjects: ['test']
      }));

      const mockPricingTiers = mockExperiences.map(e => ({
        experience_id: e.id,
        price_cents: 1000
      }));

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'venues') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockVenues,
              error: null
            })
          };
        } else if (table === 'experiences') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockExperiences,
                  error: null
                })
              })
            })
          };
        } else if (table === 'pricing_tiers') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockPricingTiers,
                error: null
              })
            })
          };
        }
      });

      (mockSupabase.from as any) = mockFrom;

      const result = await searchService.searchVenues({});

      expect(result.venues.length).toBeLessThanOrEqual(25);
    });
  });

  describe('Facet generation', () => {
    it('should generate facets for subject areas', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Venue 1',
          rating: 4.0,
          review_count: 10,
          verified: true,
          profile_completeness: 50
        }
      ];

      const mockExperiences = [
        {
          id: 'exp-1',
          venue_id: '1',
          subjects: ['science', 'math']
        }
      ];

      const mockPricingTiers = [
        {
          experience_id: 'exp-1',
          price_cents: 1500
        }
      ];

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'venues') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockVenues,
              error: null
            })
          };
        } else if (table === 'experiences') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockExperiences,
                  error: null
                })
              })
            })
          };
        } else if (table === 'pricing_tiers') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockPricingTiers,
                error: null
              })
            })
          };
        }
      });

      (mockSupabase.from as any) = mockFrom;

      const result = await searchService.searchVenues({});

      expect(result.facets.subjectAreas).toBeDefined();
      expect(result.facets.subjectAreas.length).toBeGreaterThan(0);
    });

    it('should generate facets for price ranges', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Venue 1',
          rating: 4.0,
          review_count: 10,
          verified: true,
          profile_completeness: 50
        }
      ];

      const mockExperiences = [
        {
          id: 'exp-1',
          venue_id: '1',
          subjects: ['science']
        }
      ];

      const mockPricingTiers = [
        {
          experience_id: 'exp-1',
          price_cents: 1500
        }
      ];

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'venues') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockVenues,
              error: null
            })
          };
        } else if (table === 'experiences') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockExperiences,
                  error: null
                })
              })
            })
          };
        } else if (table === 'pricing_tiers') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockPricingTiers,
                error: null
              })
            })
          };
        }
      });

      (mockSupabase.from as any) = mockFrom;

      const result = await searchService.searchVenues({});

      expect(result.facets.priceRanges).toBeDefined();
      expect(result.facets.priceRanges.length).toBeGreaterThan(0);
    });
  });

  describe('Distance calculations', () => {
    it('should calculate distance between two points correctly', async () => {
      // Test Haversine formula with known coordinates
      // New York to Los Angeles is approximately 2451 miles
      const service = searchService as any;
      const distance = service.calculateDistance(
        40.7128, -74.0060,  // New York
        34.0522, -118.2437  // Los Angeles
      );

      // Allow for some rounding error
      expect(distance).toBeGreaterThan(2400);
      expect(distance).toBeLessThan(2500);
    });

    it('should convert degrees to radians correctly', async () => {
      const service = searchService as any;
      const radians = service.toRad(180);
      expect(radians).toBeCloseTo(Math.PI, 5);
    });
  });
});
