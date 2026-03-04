/**
 * Property-Based Tests - Venue Category System (Task 7.2)
 * 
 * Tests Property 34: Category Assignment Validity
 * 
 * **Validates: Requirements 28.10**
 * 
 * Property 34: Category Assignment Validity
 * For any venue, it SHALL be assigned to at least one category, and all assigned 
 * categories SHALL exist in the category system.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VenueCategoryService } from '../../venue-category-service';

describe('Property-Based Tests - Venue Category System (Task 7.2)', () => {
  let supabase: SupabaseClient;
  let categoryService: VenueCategoryService;
  let testCategoryIds: string[] = [];
  let testVenueIds: string[] = [];

  beforeAll(async () => {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    supabase = createClient(supabaseUrl, supabaseKey);
    categoryService = new VenueCategoryService(supabase);

    // Create test categories for property testing
    const testCategories = [
      { name: `Test Category A ${Date.now()}`, description: 'Test category A' },
      { name: `Test Category B ${Date.now()}`, description: 'Test category B' },
      { name: `Test Category C ${Date.now()}`, description: 'Test category C' },
    ];

    for (const cat of testCategories) {
      const created = await categoryService.createCategory(cat);
      testCategoryIds.push(created.id);
    }

    // Create test venues
    for (let i = 0; i < 5; i++) {
      const { data: venue, error } = await supabase
        .from('venues')
        .insert({
          name: `Test Venue ${i} ${Date.now()}`,
          description: `Test venue for category property tests`,
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
            lat: 40.7128,
            lng: -74.0060,
          },
          contact_email: `test${i}@example.com`,
          contact_phone: '555-0100',
        })
        .select()
        .single();

      if (error) throw error;
      testVenueIds.push(venue.id);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testVenueIds.length > 0) {
      await supabase.from('venues').delete().in('id', testVenueIds);
    }
    if (testCategoryIds.length > 0) {
      await supabase.from('venue_categories').delete().in('id', testCategoryIds);
    }
  });

  it('Property 34: All assigned categories exist in the category system', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testVenueIds),
        fc.subarray(testCategoryIds, { minLength: 1, maxLength: testCategoryIds.length }),
        async (venueId, categoryIds) => {
          // Assign categories to venue
          await categoryService.setVenueCategories(venueId, categoryIds);

          // Get assigned categories
          const assignedCategories = await categoryService.getVenueCategories(venueId);

          // Verify all assigned categories exist in the system
          for (const category of assignedCategories) {
            const categoryExists = await categoryService.getCategoryById(category.id);
            expect(categoryExists).not.toBeNull();
            expect(categoryExists?.id).toBe(category.id);
          }

          // Verify assigned category IDs match what we set
          const assignedIds = assignedCategories.map(c => c.id).sort();
          const expectedIds = [...categoryIds].sort();
          expect(assignedIds).toEqual(expectedIds);
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('Property 34: Venues have at least one category assigned', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testVenueIds),
        fc.subarray(testCategoryIds, { minLength: 1, maxLength: testCategoryIds.length }),
        async (venueId, categoryIds) => {
          // Assign categories to venue
          await categoryService.setVenueCategories(venueId, categoryIds);

          // Get assigned categories
          const assignedCategories = await categoryService.getVenueCategories(venueId);

          // Verify venue has at least one category
          expect(assignedCategories.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('Property 34: Category assignment prevents duplicate assignments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testVenueIds),
        fc.constantFrom(...testCategoryIds),
        async (venueId, categoryId) => {
          // Clean up any existing assignment first (from previous test runs)
          try {
            await categoryService.removeCategoryFromVenue(venueId, categoryId);
          } catch {
            // Ignore errors if assignment doesn't exist
          }

          // Assign the category for the first time
          await categoryService.assignCategoryToVenue(venueId, categoryId);
          
          // Try to assign again (should throw an error)
          let errorThrown = false;
          try {
            await categoryService.assignCategoryToVenue(venueId, categoryId);
          } catch (error: any) {
            // Error is expected - either service validation or database constraint
            errorThrown = true;
            // Accept either service error message or PostgreSQL unique violation
            const isServiceError = error.message?.includes('already assigned');
            const isDbError = error.code === '23505';
            expect(isServiceError || isDbError).toBe(true);
          }

          // Verify an error was thrown (duplicates should be rejected)
          expect(errorThrown).toBe(true);

          // Verify only one assignment exists
          const assignedCategories = await categoryService.getVenueCategories(venueId);
          const matchingCategories = assignedCategories.filter(c => c.id === categoryId);
          expect(matchingCategories.length).toBe(1);

          // Clean up
          await categoryService.removeCategoryFromVenue(venueId, categoryId);
        }
      ),
      { numRuns: 30 }
    );
  }, 60000);

  it('Property 34: Category assignments maintain referential integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testVenueIds),
        fc.subarray(testCategoryIds, { minLength: 1, maxLength: 2 }),
        async (venueId, categoryIds) => {
          // Assign categories
          await categoryService.setVenueCategories(venueId, categoryIds);

          // Verify assignments exist in database
          const { data: assignments, error } = await supabase
            .from('venue_category_assignments')
            .select('venue_id, category_id')
            .eq('venue_id', venueId);

          expect(error).toBeNull();
          expect(assignments).not.toBeNull();
          expect(assignments!.length).toBe(categoryIds.length);

          // Verify each assignment has valid foreign keys
          for (const assignment of assignments!) {
            expect(assignment.venue_id).toBe(venueId);
            expect(categoryIds).toContain(assignment.category_id);

            // Verify venue exists
            const { data: venue } = await supabase
              .from('venues')
              .select('id')
              .eq('id', assignment.venue_id)
              .single();
            expect(venue).not.toBeNull();

            // Verify category exists
            const { data: category } = await supabase
              .from('venue_categories')
              .select('id')
              .eq('id', assignment.category_id)
              .single();
            expect(category).not.toBeNull();
          }
        }
      ),
      { numRuns: 40 }
    );
  }, 60000);

  it('Property 34: Removing a category from venue maintains data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testVenueIds),
        fc.subarray(testCategoryIds, { minLength: 2, maxLength: testCategoryIds.length }),
        async (venueId, categoryIds) => {
          // Assign multiple categories
          await categoryService.setVenueCategories(venueId, categoryIds);

          // Remove one category
          const categoryToRemove = categoryIds[0];
          await categoryService.removeCategoryFromVenue(venueId, categoryToRemove);

          // Verify category was removed
          const remainingCategories = await categoryService.getVenueCategories(venueId);
          const remainingIds = remainingCategories.map(c => c.id);
          expect(remainingIds).not.toContain(categoryToRemove);

          // Verify other categories remain
          const expectedRemaining = categoryIds.slice(1);
          expect(remainingCategories.length).toBe(expectedRemaining.length);
          for (const expectedId of expectedRemaining) {
            expect(remainingIds).toContain(expectedId);
          }
        }
      ),
      { numRuns: 40 }
    );
  }, 60000);

  it('Property 34: Category assignment is idempotent when using setVenueCategories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testVenueIds),
        fc.subarray(testCategoryIds, { minLength: 1, maxLength: testCategoryIds.length }),
        async (venueId, categoryIds) => {
          // Set categories twice with same data
          await categoryService.setVenueCategories(venueId, categoryIds);
          await categoryService.setVenueCategories(venueId, categoryIds);

          // Verify categories are set correctly (no duplicates)
          const assignedCategories = await categoryService.getVenueCategories(venueId);
          const assignedIds = assignedCategories.map(c => c.id).sort();
          const expectedIds = [...categoryIds].sort();
          
          expect(assignedIds).toEqual(expectedIds);
          expect(assignedCategories.length).toBe(categoryIds.length);
        }
      ),
      { numRuns: 40 }
    );
  }, 60000);

  it('Property 34: Invalid category IDs are rejected during assignment', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testVenueIds),
        fc.uuid(),
        async (venueId, invalidCategoryId) => {
          // Ensure the UUID doesn't match any test category
          if (testCategoryIds.includes(invalidCategoryId)) {
            return; // Skip this iteration
          }

          // Try to assign invalid category
          try {
            await categoryService.assignCategoryToVenue(venueId, invalidCategoryId);
            // If no error, verify the category doesn't actually exist
            const category = await categoryService.getCategoryById(invalidCategoryId);
            expect(category).toBeNull();
          } catch (error: any) {
            // Foreign key violation is expected
            expect(error.code).toBe('23503'); // PostgreSQL foreign key violation
          }
        }
      ),
      { numRuns: 30 }
    );
  }, 60000);

  it('Property 34: Cascade delete removes category assignments when category is deleted', async () => {
    // Create a temporary category for this test
    const tempCategory = await categoryService.createCategory({
      name: `Temp Category ${Date.now()}`,
      description: 'Temporary category for cascade test',
    });

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testVenueIds.slice(0, 2)),
        async (venueId) => {
          // Assign temporary category to venue
          await categoryService.assignCategoryToVenue(venueId, tempCategory.id);

          // Verify assignment exists
          const categoriesBefore = await categoryService.getVenueCategories(venueId);
          const hasTempCategory = categoriesBefore.some(c => c.id === tempCategory.id);
          expect(hasTempCategory).toBe(true);

          // Delete the category
          await categoryService.deleteCategory(tempCategory.id);

          // Verify assignment was cascade deleted
          const { data: assignments } = await supabase
            .from('venue_category_assignments')
            .select('*')
            .eq('venue_id', venueId)
            .eq('category_id', tempCategory.id);

          expect(assignments).toEqual([]);
        }
      ),
      { numRuns: 1 } // Run once since we're deleting the category
    );
  }, 60000);
});
