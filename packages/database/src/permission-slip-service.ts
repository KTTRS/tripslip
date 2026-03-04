import type { SupabaseClient } from './client';

/**
 * Permission slip record from the database
 */
export interface PermissionSlip {
  id: string;
  trip_id: string;
  student_id: string;
  magic_link_token: string | null;
  token_expires_at: string | null;
  status: 'pending' | 'signed' | 'paid' | 'cancelled';
  form_data: Record<string, any> | null;
  signature_data: string | null;
  signed_at: string | null;
  signed_by_parent_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input for generating permission slips
 */
export interface GeneratePermissionSlipsInput {
  tripId: string;
  rosterIds?: string[]; // Optional: specific rosters to generate slips for
  studentIds?: string[]; // Optional: specific students to generate slips for
}

/**
 * Result of permission slip generation
 */
export interface GeneratePermissionSlipsResult {
  slips: PermissionSlip[];
  totalGenerated: number;
  totalSkipped: number;
  errors: Array<{ studentId: string; error: string }>;
}

/**
 * Service for managing permission slips
 * 
 * Handles permission slip generation for trips with duplicate prevention
 * and batch creation for all students on a trip roster.
 * 
 * @example
 * ```ts
 * const slipService = new PermissionSlipService(supabase);
 * 
 * // Generate slips for all students on a trip
 * const result = await slipService.generatePermissionSlips({
 *   tripId: 'trip-uuid'
 * });
 * 
 * console.log(`Generated ${result.totalGenerated} slips`);
 * console.log(`Skipped ${result.totalSkipped} existing slips`);
 * ```
 */
export class PermissionSlipService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate permission slips for all students on a trip
   * 
   * Creates one permission slip per student per trip. Handles duplicate
   * prevention by checking for existing slips before creation. Uses
   * database UNIQUE constraint (trip_id, student_id) as final safeguard.
   * 
   * If rosterIds are provided, generates slips only for students in those rosters.
   * If studentIds are provided, generates slips only for those specific students.
   * If neither is provided, generates slips for all students in the teacher's rosters.
   * 
   * @param input - Generation parameters with trip ID and optional filters
   * @returns Result with created slips, counts, and any errors
   * @throws Error if trip not found or database operation fails
   */
  async generatePermissionSlips(
    input: GeneratePermissionSlipsInput
  ): Promise<GeneratePermissionSlipsResult> {
    const { tripId, rosterIds, studentIds } = input;

    // Verify trip exists
    const { data: trip, error: tripError } = await this.supabase
      .from('trips')
      .select('id, teacher_id, status')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    // Validate trip status
    if ((trip as any).status === 'cancelled') {
      throw new Error('Cannot generate permission slips for cancelled trip');
    }

    // Build student query based on provided filters
    let studentsQuery = this.supabase
      .from('students')
      .select('id, first_name, last_name, roster_id');

    if (studentIds && studentIds.length > 0) {
      // Generate for specific students
      studentsQuery = studentsQuery.in('id', studentIds);
    } else if (rosterIds && rosterIds.length > 0) {
      // Generate for students in specific rosters
      studentsQuery = studentsQuery.in('roster_id', rosterIds);
    } else {
      // Generate for all students in teacher's rosters
      const { data: teacherRosters } = await this.supabase
        .from('rosters')
        .select('id')
        .eq('teacher_id', trip.teacher_id);
      
      if (!teacherRosters || teacherRosters.length === 0) {
        return {
          slips: [],
          totalGenerated: 0,
          totalSkipped: 0,
          errors: [],
        };
      }
      
      const teacherRosterIds = teacherRosters.map((r: any) => r.id);
      studentsQuery = studentsQuery.in('roster_id', teacherRosterIds);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    if (!students || students.length === 0) {
      return {
        slips: [],
        totalGenerated: 0,
        totalSkipped: 0,
        errors: [],
      };
    }

    // Fetch existing permission slips for this trip
    const { data: existingSlips, error: existingError } = await this.supabase
      .from('permission_slips')
      .select('student_id')
      .eq('trip_id', tripId);

    if (existingError) {
      throw new Error(`Failed to check existing slips: ${existingError.message}`);
    }

    // Create set of student IDs that already have slips
    const existingStudentIds = new Set(
      (existingSlips || []).map((slip: any) => slip.student_id)
    );

    // Filter students who don't have slips yet
    const studentsNeedingSlips = students.filter(
      (student: any) => !existingStudentIds.has(student.id)
    );

    const totalSkipped = students.length - studentsNeedingSlips.length;

    // If all students already have slips, return early
    if (studentsNeedingSlips.length === 0) {
      return {
        slips: [],
        totalGenerated: 0,
        totalSkipped,
        errors: [],
      };
    }

    // Generate magic link tokens for each slip
    const slipsToCreate = studentsNeedingSlips.map((student: any) => {
      const token = this.generateSecureToken(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      return {
        trip_id: tripId,
        student_id: student.id,
        magic_link_token: token,
        token_expires_at: expiresAt.toISOString(),
        status: 'pending' as const,
      };
    });

    // Batch insert permission slips
    const { data: createdSlips, error: insertError } = await this.supabase
      .from('permission_slips')
      .insert(slipsToCreate as any)
      .select();

    if (insertError) {
      // Check if error is due to duplicate constraint violation
      if (insertError.code === '23505') {
        // Unique constraint violation - some slips already exist
        // Try inserting one by one to identify which ones succeeded
        return await this.generatePermissionSlipsOneByOne(tripId, slipsToCreate);
      }

      throw new Error(`Failed to create permission slips: ${insertError.message}`);
    }

    return {
      slips: (createdSlips as PermissionSlip[]) || [],
      totalGenerated: createdSlips?.length || 0,
      totalSkipped,
      errors: [],
    };
  }

  /**
   * Fallback method to insert slips one by one when batch insert fails
   * 
   * Used when batch insert encounters duplicate constraint violations.
   * Attempts to insert each slip individually and collects errors.
   * 
   * @private
   */
  private async generatePermissionSlipsOneByOne(
    tripId: string,
    slipsToCreate: Array<{
      trip_id: string;
      student_id: string;
      magic_link_token: string;
      token_expires_at: string;
      status: 'pending';
    }>
  ): Promise<GeneratePermissionSlipsResult> {
    const createdSlips: PermissionSlip[] = [];
    const errors: Array<{ studentId: string; error: string }> = [];
    let skipped = 0;

    for (const slip of slipsToCreate) {
      const { data, error } = await this.supabase
        .from('permission_slips')
        .insert(slip as any)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Duplicate - skip
          skipped++;
        } else {
          errors.push({
            studentId: slip.student_id,
            error: error.message,
          });
        }
      } else if (data) {
        createdSlips.push(data as PermissionSlip);
      }
    }

    return {
      slips: createdSlips,
      totalGenerated: createdSlips.length,
      totalSkipped: skipped,
      errors,
    };
  }

  /**
   * Get permission slip by ID
   * 
   * @param slipId - Permission slip UUID
   * @returns Permission slip record or null if not found
   */
  async getPermissionSlipById(slipId: string): Promise<PermissionSlip | null> {
    const { data, error } = await this.supabase
      .from('permission_slips')
      .select('*')
      .eq('id', slipId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching permission slip: ${error.message}`);
    }

    return data as PermissionSlip;
  }

  /**
   * Get all permission slips for a trip
   * 
   * @param tripId - Trip UUID
   * @returns Array of permission slip records
   */
  async getPermissionSlipsByTripId(tripId: string): Promise<PermissionSlip[]> {
    const { data, error } = await this.supabase
      .from('permission_slips')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching permission slips: ${error.message}`);
    }

    return (data as PermissionSlip[]) || [];
  }

  /**
   * Get permission slip for a specific student on a trip
   * 
   * @param tripId - Trip UUID
   * @param studentId - Student UUID
   * @returns Permission slip record or null if not found
   */
  async getPermissionSlipByTripAndStudent(
    tripId: string,
    studentId: string
  ): Promise<PermissionSlip | null> {
    const { data, error } = await this.supabase
      .from('permission_slips')
      .select('*')
      .eq('trip_id', tripId)
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching permission slip: ${error.message}`);
    }

    return data as PermissionSlip;
  }

  /**
   * Count permission slips by status for a trip
   * 
   * @param tripId - Trip UUID
   * @returns Object with counts by status
   */
  async getPermissionSlipStatusCounts(tripId: string): Promise<{
    total: number;
    pending: number;
    signed: number;
    paid: number;
    cancelled: number;
  }> {
    const { data, error } = await this.supabase
      .from('permission_slips')
      .select('status')
      .eq('trip_id', tripId);

    if (error) {
      throw new Error(`Error fetching permission slip counts: ${error.message}`);
    }

    const slips = data || [];
    const counts = {
      total: slips.length,
      pending: 0,
      signed: 0,
      paid: 0,
      cancelled: 0,
    };

    slips.forEach((slip: any) => {
      if (slip.status in counts) {
        counts[slip.status as keyof typeof counts]++;
      }
    });

    return counts;
  }

  /**
   * Generate a cryptographically secure random token
   * 
   * @private
   * @param length - Token length (default: 32)
   * @returns Random token string
   */
  private generateSecureToken(length: number = 32): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Use crypto.getRandomValues for secure random generation
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result;
  }
}
