/**
 * Property-Based Tests - Experience Operations (Task 5.2)
 * 
 * Tests three core properties:
 * - Property 15: Experience Active Status Search Visibility
 * - Property 16: Experience Duplication Data Copy
 * - Property 17: Positive Pricing Validation
 * 
 * **Validates: Requirements 8.7, 8.8, 8.9**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ExperienceService, CreateExperienceInput } from '../../experience-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Experience Operations (Task 5.2)', () => {
  let supabase: SupabaseClient;
  let service: ExperienceService;
  let testVenueId: string;
  const createdExperienceIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    service = new ExperienceService(supabase);

    // Create a test venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: `Test Venue ${Date.now()}`,
        description: 'A test venue for property testing',
        contact_email: `test${Date.now()}@venue.com`,
        contact_phone: '555-0100',
      })
      .select()
      .single();

    if (venueError) throw venueError;
    testVenueId = venue.id;
  });

  afterEach(async () => {
    // Clean up created experiences
    if (createdExperienceIds.length > 0) {
      await supabase.from('experiences').delete().in('id', createdExperienceIds);
      createdExperienceIds.length = 0;
    }

    // Clean up test venue
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }
  });

  /**
   * Property 15: Experience Active Status Search Visibility
   * 
   * For any experience marked as inactive (active = false), it SHALL NOT appear 
   * in teacher search results, regardless of other matching criteria.
   * 
   * **Validates: Requirements 8.7**
   */
  it('Property 15: Inactive experiences are hidden from search results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          durationMinutes: fc.integer({ min: 15, max: 480 }),
          capacity: fc.integer({ min: 5, max: 200 }),
          active: fc.boolean(),
        }),
        async (experienceData) => {
          // Create experience with random active status
          const input: CreateExperienceInput = {
            venueId: testVenueId,
            title: experienceData.title,
            durationMinutes: experienceData.durationMinutes,
            capacity: experienceData.capacity,
            active: experienceData.active,
          };

          const experience = await service.createExperience(input);
          createdExperienceIds.push(experience.id);

          // Fetch venue experiences (default behavior excludes inactive)
          const activeExperiences = await service.getVenueExperiences(testVenueId, false);
          
          // Fetch all experiences including inactive
          const allExperiences = await service.getVenueExperiences(testVenueId, true);

          // Property: If experience is inactive, it should NOT appear in default search
          if (!experienceData.active) {
            const foundInActive = activeExperiences.some(exp => exp.id === experience.id);
            expect(foundInActive).toBe(false);
          } else {
            // If active, it SHOULD appear in search
            const foundInActive = activeExperiences.some(exp => exp.id === experience.id);
            expect(foundInActive).toBe(true);
          }

          // All experiences should always include both active and inactive
          const foundInAll = allExperiences.some(exp => exp.id === experience.id);
          expect(foundInAll).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 15: Marking experience inactive removes it from search
   * 
   * When an experience is marked inactive, it SHALL immediately be hidden 
   * from teacher search results.
   * 
   * **Validates: Requirements 8.7**
   */
  it('Property 15: Marking experience inactive removes it from search', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          durationMinutes: fc.integer({ min: 15, max: 480 }),
          capacity: fc.integer({ min: 5, max: 200 }),
        }),
        async (experienceData) => {
          // Create active experience
          const input: CreateExperienceInput = {
            venueId: testVenueId,
            title: experienceData.title,
            durationMinutes: experienceData.durationMinutes,
            capacity: experienceData.capacity,
            active: true,
          };

          const experience = await service.createExperience(input);
          createdExperienceIds.push(experience.id);

          // Verify it appears in search
          const beforeInactive = await service.getVenueExperiences(testVenueId, false);
          const foundBefore = beforeInactive.some(exp => exp.id === experience.id);
          expect(foundBefore).toBe(true);

          // Mark as inactive
          await service.setExperienceActive(experience.id, false);

          // Verify it no longer appears in search
          const afterInactive = await service.getVenueExperiences(testVenueId, false);
          const foundAfter = afterInactive.some(exp => exp.id === experience.id);
          expect(foundAfter).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 16: Experience Duplication Data Copy
   * 
   * For any experience that is duplicated, the new experience SHALL contain 
   * copies of all fields from the original experience except for the ID, 
   * which SHALL be unique.
   * 
   * **Validates: Requirements 8.8**
   */
  it('Property 16: Duplicated experience copies all data except ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          description: fc.string({ minLength: 10, maxLength: 500 }),
          durationMinutes: fc.integer({ min: 15, max: 480 }),
          capacity: fc.integer({ min: 5, max: 200 }),
          minStudents: fc.integer({ min: 1, max: 50 }),
          maxStudents: fc.integer({ min: 51, max: 200 }),
          recommendedAgeMin: fc.integer({ min: 5, max: 12 }),
          recommendedAgeMax: fc.integer({ min: 13, max: 18 }),
          gradeLevels: fc.array(fc.constantFrom('K', '1st', '2nd', '3rd', '4th', '5th'), { minLength: 1, maxLength: 3 }),
          subjects: fc.array(fc.constantFrom('Math', 'Science', 'History', 'Art'), { minLength: 1, maxLength: 3 }),
          educationalObjectives: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
        }),
        async (experienceData) => {
          // Create original experience with comprehensive data
          const input: CreateExperienceInput = {
            venueId: testVenueId,
            title: experienceData.title,
            description: experienceData.description,
            durationMinutes: experienceData.durationMinutes,
            capacity: experienceData.capacity,
            minStudents: experienceData.minStudents,
            maxStudents: experienceData.maxStudents,
            recommendedAgeMin: experienceData.recommendedAgeMin,
            recommendedAgeMax: experienceData.recommendedAgeMax,
            gradeLevels: experienceData.gradeLevels,
            subjects: experienceData.subjects,
            educationalObjectives: experienceData.educationalObjectives,
            pricingTiers: [
              {
                minStudents: 1,
                maxStudents: 20,
                priceCents: 1500,
                freeChaperones: 2,
              },
            ],
            cancellationPolicy: {
              fullRefundDays: 14,
              partialRefundDays: 7,
              partialRefundPercent: 50,
              noRefundAfterDays: 3,
            },
          };

          const original = await service.createExperience(input);
          createdExperienceIds.push(original.id);

          // Duplicate the experience
          const duplicate = await service.duplicateExperience(original.id);
          createdExperienceIds.push(duplicate.id);

          // Property: ID must be different
          expect(duplicate.id).not.toBe(original.id);

          // Property: All other fields should be copied
          expect(duplicate.venueId).toBe(original.venueId);
          expect(duplicate.description).toBe(original.description);
          expect(duplicate.durationMinutes).toBe(original.durationMinutes);
          expect(duplicate.capacity).toBe(original.capacity);
          expect(duplicate.minStudents).toBe(original.minStudents);
          expect(duplicate.maxStudents).toBe(original.maxStudents);
          expect(duplicate.recommendedAgeMin).toBe(original.recommendedAgeMin);
          expect(duplicate.recommendedAgeMax).toBe(original.recommendedAgeMax);
          expect(duplicate.gradeLevels).toEqual(original.gradeLevels);
          expect(duplicate.subjects).toEqual(original.subjects);
          expect(duplicate.educationalObjectives).toEqual(original.educationalObjectives);
          expect(duplicate.cancellationPolicy).toEqual(original.cancellationPolicy);

          // Pricing tiers should be copied
          expect(duplicate.pricingTiers).toHaveLength(original.pricingTiers?.length || 0);
          if (original.pricingTiers && duplicate.pricingTiers) {
            expect(duplicate.pricingTiers[0].priceCents).toBe(original.pricingTiers[0].priceCents);
            expect(duplicate.pricingTiers[0].minStudents).toBe(original.pricingTiers[0].minStudents);
            expect(duplicate.pricingTiers[0].maxStudents).toBe(original.pricingTiers[0].maxStudents);
          }

          // Duplicates should start as inactive and unpublished
          expect(duplicate.active).toBe(false);
          expect(duplicate.published).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 16: Duplicated experience with custom title
   * 
   * When duplicating with a custom title, all other fields should still be copied.
   * 
   * **Validates: Requirements 8.8**
   */
  it('Property 16: Duplicated experience with custom title preserves other data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          originalTitle: fc.string({ minLength: 5, maxLength: 100 }),
          newTitle: fc.string({ minLength: 5, maxLength: 100 }),
          durationMinutes: fc.integer({ min: 15, max: 480 }),
          capacity: fc.integer({ min: 5, max: 200 }),
        }),
        async (data) => {
          // Create original experience
          const input: CreateExperienceInput = {
            venueId: testVenueId,
            title: data.originalTitle,
            durationMinutes: data.durationMinutes,
            capacity: data.capacity,
          };

          const original = await service.createExperience(input);
          createdExperienceIds.push(original.id);

          // Duplicate with custom title
          const duplicate = await service.duplicateExperience(original.id, data.newTitle);
          createdExperienceIds.push(duplicate.id);

          // Property: Title should be the custom title
          expect(duplicate.title).toBe(data.newTitle);

          // Property: Other fields should still be copied
          expect(duplicate.durationMinutes).toBe(original.durationMinutes);
          expect(duplicate.capacity).toBe(original.capacity);
          expect(duplicate.venueId).toBe(original.venueId);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 17: Positive Pricing Validation
   * 
   * For any pricing tier or fee, if the amount is negative or zero 
   * (when required to be positive), the save operation SHALL be rejected.
   * 
   * **Validates: Requirements 8.9**
   */
  it('Property 17: Negative pricing values are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          durationMinutes: fc.integer({ min: 15, max: 480 }),
          capacity: fc.integer({ min: 5, max: 200 }),
          priceCents: fc.integer({ min: -10000, max: -1 }), // Negative prices
        }),
        async (data) => {
          const input: CreateExperienceInput = {
            venueId: testVenueId,
            title: data.title,
            durationMinutes: data.durationMinutes,
            capacity: data.capacity,
            pricingTiers: [
              {
                minStudents: 1,
                maxStudents: 20,
                priceCents: data.priceCents, // Negative price
                freeChaperones: 1,
              },
            ],
          };

          // Property: Creating experience with negative pricing should throw error
          await expect(service.createExperience(input)).rejects.toThrow(
            'Pricing values must be positive numbers'
          );
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 17: Positive pricing values are accepted
   * 
   * For any pricing tier with positive amounts, the save operation SHALL succeed.
   * 
   * **Validates: Requirements 8.9**
   */
  it('Property 17: Positive pricing values are accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          durationMinutes: fc.integer({ min: 15, max: 480 }),
          capacity: fc.integer({ min: 5, max: 200 }),
          priceCents: fc.integer({ min: 1, max: 100000 }), // Positive prices
        }),
        async (data) => {
          const input: CreateExperienceInput = {
            venueId: testVenueId,
            title: data.title,
            durationMinutes: data.durationMinutes,
            capacity: data.capacity,
            pricingTiers: [
              {
                minStudents: 1,
                maxStudents: 20,
                priceCents: data.priceCents, // Positive price
                freeChaperones: 1,
              },
            ],
          };

          // Property: Creating experience with positive pricing should succeed
          const experience = await service.createExperience(input);
          createdExperienceIds.push(experience.id);

          expect(experience.id).toBeDefined();
          expect(experience.pricingTiers).toHaveLength(1);
          expect(experience.pricingTiers![0].priceCents).toBe(data.priceCents);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 17: Negative additional fees are rejected
   * 
   * For any additional fee with negative amount, the save operation SHALL be rejected.
   * 
   * **Validates: Requirements 8.9**
   */
  it('Property 17: Negative additional fees are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          durationMinutes: fc.integer({ min: 15, max: 480 }),
          capacity: fc.integer({ min: 5, max: 200 }),
          feeAmount: fc.integer({ min: -5000, max: -1 }), // Negative fee
        }),
        async (data) => {
          const input: CreateExperienceInput = {
            venueId: testVenueId,
            title: data.title,
            durationMinutes: data.durationMinutes,
            capacity: data.capacity,
            pricingTiers: [
              {
                minStudents: 1,
                maxStudents: 20,
                priceCents: 1000, // Valid price
                freeChaperones: 1,
                additionalFees: [
                  {
                    name: 'Test Fee',
                    amountCents: data.feeAmount, // Negative fee
                    required: true,
                  },
                ],
              },
            ],
          };

          // Property: Creating experience with negative fee should throw error
          await expect(service.createExperience(input)).rejects.toThrow(
            'Additional fee amounts must be positive numbers'
          );
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 17: Pricing validation in update operations
   * 
   * Negative pricing values should also be rejected in update operations.
   * 
   * **Validates: Requirements 8.9**
   */
  it('Property 17: Negative pricing rejected in updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          durationMinutes: fc.integer({ min: 15, max: 480 }),
          capacity: fc.integer({ min: 5, max: 200 }),
          negativePriceCents: fc.integer({ min: -10000, max: -1 }),
        }),
        async (data) => {
          // Create experience with valid pricing
          const input: CreateExperienceInput = {
            venueId: testVenueId,
            title: data.title,
            durationMinutes: data.durationMinutes,
            capacity: data.capacity,
            pricingTiers: [
              {
                minStudents: 1,
                maxStudents: 20,
                priceCents: 1000,
                freeChaperones: 1,
              },
            ],
          };

          const experience = await service.createExperience(input);
          createdExperienceIds.push(experience.id);

          // Property: Updating with negative pricing should throw error
          await expect(
            service.updatePricingTiers(experience.id, [
              {
                minStudents: 1,
                maxStudents: 20,
                priceCents: data.negativePriceCents,
                freeChaperones: 1,
              },
            ])
          ).rejects.toThrow('Pricing values must be positive numbers');
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});
