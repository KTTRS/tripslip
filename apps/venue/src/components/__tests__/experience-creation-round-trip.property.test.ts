/**
 * Property-Based Tests - Experience Creation Round Trip (Task 6.2)
 * 
 * Tests Property 20: Experience Creation Round Trip
 * For any experience data, creating an experience then retrieving it should 
 * return equivalent data with all pricing tiers and availability preserved.
 * 
 * **Validates: Requirements 6.1**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use service role key for tests to bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Experience Creation Round Trip (Task 6.2)', () => {
  let supabase: SupabaseClient;
  let testVenueId: string;
  const testExperienceIds: string[] = [];
  const testPricingTierIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test venue (required for experiences)
    const { data: venue } = await supabase
      .from('venues')
      .insert({
        name: `Test Venue ${Date.now()}`,
        description: 'Test venue for experience tests',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
        contact_email: `test${Date.now()}@venue.com`,
        contact_phone: '555-0100',
      })
      .select()
      .single();

    testVenueId = venue!.id;
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    if (testPricingTierIds.length > 0) {
      await supabase.from('pricing_tiers').delete().in('id', testPricingTierIds);
      testPricingTierIds.length = 0;
    }
    if (testExperienceIds.length > 0) {
      await supabase.from('experiences').delete().in('id', testExperienceIds);
      testExperienceIds.length = 0;
    }

    // Clean up test infrastructure
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }
  });

  /**
   * Property 20: Experience Creation Round Trip
   * 
   * For any experience data (title, description, duration, capacity, pricing tiers),
   * creating an experience then retrieving it should return equivalent data with 
   * all fields preserved including pricing tiers.
   * 
   * This property ensures data consistency in the experience creation and retrieval flow.
   */
  it('Property 20: Experience creation round trip preserves all fields and pricing tiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate experience title
        fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
        // Generate description
        fc.string({ minLength: 20, maxLength: 500 }).filter(s => s.trim().length >= 20),
        // Generate optional Spanish description
        fc.option(fc.string({ minLength: 20, maxLength: 500 })),
        // Generate duration (15 minutes to 8 hours)
        fc.integer({ min: 15, max: 480 }),
        // Generate capacity
        fc.integer({ min: 1, max: 200 }),
        // Generate min/max students
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        // Generate grade levels (comma-separated string)
        fc.option(fc.array(fc.constantFrom('K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'), { minLength: 1, maxLength: 5 })),
        // Generate subjects (comma-separated string)
        fc.option(fc.array(fc.constantFrom('Science', 'Math', 'History', 'Art', 'Music', 'PE'), { minLength: 1, maxLength: 3 })),
        // Generate pricing tiers (1-3 tiers)
        fc.array(
          fc.record({
            min_students: fc.integer({ min: 1, max: 50 }),
            max_students: fc.integer({ min: 1, max: 50 }),
            price_cents: fc.integer({ min: 0, max: 100000 }),
            free_chaperones: fc.integer({ min: 0, max: 10 })
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (
          title,
          description,
          descriptionEs,
          durationMinutes,
          capacity,
          minStudentsRaw,
          maxStudentsRaw,
          gradeLevelsArray,
          subjectsArray,
          pricingTiers
        ) => {
          // Ensure min_students <= max_students
          const minStudents = Math.min(minStudentsRaw, maxStudentsRaw);
          const maxStudents = Math.max(minStudentsRaw, maxStudentsRaw);

          // Convert arrays to comma-separated strings
          const gradeLevels = gradeLevelsArray ? gradeLevelsArray.join(', ') : '';
          const subjects = subjectsArray ? subjectsArray.join(', ') : '';

          // Ensure pricing tiers have valid min <= max
          const validPricingTiers = pricingTiers.map(tier => ({
            ...tier,
            min_students: Math.min(tier.min_students, tier.max_students),
            max_students: Math.max(tier.min_students, tier.max_students)
          }));

          // Create experience record
          const { data: createdExperience, error: createError } = await supabase
            .from('experiences')
            .insert({
              venue_id: testVenueId,
              title: title.trim(),
              description: description.trim(),
              duration_minutes: durationMinutes,
              capacity: capacity,
              min_students: minStudents,
              max_students: maxStudents,
              grade_levels: gradeLevelsArray || [],
              subjects: subjectsArray || [],
              published: true,
              active: true
            })
            .select()
            .single();

          if (createError || !createdExperience) {
            throw new Error(`Failed to create experience: ${createError?.message}`);
          }
          testExperienceIds.push(createdExperience.id);

          // Create pricing tiers
          const createdTiers = [];
          for (const tier of validPricingTiers) {
            const { data: createdTier, error: tierError } = await supabase
              .from('pricing_tiers')
              .insert({
                experience_id: createdExperience.id,
                min_students: tier.min_students,
                max_students: tier.max_students,
                price_cents: tier.price_cents,
                free_chaperones: tier.free_chaperones
              })
              .select()
              .single();

            if (tierError || !createdTier) {
              throw new Error(`Failed to create pricing tier: ${tierError?.message}`);
            }
            testPricingTierIds.push(createdTier.id);
            createdTiers.push(createdTier);
          }

          // Retrieve the experience record
          const { data: retrievedExperience, error: retrieveError } = await supabase
            .from('experiences')
            .select('*')
            .eq('id', createdExperience.id)
            .single();

          if (retrieveError || !retrievedExperience) {
            throw new Error(`Failed to retrieve experience: ${retrieveError?.message}`);
          }

          // Retrieve pricing tiers
          const { data: retrievedTiers, error: tiersError } = await supabase
            .from('pricing_tiers')
            .select('*')
            .eq('experience_id', createdExperience.id)
            .order('min_students', { ascending: true });

          if (tiersError || !retrievedTiers) {
            throw new Error(`Failed to retrieve pricing tiers: ${tiersError?.message}`);
          }

          // Verify experience round-trip consistency
          expect(retrievedExperience.id).toBe(createdExperience.id);
          expect(retrievedExperience.venue_id).toBe(testVenueId);
          expect(retrievedExperience.title).toBe(title.trim());
          expect(retrievedExperience.description).toBe(description.trim());
          
          expect(retrievedExperience.duration_minutes).toBe(durationMinutes);
          expect(retrievedExperience.capacity).toBe(capacity);
          expect(retrievedExperience.min_students).toBe(minStudents);
          expect(retrievedExperience.max_students).toBe(maxStudents);
          expect(retrievedExperience.published).toBe(true);
          expect(retrievedExperience.active).toBe(true);

          // Verify grade levels and subjects arrays
          expect(retrievedExperience.grade_levels).toEqual(gradeLevelsArray || []);
          expect(retrievedExperience.subjects).toEqual(subjectsArray || []);

          // Verify timestamps exist
          expect(retrievedExperience.created_at).toBeTruthy();
          expect(retrievedExperience.updated_at).toBeTruthy();

          // Verify pricing tiers count
          expect(retrievedTiers.length).toBe(validPricingTiers.length);

          // Verify each pricing tier
          for (let i = 0; i < validPricingTiers.length; i++) {
            const expectedTier = validPricingTiers[i];
            const actualTier = retrievedTiers.find(
              t => t.min_students === expectedTier.min_students && 
                   t.max_students === expectedTier.max_students
            );

            expect(actualTier).toBeTruthy();
            expect(actualTier!.price_cents).toBe(expectedTier.price_cents);
            expect(actualTier!.free_chaperones).toBe(expectedTier.free_chaperones);
            expect(actualTier!.experience_id).toBe(createdExperience.id);
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for database operations
    );
  }, 120000); // 2 minute timeout for database operations

  /**
   * Property 20 (Edge Case): Duration must be at least 15 minutes
   * 
   * Per the form validation, experiences must have a duration of at least 15 minutes.
   */
  it('Property 20 (Edge Case): Accepts experiences with minimum 15 minute duration', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate durations at minimum threshold
        fc.constantFrom(15, 30, 45, 60),
        async (duration) => {
          const { data: experience, error } = await supabase
            .from('experiences')
            .insert({
              venue_id: testVenueId,
              title: 'Test Experience',
              description: 'Test description for minimum duration',
              duration_minutes: duration,
              capacity: 30,
              min_students: 10,
              max_students: 30,
              published: true,
              active: true
            })
            .select()
            .single();

          // Should succeed
          expect(error).toBeNull();
          expect(experience).toBeTruthy();
          expect(experience?.duration_minutes).toBe(duration);

          if (experience) {
            testExperienceIds.push(experience.id);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 20 (Edge Case): Capacity must be positive
   * 
   * Experiences should have a capacity of at least 1 student.
   * Note: If database doesn't enforce this, the test validates current behavior.
   */
  it('Property 20 (Edge Case): Accepts positive capacity values', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid positive capacities
        fc.integer({ min: 1, max: 200 }),
        async (validCapacity) => {
          const { data: experience, error } = await supabase
            .from('experiences')
            .insert({
              venue_id: testVenueId,
              title: 'Test Experience',
              description: 'Test description for capacity validation',
              duration_minutes: 60,
              capacity: validCapacity,
              min_students: 10,
              max_students: 30,
              published: true,
              active: true
            })
            .select()
            .single();

          // Should succeed with positive capacity
          expect(error).toBeNull();
          expect(experience).toBeTruthy();
          expect(experience?.capacity).toBe(validCapacity);

          if (experience) {
            testExperienceIds.push(experience.id);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 20 (Edge Case): Pricing tier constraints
   * 
   * Pricing tiers must have min_students <= max_students and price_cents >= 0.
   */
  it('Property 20 (Edge Case): Rejects pricing tiers with invalid constraints', async () => {
    // First create a valid experience
    const { data: experience } = await supabase
      .from('experiences')
      .insert({
        venue_id: testVenueId,
        title: 'Test Experience',
        description: 'Test description for pricing tier validation',
        duration_minutes: 60,
        capacity: 30,
        min_students: 10,
        max_students: 30,
        published: true,
        active: true
      })
      .select()
      .single();

    if (!experience) throw new Error('Failed to create test experience');
    testExperienceIds.push(experience.id);

    await fc.assert(
      fc.asyncProperty(
        // Generate invalid pricing tiers (min > max)
        fc.integer({ min: 20, max: 50 }),
        fc.integer({ min: 1, max: 19 }),
        async (minStudents, maxStudents) => {
          const { error } = await supabase
            .from('pricing_tiers')
            .insert({
              experience_id: experience.id,
              min_students: minStudents,
              max_students: maxStudents,
              price_cents: 1000,
              free_chaperones: 2
            });

          // Should fail due to CHECK constraint
          expect(error).toBeTruthy();
          expect(error?.message).toMatch(/check constraint|violates check/i);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 20 (Edge Case): Negative pricing is rejected
   * 
   * Pricing tiers must have non-negative price_cents.
   */
  it('Property 20 (Edge Case): Rejects negative pricing', async () => {
    // First create a valid experience
    const { data: experience } = await supabase
      .from('experiences')
      .insert({
        venue_id: testVenueId,
        title: 'Test Experience',
        description: 'Test description for negative pricing validation',
        duration_minutes: 60,
        capacity: 30,
        min_students: 10,
        max_students: 30,
        published: true,
        active: true
      })
      .select()
      .single();

    if (!experience) throw new Error('Failed to create test experience');
    testExperienceIds.push(experience.id);

    await fc.assert(
      fc.asyncProperty(
        // Generate negative prices
        fc.integer({ min: -10000, max: -1 }),
        async (negativePrice) => {
          const { error } = await supabase
            .from('pricing_tiers')
            .insert({
              experience_id: experience.id,
              min_students: 10,
              max_students: 30,
              price_cents: negativePrice,
              free_chaperones: 2
            });

          // Should fail due to CHECK constraint
          expect(error).toBeTruthy();
          expect(error?.message).toMatch(/check constraint|violates check/i);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 20 (Consistency): Multiple retrievals return identical data
   * 
   * Retrieving the same experience record multiple times should always
   * return identical data, demonstrating read consistency.
   */
  it('Property 20 (Consistency): Multiple retrievals return identical experience data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
        fc.integer({ min: 15, max: 480 }),
        fc.integer({ min: 1, max: 200 }),
        async (title, duration, capacity) => {
          // Create experience
          const { data: experience } = await supabase
            .from('experiences')
            .insert({
              venue_id: testVenueId,
              title: title.trim(),
              description: 'Test description for consistency check',
              duration_minutes: duration,
              capacity: capacity,
              min_students: 10,
              max_students: 30,
              published: true,
              active: true
            })
            .select()
            .single();

          if (!experience) throw new Error('Failed to create experience');
          testExperienceIds.push(experience.id);

          // Retrieve experience multiple times
          const { data: retrieval1 } = await supabase
            .from('experiences')
            .select('*')
            .eq('id', experience.id)
            .single();

          const { data: retrieval2 } = await supabase
            .from('experiences')
            .select('*')
            .eq('id', experience.id)
            .single();

          const { data: retrieval3 } = await supabase
            .from('experiences')
            .select('*')
            .eq('id', experience.id)
            .single();

          // All retrievals should return identical data
          expect(retrieval1).toEqual(retrieval2);
          expect(retrieval2).toEqual(retrieval3);
          expect(retrieval1?.title).toBe(title.trim());
          expect(retrieval1?.duration_minutes).toBe(duration);
          expect(retrieval1?.capacity).toBe(capacity);
          expect(retrieval1?.venue_id).toBe(testVenueId);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  /**
   * Property 20 (Completeness): All pricing tiers are preserved
   * 
   * When creating an experience with multiple pricing tiers, all tiers
   * should be retrievable and match the original data.
   */
  it('Property 20 (Completeness): All pricing tiers are preserved and retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 2-5 pricing tiers with distinct ranges
        fc.integer({ min: 2, max: 5 }),
        async (tierCount) => {
          // Create experience
          const { data: experience } = await supabase
            .from('experiences')
            .insert({
              venue_id: testVenueId,
              title: 'Multi-tier Experience',
              description: 'Test experience with multiple pricing tiers',
              duration_minutes: 120,
              capacity: 100,
              min_students: 10,
              max_students: 100,
              published: true,
              active: true
            })
            .select()
            .single();

          if (!experience) throw new Error('Failed to create experience');
          testExperienceIds.push(experience.id);

          // Create distinct pricing tiers
          const tiers = [];
          for (let i = 0; i < tierCount; i++) {
            const minStudents = 10 + (i * 20);
            const maxStudents = minStudents + 19;
            const priceCents = 1000 + (i * 500);

            const { data: tier } = await supabase
              .from('pricing_tiers')
              .insert({
                experience_id: experience.id,
                min_students: minStudents,
                max_students: maxStudents,
                price_cents: priceCents,
                free_chaperones: 2
              })
              .select()
              .single();

            if (!tier) throw new Error('Failed to create pricing tier');
            testPricingTierIds.push(tier.id);
            tiers.push({ minStudents, maxStudents, priceCents });
          }

          // Retrieve all pricing tiers
          const { data: retrievedTiers } = await supabase
            .from('pricing_tiers')
            .select('*')
            .eq('experience_id', experience.id)
            .order('min_students', { ascending: true });

          // Verify all tiers are present
          expect(retrievedTiers?.length).toBe(tierCount);

          // Verify each tier matches
          for (let i = 0; i < tierCount; i++) {
            expect(retrievedTiers![i].min_students).toBe(tiers[i].minStudents);
            expect(retrievedTiers![i].max_students).toBe(tiers[i].maxStudents);
            expect(retrievedTiers![i].price_cents).toBe(tiers[i].priceCents);
            expect(retrievedTiers![i].free_chaperones).toBe(2);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);
});
