/**
 * Venue Category and Tag Management Service
 * 
 * Provides functionality for managing venue categories (hierarchical)
 * and tags (flat) for the venue discovery system.
 * 
 * Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8, 28.9
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// Types and Interfaces
// =====================================================

export interface VenueCategory {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface VenueCategoryWithChildren extends VenueCategory {
  children: VenueCategoryWithChildren[];
  venue_count?: number;
}

export interface VenueCategoryPath {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
}

export interface VenueTag {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface VenueCategoryAssignment {
  venue_id: string;
  category_id: string;
  assigned_at: string;
}

export interface VenueTagAssignment {
  venue_id: string;
  tag_id: string;
  assigned_at: string;
}

export interface CreateCategoryInput {
  name: string;
  parent_id?: string | null;
  description?: string | null;
  display_order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  parent_id?: string | null;
  description?: string | null;
  display_order?: number;
}

export interface CreateTagInput {
  name: string;
  description?: string | null;
}

export interface UpdateTagInput {
  name?: string;
  description?: string | null;
}

// =====================================================
// Venue Category Service
// =====================================================

export class VenueCategoryService {
  constructor(private supabase: SupabaseClient) {}

  // =====================================================
  // Category Management
  // =====================================================

  /**
   * Get all categories (flat list)
   */
  async getAllCategories(): Promise<VenueCategory[]> {
    const { data, error } = await this.supabase
      .from('venue_categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(): Promise<VenueCategoryWithChildren[]> {
    const categories = await this.getAllCategories();
    return this.buildCategoryTree(categories);
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(categoryId: string): Promise<VenueCategory | null> {
    const { data, error } = await this.supabase
      .from('venue_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Get category by name
   */
  async getCategoryByName(name: string): Promise<VenueCategory | null> {
    const { data, error } = await this.supabase
      .from('venue_categories')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Get all subcategories of a category (recursive)
   */
  async getCategorySubtree(categoryId: string): Promise<VenueCategoryPath[]> {
    const { data, error } = await this.supabase
      .rpc('get_category_tree', { category_id: categoryId });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(categoryId: string): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('get_category_path', { category_id: categoryId });

    if (error) throw error;
    return data || '';
  }

  /**
   * Count venues in a category (including subcategories)
   */
  async countVenuesInCategory(categoryId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('count_venues_in_category', { category_id: categoryId });

    if (error) throw error;
    return data || 0;
  }

  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<VenueCategory> {
    const { data, error } = await this.supabase
      .from('venue_categories')
      .insert({
        name: input.name,
        parent_id: input.parent_id || null,
        description: input.description || null,
        display_order: input.display_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a category
   */
  async updateCategory(
    categoryId: string,
    input: UpdateCategoryInput
  ): Promise<VenueCategory> {
    const { data, error } = await this.supabase
      .from('venue_categories')
      .update(input)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a category (cascades to subcategories and assignments)
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await this.supabase
      .from('venue_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  }

  /**
   * Get top-level categories (no parent)
   */
  async getTopLevelCategories(): Promise<VenueCategory[]> {
    const { data, error } = await this.supabase
      .from('venue_categories')
      .select('*')
      .is('parent_id', null)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get child categories of a parent
   */
  async getChildCategories(parentId: string): Promise<VenueCategory[]> {
    const { data, error } = await this.supabase
      .from('venue_categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // Category Assignment Management
  // =====================================================

  /**
   * Assign a category to a venue
   */
  async assignCategoryToVenue(
    venueId: string,
    categoryId: string
  ): Promise<VenueCategoryAssignment> {
    // Check if category is already assigned
    const { data: existing } = await this.supabase
      .from('venue_category_assignments')
      .select('*')
      .eq('venue_id', venueId)
      .eq('category_id', categoryId)
      .single();

    if (existing) {
      throw new Error('Category is already assigned to this venue');
    }

    const { data, error } = await this.supabase
      .from('venue_category_assignments')
      .insert({
        venue_id: venueId,
        category_id: categoryId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove a category from a venue
   */
  async removeCategoryFromVenue(
    venueId: string,
    categoryId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('venue_category_assignments')
      .delete()
      .eq('venue_id', venueId)
      .eq('category_id', categoryId);

    if (error) throw error;
  }

  /**
   * Get all categories assigned to a venue
   */
  async getVenueCategories(venueId: string): Promise<VenueCategory[]> {
    const { data, error } = await this.supabase
      .from('venue_category_assignments')
      .select('category_id, venue_categories(*)')
      .eq('venue_id', venueId);

    if (error) throw error;
    return (data || []).map((item: any) => item.venue_categories);
  }

  /**
   * Get all venues in a category
   */
  async getVenuesInCategory(categoryId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('venue_category_assignments')
      .select('venue_id')
      .eq('category_id', categoryId);

    if (error) throw error;
    return (data || []).map((item) => item.venue_id);
  }

  /**
   * Set all categories for a venue (replaces existing)
   */
  async setVenueCategories(
    venueId: string,
    categoryIds: string[]
  ): Promise<void> {
    // Remove existing assignments
    await this.supabase
      .from('venue_category_assignments')
      .delete()
      .eq('venue_id', venueId);

    // Add new assignments
    if (categoryIds.length > 0) {
      const { error } = await this.supabase
        .from('venue_category_assignments')
        .insert(
          categoryIds.map((categoryId) => ({
            venue_id: venueId,
            category_id: categoryId,
          }))
        );

      if (error) throw error;
    }
  }

  // =====================================================
  // Tag Management
  // =====================================================

  /**
   * Get all tags
   */
  async getAllTags(): Promise<VenueTag[]> {
    const { data, error } = await this.supabase
      .from('venue_tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single tag by ID
   */
  async getTagById(tagId: string): Promise<VenueTag | null> {
    const { data, error } = await this.supabase
      .from('venue_tags')
      .select('*')
      .eq('id', tagId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Get tag by name
   */
  async getTagByName(name: string): Promise<VenueTag | null> {
    const { data, error } = await this.supabase
      .from('venue_tags')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Create a new tag
   */
  async createTag(input: CreateTagInput): Promise<VenueTag> {
    const { data, error } = await this.supabase
      .from('venue_tags')
      .insert({
        name: input.name,
        description: input.description || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a tag
   */
  async updateTag(tagId: string, input: UpdateTagInput): Promise<VenueTag> {
    const { data, error } = await this.supabase
      .from('venue_tags')
      .update(input)
      .eq('id', tagId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a tag (cascades to assignments)
   */
  async deleteTag(tagId: string): Promise<void> {
    const { error } = await this.supabase
      .from('venue_tags')
      .delete()
      .eq('id', tagId);

    if (error) throw error;
  }

  // =====================================================
  // Tag Assignment Management
  // =====================================================

  /**
   * Assign a tag to a venue
   */
  async assignTagToVenue(
    venueId: string,
    tagId: string
  ): Promise<VenueTagAssignment> {
    const { data, error } = await this.supabase
      .from('venue_tag_assignments')
      .insert({
        venue_id: venueId,
        tag_id: tagId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove a tag from a venue
   */
  async removeTagFromVenue(venueId: string, tagId: string): Promise<void> {
    const { error } = await this.supabase
      .from('venue_tag_assignments')
      .delete()
      .eq('venue_id', venueId)
      .eq('tag_id', tagId);

    if (error) throw error;
  }

  /**
   * Get all tags assigned to a venue
   */
  async getVenueTags(venueId: string): Promise<VenueTag[]> {
    const { data, error } = await this.supabase
      .from('venue_tag_assignments')
      .select('tag_id, venue_tags(*)')
      .eq('venue_id', venueId);

    if (error) throw error;
    return (data || []).map((item: any) => item.venue_tags);
  }

  /**
   * Get all venues with a tag
   */
  async getVenuesWithTag(tagId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('venue_tag_assignments')
      .select('venue_id')
      .eq('tag_id', tagId);

    if (error) throw error;
    return (data || []).map((item) => item.venue_id);
  }

  /**
   * Set all tags for a venue (replaces existing)
   */
  async setVenueTags(venueId: string, tagIds: string[]): Promise<void> {
    // Remove existing assignments
    await this.supabase
      .from('venue_tag_assignments')
      .delete()
      .eq('venue_id', venueId);

    // Add new assignments
    if (tagIds.length > 0) {
      const { error } = await this.supabase
        .from('venue_tag_assignments')
        .insert(
          tagIds.map((tagId) => ({
            venue_id: venueId,
            tag_id: tagId,
          }))
        );

      if (error) throw error;
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Build hierarchical category tree from flat list
   */
  private buildCategoryTree(
    categories: VenueCategory[],
    parentId: string | null = null
  ): VenueCategoryWithChildren[] {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .map((cat) => ({
        ...cat,
        children: this.buildCategoryTree(categories, cat.id),
      }))
      .sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Search categories by name (fuzzy)
   */
  async searchCategories(query: string): Promise<VenueCategory[]> {
    const { data, error } = await this.supabase
      .from('venue_categories')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  /**
   * Search tags by name (fuzzy)
   */
  async searchTags(query: string): Promise<VenueTag[]> {
    const { data, error } = await this.supabase
      .from('venue_tags')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get popular categories (by venue count)
   */
  async getPopularCategories(limit: number = 10): Promise<Array<VenueCategory & { venue_count: number }>> {
    // Get all categories with their assignment counts
    const { data: categories, error: catError } = await this.supabase
      .from('venue_categories')
      .select('*');

    if (catError) throw catError;

    // Get assignment counts for each category
    const { data: assignments, error: assignError } = await this.supabase
      .from('venue_category_assignments')
      .select('category_id');

    if (assignError) throw assignError;

    // Count assignments per category
    const countMap = new Map<string, number>();
    (assignments || []).forEach((assignment) => {
      const count = countMap.get(assignment.category_id) || 0;
      countMap.set(assignment.category_id, count + 1);
    });

    // Combine and sort
    const result = (categories || [])
      .map((cat) => ({
        ...cat,
        venue_count: countMap.get(cat.id) || 0,
      }))
      .sort((a, b) => b.venue_count - a.venue_count)
      .slice(0, limit);

    return result;
  }

  /**
   * Get popular tags (by venue count)
   */
  async getPopularTags(limit: number = 20): Promise<Array<VenueTag & { venue_count: number }>> {
    // Get all tags
    const { data: tags, error: tagError } = await this.supabase
      .from('venue_tags')
      .select('*');

    if (tagError) throw tagError;

    // Get assignment counts for each tag
    const { data: assignments, error: assignError } = await this.supabase
      .from('venue_tag_assignments')
      .select('tag_id');

    if (assignError) throw assignError;

    // Count assignments per tag
    const countMap = new Map<string, number>();
    (assignments || []).forEach((assignment) => {
      const count = countMap.get(assignment.tag_id) || 0;
      countMap.set(assignment.tag_id, count + 1);
    });

    // Combine and sort
    const result = (tags || [])
      .map((tag) => ({
        ...tag,
        venue_count: countMap.get(tag.id) || 0,
      }))
      .sort((a, b) => b.venue_count - a.venue_count)
      .slice(0, limit);

    return result;
  }
}

// =====================================================
// Factory Function
// =====================================================

export function createVenueCategoryService(
  supabase: SupabaseClient
): VenueCategoryService {
  return new VenueCategoryService(supabase);
}
