/**
 * Unit Tests - Experience Service
 * 
 * Tests the experience service functionality including:
 * - Experience CRUD operations
 * - Search and filtering
 * - Validation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperienceService } from '../../experience-service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Experience, ExperienceFilters } from '../../types';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
} as unknown as SupabaseClient;

// Helper to create mock query builder
const createMockQueryBuilder = (data: any = null, error: any = null) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data, error }),
  maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  then: vi.fn().mockResolvedValue({ data, error }),
});

const mockExperience: Experience = {
  id: 'exp-1',
  venue_id: 'venue-1',
  title: 'Space Exploration',
  description: 'Learn about space and planets',
  description_es: 'Aprende sobre el espacio y los planetas',
  duration_minutes: 90,
  capacity: 30,
  min_students: 10,
  max_students: 25,
  grade_levels: 'K,1,2,3,4,5',
  subjects: 'Science,STEM',
  currency: 'usd',
  pricing_tiers: [
    {
      id: 'tier-1',
      min_students: 10,
      max_students: 15,
      price_cents: 1500,
      free_chaperones: 2,
    },
    {
      id: 'tier-2',
      min_students: 16,
      max_students: 25,
      price_cents: 1200,
      free_chaperones: 3,
    },
  ],
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ExperienceService', () => {
  let experienceService: ExperienceService;

  beforeEach(() => {
    vi.clearAllMocks();
    experienceService = new ExperienceService(mockSupabaseClient);
  });

  describe('getExperience', () => {
    it('retrieves experience by ID', async () => {
      const mockQueryBuilder = createMockQueryBuilder(mockExperience);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const result = await experienceService.getExperience('exp-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('experiences');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, pricing_tiers(*)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'exp-1');
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockExperience);
    });

    it('returns null when experience not found', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const result = await experienceService.getExperience('nonexistent');

      expect(result).toBeNull();
    });

    it('throws error for database errors', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, { message: 'Database error' });
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      await expect(experienceService.getExperience('exp-1')).rejects.toThrow('Database error');
    });
  });

  describe('getExperiencesByVenue', () => {
    it('retrieves experiences for a venue', async () => {
      const experiences = [mockExperience];
      const mockQueryBuilder = createMockQueryBuilder(experiences);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const result = await experienceService.getExperiencesByVenue('venue-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('experiences');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, pricing_tiers(*)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('venue_id', 'venue-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('title');
      expect(result).toEqual(experiences);
    });

    it('includes inactive experiences when requested', async () => {
      const experiences = [mockExperience];
      const mockQueryBuilder = createMockQueryBuilder(experiences);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      await experienceService.getExperiencesByVenue('venue-1', { includeInactive: true });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('venue_id', 'venue-1');
      expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('searchExperiences', () => {
    it('searches experiences with basic filters', async () => {
      const experiences = [mockExperience];
      const mockQueryBuilder = createMockQueryBuilder(experiences);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const filters: ExperienceFilters = {
        query: 'space',
        gradeLevel: '3',
        subject: 'Science',
      };

      const result = await experienceService.searchExperiences(filters);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('title', '%space%');
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('grade_levels', '%3%');
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('subjects', '%Science%');
      expect(result).toEqual(experiences);
    });

    it('applies capacity filters', async () => {
      const experiences = [mockExperience];
      const mockQueryBuilder = createMockQueryBuilder(experiences);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const filters: ExperienceFilters = {
        minCapacity: 20,
        maxCapacity: 50,
      };

      await experienceService.searchExperiences(filters);

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('capacity', 20);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('capacity', 50);
    });

    it('applies duration filters', async () => {
      const experiences = [mockExperience];
      const mockQueryBuilder = createMockQueryBuilder(experiences);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const filters: ExperienceFilters = {
        minDuration: 60,
        maxDuration: 120,
      };

      await experienceService.searchExperiences(filters);

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('duration_minutes', 60);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('duration_minutes', 120);
    });

    it('applies venue filter', async () => {
      const experiences = [mockExperience];
      const mockQueryBuilder = createMockQueryBuilder(experiences);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const filters: ExperienceFilters = {
        venueIds: ['venue-1', 'venue-2'],
      };

      await experienceService.searchExperiences(filters);

      expect(mockQueryBuilder.in).toHaveBeenCalledWith('venue_id', ['venue-1', 'venue-2']);
    });

    it('applies pagination', async () => {
      const experiences = [mockExperience];
      const mockQueryBuilder = createMockQueryBuilder(experiences);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const filters: ExperienceFilters = {
        page: 2,
        limit: 10,
      };

      await experienceService.searchExperiences(filters);

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(10, 19); // page 2, limit 10
    });

    it('applies sorting', async () => {
      const experiences = [mockExperience];
      const mockQueryBuilder = createMockQueryBuilder(experiences);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const filters: ExperienceFilters = {
        sortBy: 'duration',
        sortOrder: 'desc',
      };

      await experienceService.searchExperiences(filters);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('duration_minutes', { ascending: false });
    });
  });

  describe('createExperience', () => {
    it('creates new experience', async () => {
      const newExperience = {
        venue_id: 'venue-1',
        title: 'New Experience',
        description: 'A new educational experience',
        duration_minutes: 60,
        capacity: 25,
        min_students: 10,
        max_students: 20,
        grade_levels: '1,2,3',
        subjects: 'Math',
        currency: 'usd',
      };

      const mockQueryBuilder = createMockQueryBuilder(mockExperience);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const result = await experienceService.createExperience(newExperience);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('experiences');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(newExperience);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, pricing_tiers(*)');
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockExperience);
    });

    it('validates required fields', async () => {
      const invalidExperience = {
        venue_id: 'venue-1',
        // Missing required fields
      };

      await expect(experienceService.createExperience(invalidExperience as any))
        .rejects.toThrow('Missing required fields');
    });

    it('validates duration range', async () => {
      const invalidExperience = {
        venue_id: 'venue-1',
        title: 'Test',
        description: 'Test description',
        duration_minutes: 5, // Too short
        capacity: 25,
        min_students: 10,
        max_students: 20,
        grade_levels: '1,2,3',
        subjects: 'Math',
        currency: 'usd',
      };

      await expect(experienceService.createExperience(invalidExperience))
        .rejects.toThrow('Duration must be between 15 and 480 minutes');
    });

    it('validates student capacity', async () => {
      const invalidExperience = {
        venue_id: 'venue-1',
        title: 'Test',
        description: 'Test description',
        duration_minutes: 60,
        capacity: 25,
        min_students: 20, // Greater than max
        max_students: 15,
        grade_levels: '1,2,3',
        subjects: 'Math',
        currency: 'usd',
      };

      await expect(experienceService.createExperience(invalidExperience))
        .rejects.toThrow('Minimum students cannot exceed maximum students');
    });
  });

  describe('updateExperience', () => {
    it('updates existing experience', async () => {
      const updates = {
        title: 'Updated Experience',
        description: 'Updated description',
      };

      const updatedExperience = { ...mockExperience, ...updates };
      const mockQueryBuilder = createMockQueryBuilder(updatedExperience);
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      const result = await experienceService.updateExperience('exp-1', updates);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('experiences');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String),
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'exp-1');
      expect(result).toEqual(updatedExperience);
    });

    it('validates updates', async () => {
      const invalidUpdates = {
        duration_minutes: 5, // Too short
      };

      await expect(experienceService.updateExperience('exp-1', invalidUpdates))
        .rejects.toThrow('Duration must be between 15 and 480 minutes');
    });

    it('throws error when experience not found', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      await expect(experienceService.updateExperience('nonexistent', { title: 'New Title' }))
        .rejects.toThrow('Experience not found');
    });
  });

  describe('deleteExperience', () => {
    it('soft deletes experience', async () => {
      const mockQueryBuilder = createMockQueryBuilder({ id: 'exp-1' });
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      await experienceService.deleteExperience('exp-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('experiences');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(String),
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'exp-1');
    });

    it('throws error when experience not found', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });
      (mockSupabaseClient.from as any).mockReturnValue(mockQueryBuilder);

      await expect(experienceService.deleteExperience('nonexistent'))
        .rejects.toThrow('Experience not found');
    });
  });

  describe('getPricingForGroup', () => {
    it('returns correct pricing tier for group size', () => {
      const pricing = experienceService.getPricingForGroup(mockExperience, 12);

      expect(pricing).toEqual({
        tier: mockExperience.pricing_tiers[0],
        totalPrice: 1500 * 12,
        pricePerStudent: 1500,
        freeChaperones: 2,
      });
    });

    it('returns higher tier for larger groups', () => {
      const pricing = experienceService.getPricingForGroup(mockExperience, 20);

      expect(pricing).toEqual({
        tier: mockExperience.pricing_tiers[1],
        totalPrice: 1200 * 20,
        pricePerStudent: 1200,
        freeChaperones: 3,
      });
    });

    it('returns null when no tier matches', () => {
      const pricing = experienceService.getPricingForGroup(mockExperience, 5); // Below minimum

      expect(pricing).toBeNull();
    });

    it('returns null when group exceeds maximum', () => {
      const pricing = experienceService.getPricingForGroup(mockExperience, 30); // Above maximum

      expect(pricing).toBeNull();
    });
  });

  describe('isAvailableForGrade', () => {
    it('returns true for supported grade levels', () => {
      expect(experienceService.isAvailableForGrade(mockExperience, 'K')).toBe(true);
      expect(experienceService.isAvailableForGrade(mockExperience, '3')).toBe(true);
      expect(experienceService.isAvailableForGrade(mockExperience, '5')).toBe(true);
    });

    it('returns false for unsupported grade levels', () => {
      expect(experienceService.isAvailableForGrade(mockExperience, '6')).toBe(false);
      expect(experienceService.isAvailableForGrade(mockExperience, '12')).toBe(false);
    });

    it('handles empty grade levels', () => {
      const experienceWithoutGrades = { ...mockExperience, grade_levels: '' };
      expect(experienceService.isAvailableForGrade(experienceWithoutGrades, '3')).toBe(false);
    });
  });

  describe('isAvailableForSubject', () => {
    it('returns true for supported subjects', () => {
      expect(experienceService.isAvailableForSubject(mockExperience, 'Science')).toBe(true);
      expect(experienceService.isAvailableForSubject(mockExperience, 'STEM')).toBe(true);
    });

    it('returns false for unsupported subjects', () => {
      expect(experienceService.isAvailableForSubject(mockExperience, 'History')).toBe(false);
      expect(experienceService.isAvailableForSubject(mockExperience, 'Art')).toBe(false);
    });

    it('handles case-insensitive matching', () => {
      expect(experienceService.isAvailableForSubject(mockExperience, 'science')).toBe(true);
      expect(experienceService.isAvailableForSubject(mockExperience, 'stem')).toBe(true);
    });
  });

  describe('validateExperienceData', () => {
    it('validates complete experience data', () => {
      const validData = {
        venue_id: 'venue-1',
        title: 'Valid Experience',
        description: 'A valid description that is long enough',
        duration_minutes: 90,
        capacity: 30,
        min_students: 10,
        max_students: 25,
        grade_levels: 'K,1,2,3',
        subjects: 'Science,Math',
        currency: 'usd',
      };

      expect(() => experienceService.validateExperienceData(validData)).not.toThrow();
    });

    it('throws for missing required fields', () => {
      const invalidData = {
        venue_id: 'venue-1',
        // Missing title and other required fields
      };

      expect(() => experienceService.validateExperienceData(invalidData as any))
        .toThrow('Missing required fields');
    });

    it('throws for invalid duration', () => {
      const invalidData = {
        venue_id: 'venue-1',
        title: 'Test',
        description: 'Test description',
        duration_minutes: 500, // Too long
        capacity: 30,
        min_students: 10,
        max_students: 25,
        grade_levels: 'K,1,2,3',
        subjects: 'Science',
        currency: 'usd',
      };

      expect(() => experienceService.validateExperienceData(invalidData))
        .toThrow('Duration must be between 15 and 480 minutes');
    });

    it('throws for invalid capacity', () => {
      const invalidData = {
        venue_id: 'venue-1',
        title: 'Test',
        description: 'Test description',
        duration_minutes: 90,
        capacity: 0, // Invalid
        min_students: 10,
        max_students: 25,
        grade_levels: 'K,1,2,3',
        subjects: 'Science',
        currency: 'usd',
      };

      expect(() => experienceService.validateExperienceData(invalidData))
        .toThrow('Capacity must be at least 1');
    });
  });
});