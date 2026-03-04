/**
 * Experience Management Service
 * 
 * Provides CRUD operations for venue experiences with support for:
 * - Educational objectives and curriculum standards
 * - Pricing tiers with additional fees
 * - Cancellation policies
 * - Experience duplication
 * - Active/inactive status management
 * 
 * Requirements: 2.1-2.8, 8.1-8.10
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface CurriculumStandard {
  framework: string; // e.g., "Common Core", "NGSS", "State Standards"
  code: string; // e.g., "CCSS.MATH.CONTENT.5.NBT.A.1"
  description: string;
}

export interface PricingTier {
  id?: string;
  experienceId?: string;
  minStudents: number;
  maxStudents: number;
  priceCents: number;
  freeChaperones: number;
  additionalFees?: AdditionalFee[];
}

export interface AdditionalFee {
  name: string;
  amountCents: number;
  required: boolean;
}

export interface CancellationPolicy {
  fullRefundDays: number; // Days before trip for full refund
  partialRefundDays: number; // Days before trip for partial refund
  partialRefundPercent: number; // Percentage refunded (0-100)
  noRefundAfterDays: number; // Days before trip when no refund is available
}

export interface Experience {
  id: string;
  venueId: string;
  title: string;
  description: string | null;
  educationalObjectives: string[];
  
  // Logistics
  durationMinutes: number;
  capacity: number;
  minStudents: number | null;
  maxStudents: number | null;
  recommendedAgeMin: number | null;
  recommendedAgeMax: number | null;
  gradeLevels: string[];
  
  // Educational alignment
  subjects: string[];
  curriculumStandards: CurriculumStandard[];
  
  // Pricing
  pricingTiers?: PricingTier[];
  cancellationPolicy: CancellationPolicy;
  
  // Requirements
  specialRequirements: string | null;
  
  // Status
  active: boolean;
  published: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateExperienceInput {
  venueId: string;
  title: string;
  description?: string;
  educationalObjectives?: string[];
  durationMinutes: number;
  capacity: number;
  minStudents?: number;
  maxStudents?: number;
  recommendedAgeMin?: number;
  recommendedAgeMax?: number;
  gradeLevels?: string[];
  subjects?: string[];
  curriculumStandards?: CurriculumStandard[];
  pricingTiers?: Omit<PricingTier, 'id' | 'experienceId'>[];
  cancellationPolicy?: CancellationPolicy;
  specialRequirements?: string;
  active?: boolean;
  published?: boolean;
}

export interface UpdateExperienceInput {
  title?: string;
  description?: string;
  educationalObjectives?: string[];
  durationMinutes?: number;
  capacity?: number;
  minStudents?: number;
  maxStudents?: number;
  recommendedAgeMin?: number;
  recommendedAgeMax?: number;
  gradeLevels?: string[];
  subjects?: string[];
  curriculumStandards?: CurriculumStandard[];
  cancellationPolicy?: CancellationPolicy;
  specialRequirements?: string;
  active?: boolean;
  published?: boolean;
}

// =====================================================
// EXPERIENCE SERVICE
// =====================================================

export class ExperienceService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new experience
   * Requirements: 8.1, 8.10
   */
  async createExperience(input: CreateExperienceInput): Promise<Experience> {
    // Validate required fields (Requirement 8.10)
    if (!input.title || !input.durationMinutes) {
      throw new Error('Experience name, description, and duration are required');
    }

    // Validate pricing values are positive (Requirement 8.9)
    if (input.pricingTiers) {
      for (const tier of input.pricingTiers) {
        if (tier.priceCents < 0) {
          throw new Error('Pricing values must be positive numbers');
        }
        if (tier.additionalFees) {
          for (const fee of tier.additionalFees) {
            if (fee.amountCents < 0) {
              throw new Error('Additional fee amounts must be positive numbers');
            }
          }
        }
      }
    }

    // Create experience record
    const { data: experience, error: experienceError } = await this.supabase
      .from('experiences')
      .insert({
        venue_id: input.venueId,
        title: input.title,
        description: input.description || null,
        educational_objectives: input.educationalObjectives || [],
        duration_minutes: input.durationMinutes,
        capacity: input.capacity,
        min_students: input.minStudents || null,
        max_students: input.maxStudents || null,
        recommended_age_min: input.recommendedAgeMin || null,
        recommended_age_max: input.recommendedAgeMax || null,
        grade_levels: input.gradeLevels || [],
        subjects: input.subjects || [],
        educational_standards: input.curriculumStandards || [],
        cancellation_policy: input.cancellationPolicy || {
          fullRefundDays: 14,
          partialRefundDays: 7,
          partialRefundPercent: 50,
          noRefundAfterDays: 3,
        },
        special_requirements: input.specialRequirements || null,
        active: input.active !== undefined ? input.active : true,
        published: input.published !== undefined ? input.published : false,
      })
      .select()
      .single();

    if (experienceError) {
      throw new Error(`Failed to create experience: ${experienceError.message}`);
    }

    // Create pricing tiers if provided
    if (input.pricingTiers && input.pricingTiers.length > 0) {
      const { error: pricingError } = await this.supabase
        .from('pricing_tiers')
        .insert(
          input.pricingTiers.map((tier) => ({
            experience_id: experience.id,
            min_students: tier.minStudents,
            max_students: tier.maxStudents,
            price_cents: tier.priceCents,
            free_chaperones: tier.freeChaperones,
            additional_fees: tier.additionalFees || [],
          }))
        );

      if (pricingError) {
        throw new Error(`Failed to create pricing tiers: ${pricingError.message}`);
      }
    }

    return this.getExperience(experience.id);
  }

  /**
   * Get an experience by ID with pricing tiers
   */
  async getExperience(experienceId: string): Promise<Experience> {
    const { data: experience, error: experienceError } = await this.supabase
      .from('experiences')
      .select('*')
      .eq('id', experienceId)
      .single();

    if (experienceError || !experience) {
      throw new Error(`Experience not found: ${experienceId}`);
    }

    // Fetch pricing tiers
    const { data: pricingTiers } = await this.supabase
      .from('pricing_tiers')
      .select('*')
      .eq('experience_id', experienceId)
      .order('min_students', { ascending: true });

    return this.mapExperience(experience, pricingTiers || []);
  }

  /**
   * Get all experiences for a venue
   */
  async getVenueExperiences(venueId: string, includeInactive = false): Promise<Experience[]> {
    let query = this.supabase
      .from('experiences')
      .select('*')
      .eq('venue_id', venueId);

    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data: experiences, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch experiences: ${error.message}`);
    }

    // Fetch pricing tiers for all experiences
    const experienceIds = experiences.map((e) => e.id);
    const { data: allPricingTiers } = await this.supabase
      .from('pricing_tiers')
      .select('*')
      .in('experience_id', experienceIds)
      .order('min_students', { ascending: true });

    // Group pricing tiers by experience
    const pricingByExperience = new Map<string, any[]>();
    (allPricingTiers || []).forEach((tier) => {
      if (!pricingByExperience.has(tier.experience_id)) {
        pricingByExperience.set(tier.experience_id, []);
      }
      pricingByExperience.get(tier.experience_id)!.push(tier);
    });

    return experiences.map((exp) =>
      this.mapExperience(exp, pricingByExperience.get(exp.id) || [])
    );
  }

  /**
   * Update an experience
   * Requirements: 8.2, 8.3, 8.4, 8.5, 8.6
   */
  async updateExperience(
    experienceId: string,
    input: UpdateExperienceInput
  ): Promise<Experience> {
    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.educationalObjectives !== undefined)
      updateData.educational_objectives = input.educationalObjectives;
    if (input.durationMinutes !== undefined) updateData.duration_minutes = input.durationMinutes;
    if (input.capacity !== undefined) updateData.capacity = input.capacity;
    if (input.minStudents !== undefined) updateData.min_students = input.minStudents;
    if (input.maxStudents !== undefined) updateData.max_students = input.maxStudents;
    if (input.recommendedAgeMin !== undefined)
      updateData.recommended_age_min = input.recommendedAgeMin;
    if (input.recommendedAgeMax !== undefined)
      updateData.recommended_age_max = input.recommendedAgeMax;
    if (input.gradeLevels !== undefined) updateData.grade_levels = input.gradeLevels;
    if (input.subjects !== undefined) updateData.subjects = input.subjects;
    if (input.curriculumStandards !== undefined)
      updateData.educational_standards = input.curriculumStandards;
    if (input.cancellationPolicy !== undefined)
      updateData.cancellation_policy = input.cancellationPolicy;
    if (input.specialRequirements !== undefined)
      updateData.special_requirements = input.specialRequirements;
    if (input.active !== undefined) updateData.active = input.active;
    if (input.published !== undefined) updateData.published = input.published;

    const { error } = await this.supabase
      .from('experiences')
      .update(updateData)
      .eq('id', experienceId);

    if (error) {
      throw new Error(`Failed to update experience: ${error.message}`);
    }

    return this.getExperience(experienceId);
  }

  /**
   * Mark an experience as active or inactive
   * Requirements: 8.6, 8.7
   */
  async setExperienceActive(experienceId: string, active: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('experiences')
      .update({ active })
      .eq('id', experienceId);

    if (error) {
      throw new Error(`Failed to update experience status: ${error.message}`);
    }
  }

  /**
   * Duplicate an experience as a template
   * Requirements: 8.8
   */
  async duplicateExperience(experienceId: string, newTitle?: string): Promise<Experience> {
    // Fetch the original experience
    const original = await this.getExperience(experienceId);

    // Create a new experience with the same data
    const duplicateInput: CreateExperienceInput = {
      venueId: original.venueId,
      title: newTitle || `${original.title} (Copy)`,
      description: original.description || undefined,
      educationalObjectives: [...original.educationalObjectives],
      durationMinutes: original.durationMinutes,
      capacity: original.capacity,
      minStudents: original.minStudents || undefined,
      maxStudents: original.maxStudents || undefined,
      recommendedAgeMin: original.recommendedAgeMin || undefined,
      recommendedAgeMax: original.recommendedAgeMax || undefined,
      gradeLevels: [...original.gradeLevels],
      subjects: [...original.subjects],
      curriculumStandards: original.curriculumStandards.map((std) => ({ ...std })),
      pricingTiers: original.pricingTiers?.map((tier) => ({
        minStudents: tier.minStudents,
        maxStudents: tier.maxStudents,
        priceCents: tier.priceCents,
        freeChaperones: tier.freeChaperones,
        additionalFees: tier.additionalFees?.map((fee) => ({ ...fee })),
      })),
      cancellationPolicy: { ...original.cancellationPolicy },
      specialRequirements: original.specialRequirements || undefined,
      active: false, // Duplicates start as inactive
      published: false, // Duplicates start as unpublished
    };

    return this.createExperience(duplicateInput);
  }

  /**
   * Delete an experience
   */
  async deleteExperience(experienceId: string): Promise<void> {
    const { error } = await this.supabase.from('experiences').delete().eq('id', experienceId);

    if (error) {
      throw new Error(`Failed to delete experience: ${error.message}`);
    }
  }

  /**
   * Update pricing tiers for an experience
   */
  async updatePricingTiers(
    experienceId: string,
    pricingTiers: Omit<PricingTier, 'id' | 'experienceId'>[]
  ): Promise<void> {
    // Validate pricing values are positive (Requirement 8.9)
    for (const tier of pricingTiers) {
      if (tier.priceCents < 0) {
        throw new Error('Pricing values must be positive numbers');
      }
      if (tier.additionalFees) {
        for (const fee of tier.additionalFees) {
          if (fee.amountCents < 0) {
            throw new Error('Additional fee amounts must be positive numbers');
          }
        }
      }
    }

    // Delete existing pricing tiers
    await this.supabase.from('pricing_tiers').delete().eq('experience_id', experienceId);

    // Insert new pricing tiers
    if (pricingTiers.length > 0) {
      const { error } = await this.supabase.from('pricing_tiers').insert(
        pricingTiers.map((tier) => ({
          experience_id: experienceId,
          min_students: tier.minStudents,
          max_students: tier.maxStudents,
          price_cents: tier.priceCents,
          free_chaperones: tier.freeChaperones,
          additional_fees: tier.additionalFees || [],
        }))
      );

      if (error) {
        throw new Error(`Failed to update pricing tiers: ${error.message}`);
      }
    }
  }

  /**
   * Link venue forms to an experience
   * Requirements: 8.5
   */
  async linkFormsToExperience(
    experienceId: string,
    formIds: string[],
    required = true
  ): Promise<void> {
    // Remove existing form links
    await this.supabase.from('experience_forms').delete().eq('experience_id', experienceId);

    // Add new form links
    if (formIds.length > 0) {
      const { error } = await this.supabase.from('experience_forms').insert(
        formIds.map((formId) => ({
          experience_id: experienceId,
          form_id: formId,
          required,
        }))
      );

      if (error) {
        throw new Error(`Failed to link forms to experience: ${error.message}`);
      }
    }
  }

  /**
   * Get forms linked to an experience
   */
  async getExperienceForms(experienceId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('experience_forms')
      .select('*, venue_forms(*)')
      .eq('experience_id', experienceId);

    if (error) {
      throw new Error(`Failed to fetch experience forms: ${error.message}`);
    }

    return data || [];
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private mapExperience(dbExperience: any, pricingTiers: any[]): Experience {
    return {
      id: dbExperience.id,
      venueId: dbExperience.venue_id,
      title: dbExperience.title,
      description: dbExperience.description,
      educationalObjectives: dbExperience.educational_objectives || [],
      durationMinutes: dbExperience.duration_minutes,
      capacity: dbExperience.capacity,
      minStudents: dbExperience.min_students,
      maxStudents: dbExperience.max_students,
      recommendedAgeMin: dbExperience.recommended_age_min,
      recommendedAgeMax: dbExperience.recommended_age_max,
      gradeLevels: dbExperience.grade_levels || [],
      subjects: dbExperience.subjects || [],
      curriculumStandards: dbExperience.educational_standards || [],
      pricingTiers: pricingTiers.map((tier) => ({
        id: tier.id,
        experienceId: tier.experience_id,
        minStudents: tier.min_students,
        maxStudents: tier.max_students,
        priceCents: tier.price_cents,
        freeChaperones: tier.free_chaperones,
        additionalFees: tier.additional_fees || [],
      })),
      cancellationPolicy: dbExperience.cancellation_policy || {
        fullRefundDays: 14,
        partialRefundDays: 7,
        partialRefundPercent: 50,
        noRefundAfterDays: 3,
      },
      specialRequirements: dbExperience.special_requirements,
      active: dbExperience.active,
      published: dbExperience.published,
      createdAt: dbExperience.created_at,
      updatedAt: dbExperience.updated_at,
    };
  }
}

/**
 * Create an experience service instance
 */
export function createExperienceService(supabase: SupabaseClient): ExperienceService {
  return new ExperienceService(supabase);
}
