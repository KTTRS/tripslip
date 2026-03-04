/**
 * Venue Profile Service Tests
 * 
 * Tests CRUD operations, profile completeness calculation, and photo gallery management
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VenueProfileService } from '../venue-profile-service';
import type { SupabaseClient } from '../client';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    from: vi.fn(() => mockClient),
    select: vi.fn(() => mockClient),
    insert: vi.fn(() => mockClient),
    update: vi.fn(() => mockClient),
    delete: vi.fn(() => mockClient),
    eq: vi.fn(() => mockClient),
    single: vi.fn(() => mockClient),
    order: vi.fn(() => mockClient),
    limit: vi.fn(() => mockClient),
    range: vi.fn(() => mockClient),
  };
  return mockClient as unknown as SupabaseClient;
};

describe('VenueProfileService', () => {
  let service: VenueProfileService;
  let mockClient: SupabaseClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    service = new VenueProfileService(mockClient);
  });

  describe('createVenueProfile', () => {
    it('should create a venue profile with basic information', async () => {
      const mockVenue = {
        id: '123',
        name: 'Test Museum',
        description: 'A great museum',
        address: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA',
          coordinates: { lat: 42.3601, lng: -71.0589 },
        },
        contact_email: 'info@testmuseum.com',
        contact_phone: '555-1234',
        profile_completeness: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock the insert call
      vi.spyOn(mockClient, 'from').mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockVenue, error: null }),
          }),
        }),
      } as any);

      // Mock the update call for profile completeness
      vi.spyOn(mockClient, 'from').mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockVenue, error: null }),
          }),
        }),
      } as any).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { ...mockVenue, profile_completeness: 45 }, 
                error: null 
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.createVenueProfile({
        name: 'Test Museum',
        description: 'A great museum',
        address: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA',
          coordinates: { lat: 42.3601, lng: -71.0589 },
        },
        contact_email: 'info@testmuseum.com',
        contact_phone: '555-1234',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should handle errors during creation', async () => {
      const mockError = new Error('Database error');

      vi.spyOn(mockClient, 'from').mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      } as any);

      const result = await service.createVenueProfile({
        name: 'Test Museum',
        contact_email: 'info@testmuseum.com',
      });

      expect(result.error).toBe(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe('getVenueProfile', () => {
    it('should retrieve a venue profile by ID', async () => {
      const mockVenue = {
        id: '123',
        name: 'Test Museum',
        contact_email: 'info@testmuseum.com',
      };

      vi.spyOn(mockClient, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockVenue, error: null }),
          }),
        }),
      } as any);

      const result = await service.getVenueProfile('123');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockVenue);
    });

    it('should handle not found errors', async () => {
      const mockError = new Error('Not found');

      vi.spyOn(mockClient, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      } as any);

      const result = await service.getVenueProfile('nonexistent');

      expect(result.error).toBe(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe('updateVenueProfile', () => {
    it('should update venue profile fields', async () => {
      const mockUpdatedVenue = {
        id: '123',
        name: 'Updated Museum',
        description: 'Updated description',
        contact_email: 'info@testmuseum.com',
        profile_completeness: 50,
      };

      const fromSpy = vi.spyOn(mockClient, 'from');
      
      // Mock update call
      fromSpy.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedVenue, error: null }),
            }),
          }),
        }),
      } as any);

      // Mock photo count query
      fromSpy.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as any);

      const result = await service.updateVenueProfile('123', {
        name: 'Updated Museum',
        description: 'Updated description',
      });

      // Should complete without error (data may be null if completeness unchanged)
      expect(result.error).toBeNull();
    });
  });

  describe('deleteVenueProfile', () => {
    it('should delete a venue profile', async () => {
      vi.spyOn(mockClient, 'from').mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const result = await service.deleteVenueProfile('123');

      expect(result.error).toBeNull();
    });
  });

  describe('photo gallery management', () => {
    it('should get venue photos ordered by display_order', async () => {
      const mockPhotos = [
        { id: '1', venue_id: '123', url: 'photo1.jpg', display_order: 0, uploaded_at: '2024-01-01' },
        { id: '2', venue_id: '123', url: 'photo2.jpg', display_order: 1, uploaded_at: '2024-01-02' },
      ];

      vi.spyOn(mockClient, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPhotos, error: null }),
          }),
        }),
      } as any);

      const result = await service.getVenuePhotos('123');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockPhotos);
    });

    it('should update photo display order', async () => {
      vi.spyOn(mockClient, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const result = await service.updatePhotoOrder('photo1', 5);

      expect(result.error).toBeNull();
    });

    it('should reorder multiple photos', async () => {
      vi.spyOn(mockClient, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const result = await service.reorderPhotos([
        { id: 'photo1', displayOrder: 2 },
        { id: 'photo2', displayOrder: 0 },
        { id: 'photo3', displayOrder: 1 },
      ]);

      expect(result.error).toBeNull();
    });
  });

  describe('profile completeness', () => {
    it('should calculate profile completeness correctly', async () => {
      const mockVenue = {
        id: '123',
        name: 'Complete Museum',
        description: 'A very detailed description that is longer than 50 characters to meet the requirement',
        address: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA',
          coordinates: { lat: 42.3601, lng: -71.0589 },
        },
        contact_email: 'info@museum.com',
        contact_phone: '555-1234',
        operating_hours: [{ dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', closed: false }],
        booking_lead_time_days: 7,
        capacity_min: 10,
        capacity_max: 100,
        supported_age_groups: ['elementary', 'middle'],
        accessibility_features: { wheelchair: { type: 'wheelchair', available: true } },
        primary_photo_url: 'photo.jpg',
        website: 'https://museum.com',
        virtual_tour_url: 'https://tour.museum.com',
        profile_completeness: 0,
      };

      const fromSpy = vi.spyOn(mockClient, 'from');

      // Mock get venue profile
      fromSpy.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockVenue, error: null }),
          }),
        }),
      } as any);

      // Mock get photos
      fromSpy.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ 
              data: [
                { id: '1', venue_id: '123', url: 'p1.jpg', display_order: 0 },
                { id: '2', venue_id: '123', url: 'p2.jpg', display_order: 1 },
                { id: '3', venue_id: '123', url: 'p3.jpg', display_order: 2 },
              ], 
              error: null 
            }),
          }),
        }),
      } as any);

      // Mock update completeness
      fromSpy.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const result = await service.recalculateProfileCompleteness('123');

      expect(result.error).toBeNull();
      expect(result.completeness).toBeGreaterThan(80); // Should be high with all fields filled
    });
  });
});
