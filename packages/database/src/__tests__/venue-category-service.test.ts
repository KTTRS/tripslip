/**
 * Unit tests for Venue Category Service
 * 
 * Tests category and tag management functionality including:
 * - Category CRUD operations
 * - Hierarchical category structure
 * - Category assignments to venues
 * - Tag CRUD operations
 * - Tag assignments to venues
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VenueCategoryService } from '../venue-category-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('VenueCategoryService', () => {
  let supabase: SupabaseClient;
  let service: VenueCategoryService;
  let testVenueId: string;
  let testCategoryIds: string[] = [];
  let testTagIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    service = new VenueCategoryService(supabase);

    // Create a test venue for assignment tests
    const { data: venue, error } = await supabase
      .from('venues')
      .insert({
        name: 'Test Venue for Categories',
        contact_email: 'test-categories@example.com',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
        },
      })
      .select()
      .single();

    if (error) throw error;
    testVenueId = venue.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }

    // Clean up test categories
    for (const id of testCategoryIds) {
      await supabase.from('venue_categories').delete().eq('id', id);
    }

    // Clean up test tags
    for (const id of testTagIds) {
      await supabase.from('venue_tags').delete().eq('id', id);
    }
  });

  describe('Category Management', () => {
    it('should create a top-level category', async () => {
      const category = await service.createCategory({
        name: 'Test Category ' + Date.now(),
        description: 'A test category',
        display_order: 100,
      });

      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toContain('Test Category');
      expect(category.parent_id).toBeNull();
      expect(category.description).toBe('A test category');
      expect(category.display_order).toBe(100);

      testCategoryIds.push(category.id);
    });

    it('should create a subcategory', async () => {
      const parent = await service.createCategory({
        name: 'Parent Category ' + Date.now(),
        description: 'Parent category',
      });
      testCategoryIds.push(parent.id);

      const child = await service.createCategory({
        name: 'Child Category ' + Date.now(),
        description: 'Child category',
        parent_id: parent.id,
      });
      testCategoryIds.push(child.id);

      expect(child.parent_id).toBe(parent.id);

      // Verify hierarchy
      const children = await service.getChildCategories(parent.id);
      expect(children.some((c) => c.id === child.id)).toBe(true);
    });

    it('should get category by ID', async () => {
      const created = await service.createCategory({
        name: 'Get By ID Test ' + Date.now(),
      });
      testCategoryIds.push(created.id);

      const retrieved = await service.getCategoryById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(created.name);
    });

    it('should get category by name', async () => {
      const uniqueName = 'Unique Category Name ' + Date.now();
      const created = await service.createCategory({
        name: uniqueName,
      });
      testCategoryIds.push(created.id);

      const retrieved = await service.getCategoryByName(uniqueName);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(uniqueName);
    });

    it('should update a category', async () => {
      const category = await service.createCategory({
        name: 'Update Test ' + Date.now(),
        description: 'Original description',
      });
      testCategoryIds.push(category.id);

      const updated = await service.updateCategory(category.id, {
        description: 'Updated description',
        display_order: 50,
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.display_order).toBe(50);
      expect(updated.name).toBe(category.name); // Name unchanged
    });

    it('should delete a category', async () => {
      const category = await service.createCategory({
        name: 'Delete Test ' + Date.now(),
      });

      await service.deleteCategory(category.id);

      const retrieved = await service.getCategoryById(category.id);
      expect(retrieved).toBeNull();
    });

    it('should get all categories', async () => {
      const categories = await service.getAllCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should get top-level categories', async () => {
      const topLevel = await service.getTopLevelCategories();
      expect(Array.isArray(topLevel)).toBe(true);
      expect(topLevel.every((cat) => cat.parent_id === null)).toBe(true);
    });

    it('should build category tree', async () => {
      const tree = await service.getCategoryTree();
      expect(Array.isArray(tree)).toBe(true);
      expect(tree.every((cat) => cat.parent_id === null)).toBe(true);
      expect(tree.some((cat) => cat.children.length > 0)).toBe(true);
    });

    it('should get category subtree', async () => {
      // Use an existing category with children (Museums)
      const museums = await service.getCategoryByName('Museums');
      if (!museums) {
        console.warn('Museums category not found, skipping subtree test');
        return;
      }

      const subtree = await service.getCategorySubtree(museums.id);
      expect(Array.isArray(subtree)).toBe(true);
      expect(subtree.length).toBeGreaterThan(0);
      expect(subtree[0].id).toBe(museums.id);
      expect(subtree[0].level).toBe(0);
    });

    it('should get category path', async () => {
      // Create parent and child for path test
      const parent = await service.createCategory({
        name: 'Path Parent ' + Date.now(),
      });
      testCategoryIds.push(parent.id);

      const child = await service.createCategory({
        name: 'Path Child ' + Date.now(),
        parent_id: parent.id,
      });
      testCategoryIds.push(child.id);

      const path = await service.getCategoryPath(child.id);
      expect(path).toContain(parent.name);
      expect(path).toContain(child.name);
      expect(path).toContain('>');
    });

    it('should search categories by name', async () => {
      const uniquePrefix = 'SearchTest' + Date.now();
      const cat1 = await service.createCategory({
        name: uniquePrefix + ' Alpha',
      });
      const cat2 = await service.createCategory({
        name: uniquePrefix + ' Beta',
      });
      testCategoryIds.push(cat1.id, cat2.id);

      const results = await service.searchCategories(uniquePrefix);
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((c) => c.id === cat1.id)).toBe(true);
      expect(results.some((c) => c.id === cat2.id)).toBe(true);
    });
  });

  describe('Category Assignments', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await service.createCategory({
        name: 'Assignment Test ' + Date.now(),
      });
      categoryId = category.id;
      testCategoryIds.push(categoryId);
    });

    it('should assign category to venue', async () => {
      const assignment = await service.assignCategoryToVenue(
        testVenueId,
        categoryId
      );

      expect(assignment).toBeDefined();
      expect(assignment.venue_id).toBe(testVenueId);
      expect(assignment.category_id).toBe(categoryId);
    });

    it('should get venue categories', async () => {
      await service.assignCategoryToVenue(testVenueId, categoryId);

      const categories = await service.getVenueCategories(testVenueId);
      expect(categories.some((c) => c.id === categoryId)).toBe(true);
    });

    it('should get venues in category', async () => {
      await service.assignCategoryToVenue(testVenueId, categoryId);

      const venueIds = await service.getVenuesInCategory(categoryId);
      expect(venueIds).toContain(testVenueId);
    });

    it('should remove category from venue', async () => {
      await service.assignCategoryToVenue(testVenueId, categoryId);
      await service.removeCategoryFromVenue(testVenueId, categoryId);

      const categories = await service.getVenueCategories(testVenueId);
      expect(categories.some((c) => c.id === categoryId)).toBe(false);
    });

    it('should set venue categories (replace all)', async () => {
      const cat1 = await service.createCategory({
        name: 'Set Test 1 ' + Date.now(),
      });
      const cat2 = await service.createCategory({
        name: 'Set Test 2 ' + Date.now(),
      });
      testCategoryIds.push(cat1.id, cat2.id);

      // Set initial categories
      await service.setVenueCategories(testVenueId, [cat1.id, cat2.id]);
      let categories = await service.getVenueCategories(testVenueId);
      expect(categories.length).toBeGreaterThanOrEqual(2);

      // Replace with new set
      await service.setVenueCategories(testVenueId, [categoryId]);
      categories = await service.getVenueCategories(testVenueId);
      expect(categories.some((c) => c.id === categoryId)).toBe(true);
      expect(categories.some((c) => c.id === cat1.id)).toBe(false);
    });

    it('should count venues in category', async () => {
      await service.assignCategoryToVenue(testVenueId, categoryId);

      const count = await service.countVenuesInCategory(categoryId);
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Tag Management', () => {
    it('should create a tag', async () => {
      const tag = await service.createTag({
        name: 'Test Tag ' + Date.now(),
        description: 'A test tag',
      });

      expect(tag).toBeDefined();
      expect(tag.id).toBeDefined();
      expect(tag.name).toContain('Test Tag');
      expect(tag.description).toBe('A test tag');

      testTagIds.push(tag.id);
    });

    it('should get tag by ID', async () => {
      const created = await service.createTag({
        name: 'Get Tag By ID ' + Date.now(),
      });
      testTagIds.push(created.id);

      const retrieved = await service.getTagById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(created.name);
    });

    it('should get tag by name', async () => {
      const uniqueName = 'Unique Tag Name ' + Date.now();
      const created = await service.createTag({
        name: uniqueName,
      });
      testTagIds.push(created.id);

      const retrieved = await service.getTagByName(uniqueName);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(uniqueName);
    });

    it('should update a tag', async () => {
      const tag = await service.createTag({
        name: 'Update Tag Test ' + Date.now(),
        description: 'Original description',
      });
      testTagIds.push(tag.id);

      const updated = await service.updateTag(tag.id, {
        description: 'Updated description',
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.name).toBe(tag.name);
    });

    it('should delete a tag', async () => {
      const tag = await service.createTag({
        name: 'Delete Tag Test ' + Date.now(),
      });

      await service.deleteTag(tag.id);

      const retrieved = await service.getTagById(tag.id);
      expect(retrieved).toBeNull();
    });

    it('should get all tags', async () => {
      const tags = await service.getAllTags();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should search tags by name', async () => {
      const uniquePrefix = 'TagSearch' + Date.now();
      const tag1 = await service.createTag({
        name: uniquePrefix + ' Alpha',
      });
      const tag2 = await service.createTag({
        name: uniquePrefix + ' Beta',
      });
      testTagIds.push(tag1.id, tag2.id);

      const results = await service.searchTags(uniquePrefix);
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((t) => t.id === tag1.id)).toBe(true);
      expect(results.some((t) => t.id === tag2.id)).toBe(true);
    });
  });

  describe('Tag Assignments', () => {
    let tagId: string;

    beforeEach(async () => {
      const tag = await service.createTag({
        name: 'Tag Assignment Test ' + Date.now(),
      });
      tagId = tag.id;
      testTagIds.push(tagId);
    });

    it('should assign tag to venue', async () => {
      const assignment = await service.assignTagToVenue(testVenueId, tagId);

      expect(assignment).toBeDefined();
      expect(assignment.venue_id).toBe(testVenueId);
      expect(assignment.tag_id).toBe(tagId);
    });

    it('should get venue tags', async () => {
      await service.assignTagToVenue(testVenueId, tagId);

      const tags = await service.getVenueTags(testVenueId);
      expect(tags.some((t) => t.id === tagId)).toBe(true);
    });

    it('should get venues with tag', async () => {
      await service.assignTagToVenue(testVenueId, tagId);

      const venueIds = await service.getVenuesWithTag(tagId);
      expect(venueIds).toContain(testVenueId);
    });

    it('should remove tag from venue', async () => {
      await service.assignTagToVenue(testVenueId, tagId);
      await service.removeTagFromVenue(testVenueId, tagId);

      const tags = await service.getVenueTags(testVenueId);
      expect(tags.some((t) => t.id === tagId)).toBe(false);
    });

    it('should set venue tags (replace all)', async () => {
      const tag1 = await service.createTag({
        name: 'Set Tag Test 1 ' + Date.now(),
      });
      const tag2 = await service.createTag({
        name: 'Set Tag Test 2 ' + Date.now(),
      });
      testTagIds.push(tag1.id, tag2.id);

      // Set initial tags
      await service.setVenueTags(testVenueId, [tag1.id, tag2.id]);
      let tags = await service.getVenueTags(testVenueId);
      expect(tags.length).toBeGreaterThanOrEqual(2);

      // Replace with new set
      await service.setVenueTags(testVenueId, [tagId]);
      tags = await service.getVenueTags(testVenueId);
      expect(tags.some((t) => t.id === tagId)).toBe(true);
      expect(tags.some((t) => t.id === tag1.id)).toBe(false);
    });
  });

  describe('Popular Categories and Tags', () => {
    it('should get popular categories', async () => {
      const popular = await service.getPopularCategories(5);
      expect(Array.isArray(popular)).toBe(true);
      expect(popular.length).toBeGreaterThan(0);
      expect(popular.length).toBeLessThanOrEqual(5);
    });

    it('should get popular tags', async () => {
      const popular = await service.getPopularTags(10);
      expect(Array.isArray(popular)).toBe(true);
      expect(popular.length).toBeGreaterThan(0);
      expect(popular.length).toBeLessThanOrEqual(10);
    });
  });
});
