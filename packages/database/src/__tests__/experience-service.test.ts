/**
 * Unit tests for Experience Service
 * 
 * Tests CRUD operations, validation, and business logic for experience management
 * Requirements: 2.1-2.8, 8.1-8.10
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ExperienceService,
  CreateExperienceInput,
  UpdateExperienceInput,
  CurriculumStandard,
} from '../experience-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('ExperienceService', () => {
  let supabase: SupabaseClient;
  let service: ExperienceService;
  let testVenueId: string;
  let testUserId: string;

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    service = new ExperienceService(supabase);

    // Create a test venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: 'Test Museum',
        description: 'A test museum for experience testing',
        contact_email: 'test@museum.com',
        contact_phone: '555-0100',
      })
      .select()
      .single();

    if (venueError) throw venueError;
    testVenueId = venue.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }
  });

  describe('createExperience', () => {
    it('should create a basic experience with required fields', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Ancient Egypt Tour',
        description: 'Explore the wonders of ancient Egypt',
        durationMinutes: 90,
        capacity: 50,
      };

      const experience = await service.createExperience(input);

      expect(experience).toBeDefined();
      expect(experience.id).toBeDefined();
      expect(experience.title).toBe('Ancient Egypt Tour');
      expect(experience.durationMinutes).toBe(90);
      expect(experience.capacity).toBe(50);
      expect(experience.active).toBe(true);
      expect(experience.published).toBe(false);
    });

    it('should create experience with educational objectives', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Science Lab Workshop',
        durationMinutes: 120,
        capacity: 30,
        educationalObjectives: [
          'Understand scientific method',
          'Conduct hands-on experiments',
          'Analyze experimental results',
        ],
      };

      const experience = await service.createExperience(input);

      expect(experience.educationalObjectives).toHaveLength(3);
      expect(experience.educationalObjectives).toContain('Understand scientific method');
    });

    it('should create experience with curriculum standards', async () => {
      const standards: CurriculumStandard[] = [
        {
          framework: 'Common Core',
          code: 'CCSS.MATH.CONTENT.5.NBT.A.1',
          description: 'Recognize that in a multi-digit number',
        },
        {
          framework: 'NGSS',
          code: '5-PS1-1',
          description: 'Develop a model to describe matter',
        },
      ];

      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Math & Science Integration',
        durationMinutes: 60,
        capacity: 25,
        curriculumStandards: standards,
      };

      const experience = await service.createExperience(input);

      expect(experience.curriculumStandards).toHaveLength(2);
      expect(experience.curriculumStandards[0].framework).toBe('Common Core');
      expect(experience.curriculumStandards[1].framework).toBe('NGSS');
    });

    it('should create experience with age range', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Elementary Art Workshop',
        durationMinutes: 45,
        capacity: 20,
        recommendedAgeMin: 6,
        recommendedAgeMax: 10,
      };

      const experience = await service.createExperience(input);

      expect(experience.recommendedAgeMin).toBe(6);
      expect(experience.recommendedAgeMax).toBe(10);
    });

    it('should create experience with grade levels and subjects', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'History Through Art',
        durationMinutes: 90,
        capacity: 30,
        gradeLevels: ['3rd', '4th', '5th'],
        subjects: ['History', 'Art', 'Social Studies'],
      };

      const experience = await service.createExperience(input);

      expect(experience.gradeLevels).toHaveLength(3);
      expect(experience.subjects).toHaveLength(3);
      expect(experience.subjects).toContain('History');
    });

    it('should create experience with pricing tiers', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Planetarium Show',
        durationMinutes: 60,
        capacity: 100,
        pricingTiers: [
          {
            minStudents: 1,
            maxStudents: 20,
            priceCents: 1500,
            freeChaperones: 2,
          },
          {
            minStudents: 21,
            maxStudents: 50,
            priceCents: 1200,
            freeChaperones: 3,
          },
        ],
      };

      const experience = await service.createExperience(input);

      expect(experience.pricingTiers).toHaveLength(2);
      expect(experience.pricingTiers![0].priceCents).toBe(1500);
      expect(experience.pricingTiers![1].priceCents).toBe(1200);
    });

    it('should create experience with additional fees', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Cooking Class',
        durationMinutes: 120,
        capacity: 15,
        pricingTiers: [
          {
            minStudents: 1,
            maxStudents: 15,
            priceCents: 2500,
            freeChaperones: 1,
            additionalFees: [
              { name: 'Materials Fee', amountCents: 500, required: true },
              { name: 'Recipe Book', amountCents: 300, required: false },
            ],
          },
        ],
      };

      const experience = await service.createExperience(input);

      expect(experience.pricingTiers![0].additionalFees).toHaveLength(2);
      expect(experience.pricingTiers![0].additionalFees![0].name).toBe('Materials Fee');
      expect(experience.pricingTiers![0].additionalFees![0].required).toBe(true);
    });

    it('should create experience with custom cancellation policy', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Special Event',
        durationMinutes: 180,
        capacity: 50,
        cancellationPolicy: {
          fullRefundDays: 30,
          partialRefundDays: 14,
          partialRefundPercent: 75,
          noRefundAfterDays: 7,
        },
      };

      const experience = await service.createExperience(input);

      expect(experience.cancellationPolicy.fullRefundDays).toBe(30);
      expect(experience.cancellationPolicy.partialRefundPercent).toBe(75);
    });

    it('should use default cancellation policy if not provided', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Standard Tour',
        durationMinutes: 60,
        capacity: 40,
      };

      const experience = await service.createExperience(input);

      expect(experience.cancellationPolicy.fullRefundDays).toBe(14);
      expect(experience.cancellationPolicy.partialRefundDays).toBe(7);
      expect(experience.cancellationPolicy.partialRefundPercent).toBe(50);
      expect(experience.cancellationPolicy.noRefundAfterDays).toBe(3);
    });

    it('should reject experience without required fields', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: '',
        durationMinutes: 0,
        capacity: 10,
      };

      await expect(service.createExperience(input)).rejects.toThrow();
    });

    it('should reject experience with negative pricing', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Invalid Pricing',
        durationMinutes: 60,
        capacity: 20,
        pricingTiers: [
          {
            minStudents: 1,
            maxStudents: 20,
            priceCents: -100,
            freeChaperones: 1,
          },
        ],
      };

      await expect(service.createExperience(input)).rejects.toThrow(
        'Pricing values must be positive numbers'
      );
    });

    it('should reject experience with negative additional fees', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Invalid Fees',
        durationMinutes: 60,
        capacity: 20,
        pricingTiers: [
          {
            minStudents: 1,
            maxStudents: 20,
            priceCents: 1000,
            freeChaperones: 1,
            additionalFees: [{ name: 'Bad Fee', amountCents: -50, required: true }],
          },
        ],
      };

      await expect(service.createExperience(input)).rejects.toThrow(
        'Additional fee amounts must be positive numbers'
      );
    });
  });

  describe('getExperience', () => {
    it('should retrieve an experience by ID', async () => {
      const input: CreateExperienceInput = {
        venueId: testVenueId,
        title: 'Test Experience',
        durationMinutes: 60,
        capacity: 30,
      };

      const created = await service.createExperience(input);
      const retrieved = await service.getExperience(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe('Test Experience');
    });

    it('should throw error for non-existent experience', async () => {
      await expect(service.getExperience('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        'Experience not found'
      );
    });
  });

  describe('getVenueExperiences', () => {
    it('should retrieve all active experiences for a venue', async () => {
      await service.createExperience({
        venueId: testVenueId,
        title: 'Experience 1',
        durationMinutes: 60,
        capacity: 30,
        active: true,
      });

      await service.createExperience({
        venueId: testVenueId,
        title: 'Experience 2',
        durationMinutes: 90,
        capacity: 40,
        active: true,
      });

      const experiences = await service.getVenueExperiences(testVenueId);

      expect(experiences).toHaveLength(2);
    });

    it('should exclude inactive experiences by default', async () => {
      await service.createExperience({
        venueId: testVenueId,
        title: 'Active Experience',
        durationMinutes: 60,
        capacity: 30,
        active: true,
      });

      await service.createExperience({
        venueId: testVenueId,
        title: 'Inactive Experience',
        durationMinutes: 60,
        capacity: 30,
        active: false,
      });

      const experiences = await service.getVenueExperiences(testVenueId);

      expect(experiences).toHaveLength(1);
      expect(experiences[0].title).toBe('Active Experience');
    });

    it('should include inactive experiences when requested', async () => {
      await service.createExperience({
        venueId: testVenueId,
        title: 'Active Experience',
        durationMinutes: 60,
        capacity: 30,
        active: true,
      });

      await service.createExperience({
        venueId: testVenueId,
        title: 'Inactive Experience',
        durationMinutes: 60,
        capacity: 30,
        active: false,
      });

      const experiences = await service.getVenueExperiences(testVenueId, true);

      expect(experiences).toHaveLength(2);
    });
  });

  describe('updateExperience', () => {
    it('should update experience title and description', async () => {
      const created = await service.createExperience({
        venueId: testVenueId,
        title: 'Original Title',
        description: 'Original description',
        durationMinutes: 60,
        capacity: 30,
      });

      const updated = await service.updateExperience(created.id, {
        title: 'Updated Title',
        description: 'Updated description',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated description');
    });

    it('should update educational objectives', async () => {
      const created = await service.createExperience({
        venueId: testVenueId,
        title: 'Workshop',
        durationMinutes: 60,
        capacity: 30,
        educationalObjectives: ['Objective 1'],
      });

      const updated = await service.updateExperience(created.id, {
        educationalObjectives: ['Objective 1', 'Objective 2', 'Objective 3'],
      });

      expect(updated.educationalObjectives).toHaveLength(3);
    });

    it('should update age range', async () => {
      const created = await service.createExperience({
        venueId: testVenueId,
        title: 'Workshop',
        durationMinutes: 60,
        capacity: 30,
        recommendedAgeMin: 5,
        recommendedAgeMax: 8,
      });

      const updated = await service.updateExperience(created.id, {
        recommendedAgeMin: 7,
        recommendedAgeMax: 12,
      });

      expect(updated.recommendedAgeMin).toBe(7);
      expect(updated.recommendedAgeMax).toBe(12);
    });
  });

  describe('setExperienceActive', () => {
    it('should mark experience as inactive', async () => {
      const created = await service.createExperience({
        venueId: testVenueId,
        title: 'Active Experience',
        durationMinutes: 60,
        capacity: 30,
        active: true,
      });

      await service.setExperienceActive(created.id, false);
      const updated = await service.getExperience(created.id);

      expect(updated.active).toBe(false);
    });

    it('should mark experience as active', async () => {
      const created = await service.createExperience({
        venueId: testVenueId,
        title: 'Inactive Experience',
        durationMinutes: 60,
        capacity: 30,
        active: false,
      });

      await service.setExperienceActive(created.id, true);
      const updated = await service.getExperience(created.id);

      expect(updated.active).toBe(true);
    });
  });

  describe('duplicateExperience', () => {
    it('should duplicate an experience with all data', async () => {
      const original = await service.createExperience({
        venueId: testVenueId,
        title: 'Original Experience',
        description: 'Original description',
        durationMinutes: 90,
        capacity: 40,
        educationalObjectives: ['Objective 1', 'Objective 2'],
        gradeLevels: ['3rd', '4th'],
        subjects: ['Science', 'Math'],
        pricingTiers: [
          {
            minStudents: 1,
            maxStudents: 20,
            priceCents: 1500,
            freeChaperones: 2,
          },
        ],
      });

      const duplicate = await service.duplicateExperience(original.id);

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.title).toBe('Original Experience (Copy)');
      expect(duplicate.description).toBe(original.description);
      expect(duplicate.durationMinutes).toBe(original.durationMinutes);
      expect(duplicate.educationalObjectives).toEqual(original.educationalObjectives);
      expect(duplicate.gradeLevels).toEqual(original.gradeLevels);
      expect(duplicate.subjects).toEqual(original.subjects);
      expect(duplicate.pricingTiers).toHaveLength(1);
      expect(duplicate.active).toBe(false);
      expect(duplicate.published).toBe(false);
    });

    it('should duplicate with custom title', async () => {
      const original = await service.createExperience({
        venueId: testVenueId,
        title: 'Original',
        durationMinutes: 60,
        capacity: 30,
      });

      const duplicate = await service.duplicateExperience(original.id, 'Custom Title');

      expect(duplicate.title).toBe('Custom Title');
    });
  });

  describe('deleteExperience', () => {
    it('should delete an experience', async () => {
      const created = await service.createExperience({
        venueId: testVenueId,
        title: 'To Delete',
        durationMinutes: 60,
        capacity: 30,
      });

      await service.deleteExperience(created.id);

      await expect(service.getExperience(created.id)).rejects.toThrow('Experience not found');
    });
  });

  describe('updatePricingTiers', () => {
    it('should replace pricing tiers', async () => {
      const created = await service.createExperience({
        venueId: testVenueId,
        title: 'Experience',
        durationMinutes: 60,
        capacity: 30,
        pricingTiers: [
          {
            minStudents: 1,
            maxStudents: 20,
            priceCents: 1000,
            freeChaperones: 1,
          },
        ],
      });

      await service.updatePricingTiers(created.id, [
        {
          minStudents: 1,
          maxStudents: 15,
          priceCents: 1500,
          freeChaperones: 2,
        },
        {
          minStudents: 16,
          maxStudents: 30,
          priceCents: 1200,
          freeChaperones: 3,
        },
      ]);

      const updated = await service.getExperience(created.id);

      expect(updated.pricingTiers).toHaveLength(2);
      expect(updated.pricingTiers![0].priceCents).toBe(1500);
    });

    it('should reject negative pricing in update', async () => {
      const created = await service.createExperience({
        venueId: testVenueId,
        title: 'Experience',
        durationMinutes: 60,
        capacity: 30,
      });

      await expect(
        service.updatePricingTiers(created.id, [
          {
            minStudents: 1,
            maxStudents: 20,
            priceCents: -100,
            freeChaperones: 1,
          },
        ])
      ).rejects.toThrow('Pricing values must be positive numbers');
    });
  });
});
