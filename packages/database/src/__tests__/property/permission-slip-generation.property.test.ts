/**
 * Property-Based Tests - Permission Slip Generation Completeness (Task 4.8)
 * 
 * Tests Property 16: Permission Slip Generation Completeness
 * For any trip with N students on the roster, generating permission slips 
 * should create exactly N slips (one per student), and subsequent generation 
 * attempts should skip all students (no duplicates).
 * 
 * **Validates: Requirements 5.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PermissionSlipService } from '../../permission-slip-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use service role key for tests to bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Permission Slip Generation Completeness (Task 4.8)', () => {
  let supabase: SupabaseClient;
  let service: PermissionSlipService;
  let testTeacherId: string;
  let testVenueId: string;
  let testExperienceId: string;
  let testRosterId: string;
  const testTripIds: string[] = [];
  const testStudentIds: string[] = [];
  const testSlipIds: string[] = [];
  const testRosterIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    service = new PermissionSlipService(supabase);
    testTeacherId = crypto.randomUUID();

    // Create test teacher (required for trips and rosters)
    await supabase
      .from('teachers')
      .insert({
        id: testTeacherId,
        first_name: 'Test',
        last_name: 'Teacher',
        email: `test${Date.now()}@teacher.com`,
        independent: true,
      });

    // Create test roster (required for students)
    const { data: roster } = await supabase
      .from('rosters')
      .insert({
        teacher_id: testTeacherId,
        name: `Test Roster ${Date.now()}`,
      })
      .select()
      .single();

    testRosterId = roster!.id;
    testRosterIds.push(testRosterId);

    // Create test venue
    const { data: venue } = await supabase
      .from('venues')
      .insert({
        name: `Test Venue ${Date.now()}`,
        description: 'Test venue for permission slip tests',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
        contact_email: `test${Date.now()}@venue.com`,
        contact_phone: '555-0100',
      })
      .select()
      .single();

    testVenueId = venue!.id;

    // Create test experience
    const { data: experience } = await supabase
      .from('experiences')
      .insert({
        venue_id: testVenueId,
        title: `Test Experience ${Date.now()}`,
        description: 'Test experience for permission slip tests',
        duration_minutes: 120,
        capacity: 50,
        min_students: 10,
        max_students: 50,
        active: true,
        published: true,
      })
      .select()
      .single();

    testExperienceId = experience!.id;
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    if (testSlipIds.length > 0) {
      await supabase.from('permission_slips').delete().in('id', testSlipIds);
      testSlipIds.length = 0;
    }
    if (testStudentIds.length > 0) {
      await supabase.from('students').delete().in('id', testStudentIds);
      testStudentIds.length = 0;
    }
    if (testTripIds.length > 0) {
      await supabase.from('trips').delete().in('id', testTripIds);
      testTripIds.length = 0;
    }
    if (testRosterIds.length > 0) {
      await supabase.from('rosters').delete().in('id', testRosterIds);
      testRosterIds.length = 0;
    }

    // Clean up test infrastructure
    if (testExperienceId) {
      await supabase.from('experiences').delete().eq('id', testExperienceId);
    }
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
    }
    if (testTeacherId) {
      await supabase.from('teachers').delete().eq('id', testTeacherId);
    }
  });

  /**
   * Property 16: Permission Slip Generation Completeness
   * 
   * For any trip with N students on the roster, generating permission slips 
   * should create exactly N slips (one per student).
   * 
   * This property ensures that the one-click generation creates slips for 
   * all students without missing any.
   */
  it('Property 16: Generating slips for trip with N students creates exactly N slips', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of students (1 to 30 for reasonable test execution time)
        fc.integer({ min: 1, max: 30 }),
        async (numStudents) => {
          // Create a fresh roster for this test iteration
          const { data: roster } = await supabase
            .from('rosters')
            .insert({
              teacher_id: testTeacherId,
              name: `Test Roster ${Date.now()}-${Math.random()}`,
            })
            .select()
            .single();

          if (!roster) throw new Error('Failed to create roster');
          testRosterIds.push(roster.id);

          // Create test trip
          const { data: trip, error: tripError } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending'
            })
            .select()
            .single();

          if (tripError || !trip) {
            throw new Error(`Failed to create test trip: ${tripError?.message}`);
          }
          testTripIds.push(trip.id);

          // Create N students associated with this roster
          const studentInserts = Array.from({ length: numStudents }, (_, i) => ({
            roster_id: roster.id,
            first_name: `Student${i}`,
            last_name: `Test${i}`,
          }));

          const { data: students, error: studentsError } = await supabase
            .from('students')
            .insert(studentInserts)
            .select();

          if (studentsError || !students) {
            throw new Error(`Failed to create test students: ${studentsError?.message}`);
          }

          students.forEach(s => testStudentIds.push(s.id));

          // Generate permission slips for students in this roster
          const result = await service.generatePermissionSlips({ 
            tripId: trip.id,
            rosterIds: [roster.id]
          });

          // Track created slips for cleanup
          result.slips.forEach(slip => testSlipIds.push(slip.id));

          // Property: Should create exactly N slips
          expect(result.totalGenerated).toBe(numStudents);
          expect(result.slips).toHaveLength(numStudents);
          expect(result.totalSkipped).toBe(0);
          expect(result.errors).toHaveLength(0);

          // Verify each student has exactly one slip
          const { data: allSlips } = await supabase
            .from('permission_slips')
            .select('student_id')
            .eq('trip_id', trip.id);

          expect(allSlips).toHaveLength(numStudents);

          // Verify no duplicate student IDs
          const studentIds = allSlips!.map(slip => slip.student_id);
          const uniqueStudentIds = new Set(studentIds);
          expect(uniqueStudentIds.size).toBe(numStudents);

          // Verify all students have slips
          const createdStudentIds = students.map(s => s.id);
          createdStudentIds.forEach(studentId => {
            expect(studentIds).toContain(studentId);
          });
        }
      ),
      { numRuns: 10 } // Reduced runs for database operations
    );
  }, 180000); // 3 minute timeout for database operations

  /**
   * Property 16 (Idempotency): Subsequent generation attempts skip all students
   * 
   * After generating permission slips for all students, calling generate again
   * should skip all students (totalSkipped = N, totalGenerated = 0) and not
   * create duplicates.
   * 
   * This ensures the "one click" generation is safe to call multiple times.
   */
  it('Property 16 (Idempotency): Subsequent generation skips all students (no duplicates)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of students (1 to 20 for faster execution)
        fc.integer({ min: 1, max: 20 }),
        async (numStudents) => {
          // Create a fresh roster for this test iteration
          const { data: roster } = await supabase
            .from('rosters')
            .insert({
              teacher_id: testTeacherId,
              name: `Test Roster ${Date.now()}-${Math.random()}`,
            })
            .select()
            .single();

          if (!roster) throw new Error('Failed to create roster');
          testRosterIds.push(roster.id);

          // Create test trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending'
            })
            .select()
            .single();

          if (!trip) throw new Error('Failed to create trip');
          testTripIds.push(trip.id);

          // Create N students
          const studentInserts = Array.from({ length: numStudents }, (_, i) => ({
            roster_id: roster.id,
            first_name: `Student${i}`,
            last_name: `Test${i}`,
          }));

          const { data: students } = await supabase
            .from('students')
            .insert(studentInserts)
            .select();

          if (!students) throw new Error('Failed to create students');
          students.forEach(s => testStudentIds.push(s.id));

          // First generation - should create N slips
          const firstResult = await service.generatePermissionSlips({ 
            tripId: trip.id,
            rosterIds: [roster.id]
          });
          firstResult.slips.forEach(slip => testSlipIds.push(slip.id));

          expect(firstResult.totalGenerated).toBe(numStudents);
          expect(firstResult.totalSkipped).toBe(0);

          // Second generation - should skip all N students
          const secondResult = await service.generatePermissionSlips({ 
            tripId: trip.id,
            rosterIds: [roster.id]
          });

          expect(secondResult.totalGenerated).toBe(0);
          expect(secondResult.totalSkipped).toBe(numStudents);
          expect(secondResult.slips).toHaveLength(0);
          expect(secondResult.errors).toHaveLength(0);

          // Verify still only N slips exist (no duplicates created)
          const { data: allSlips } = await supabase
            .from('permission_slips')
            .select('*')
            .eq('trip_id', trip.id);

          expect(allSlips).toHaveLength(numStudents);

          // Verify each student still has exactly one slip
          const studentIds = allSlips!.map(slip => slip.student_id);
          const uniqueStudentIds = new Set(studentIds);
          expect(uniqueStudentIds.size).toBe(numStudents);
        }
      ),
      { numRuns: 10 }
    );
  }, 180000);

  /**
   * Property 16 (Partial Generation): Adding students after initial generation
   * 
   * If permission slips are generated for N students, then M more students are
   * added to the trip, generating again should create exactly M new slips
   * (skipping the original N students).
   */
  it('Property 16 (Partial Generation): Adding students after initial generation creates only new slips', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial and additional student counts
        fc.integer({ min: 1, max: 15 }),
        fc.integer({ min: 1, max: 15 }),
        async (initialStudents, additionalStudents) => {
          // Create a fresh roster for this test iteration
          const { data: roster } = await supabase
            .from('rosters')
            .insert({
              teacher_id: testTeacherId,
              name: `Test Roster ${Date.now()}-${Math.random()}`,
            })
            .select()
            .single();

          if (!roster) throw new Error('Failed to create roster');
          testRosterIds.push(roster.id);

          // Create test trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending'
            })
            .select()
            .single();

          if (!trip) throw new Error('Failed to create trip');
          testTripIds.push(trip.id);

          // Create initial students
          const initialInserts = Array.from({ length: initialStudents }, (_, i) => ({
            roster_id: roster.id,
            first_name: `InitialStudent${i}`,
            last_name: `Test${i}`,
          }));

          const { data: initialStudentData } = await supabase
            .from('students')
            .insert(initialInserts)
            .select();

          if (!initialStudentData) throw new Error('Failed to create initial students');
          initialStudentData.forEach(s => testStudentIds.push(s.id));

          // First generation - create slips for initial students
          const firstResult = await service.generatePermissionSlips({ 
            tripId: trip.id,
            rosterIds: [roster.id]
          });
          firstResult.slips.forEach(slip => testSlipIds.push(slip.id));

          expect(firstResult.totalGenerated).toBe(initialStudents);
          expect(firstResult.totalSkipped).toBe(0);

          // Add more students to the roster
          const additionalInserts = Array.from({ length: additionalStudents }, (_, i) => ({
            roster_id: roster.id,
            first_name: `AdditionalStudent${i}`,
            last_name: `Test${i}`,
          }));

          const { data: additionalStudentData } = await supabase
            .from('students')
            .insert(additionalInserts)
            .select();

          if (!additionalStudentData) throw new Error('Failed to create additional students');
          additionalStudentData.forEach(s => testStudentIds.push(s.id));

          // Second generation - should create slips only for new students
          const secondResult = await service.generatePermissionSlips({ 
            tripId: trip.id,
            rosterIds: [roster.id]
          });
          secondResult.slips.forEach(slip => testSlipIds.push(slip.id));

          expect(secondResult.totalGenerated).toBe(additionalStudents);
          expect(secondResult.totalSkipped).toBe(initialStudents);
          expect(secondResult.errors).toHaveLength(0);

          // Verify total slips = initial + additional
          const { data: allSlips } = await supabase
            .from('permission_slips')
            .select('*')
            .eq('trip_id', trip.id);

          const totalExpected = initialStudents + additionalStudents;
          expect(allSlips).toHaveLength(totalExpected);

          // Verify each student has exactly one slip
          const studentIds = allSlips!.map(slip => slip.student_id);
          const uniqueStudentIds = new Set(studentIds);
          expect(uniqueStudentIds.size).toBe(totalExpected);
        }
      ),
      { numRuns: 8 }
    );
  }, 180000);

  /**
   * Property 16 (Edge Case): Empty roster (zero students)
   * 
   * For a trip with no students, generating permission slips should return
   * zero generated, zero skipped, and an empty slips array.
   */
  it('Property 16 (Edge Case): Trip with zero students generates zero slips', async () => {
    // Create test trip with no students
    const { data: trip } = await supabase
      .from('trips')
      .insert({
        experience_id: testExperienceId,
        teacher_id: testTeacherId,
        trip_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      })
      .select()
      .single();

    if (!trip) throw new Error('Failed to create trip');
    testTripIds.push(trip.id);

    // Generate permission slips (no students exist in roster)
    const result = await service.generatePermissionSlips({ 
      tripId: trip.id,
      rosterIds: [testRosterId]
    });

    expect(result.totalGenerated).toBe(0);
    expect(result.totalSkipped).toBe(0);
    expect(result.slips).toHaveLength(0);
    expect(result.errors).toHaveLength(0);

    // Verify no slips were created
    const { data: allSlips } = await supabase
      .from('permission_slips')
      .select('*')
      .eq('trip_id', trip.id);

    expect(allSlips).toHaveLength(0);
  }, 30000);

  /**
   * Property 16 (Consistency): Each slip has required fields populated
   * 
   * For any generated permission slip, it should have:
   * - Valid trip_id matching the trip
   * - Valid student_id from the roster
   * - Status set to 'pending'
   * - Magic link token generated
   * - Token expiration set (7 days from creation)
   */
  it('Property 16 (Consistency): Generated slips have all required fields populated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (numStudents) => {
          // Create a fresh roster for this test iteration
          const { data: roster } = await supabase
            .from('rosters')
            .insert({
              teacher_id: testTeacherId,
              name: `Test Roster ${Date.now()}-${Math.random()}`,
            })
            .select()
            .single();

          if (!roster) throw new Error('Failed to create roster');
          testRosterIds.push(roster.id);

          // Create test trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending'
            })
            .select()
            .single();

          if (!trip) throw new Error('Failed to create trip');
          testTripIds.push(trip.id);

          // Create students
          const studentInserts = Array.from({ length: numStudents }, (_, i) => ({
            roster_id: roster.id,
            first_name: `Student${i}`,
            last_name: `Test${i}`,
          }));

          const { data: students } = await supabase
            .from('students')
            .insert(studentInserts)
            .select();

          if (!students) throw new Error('Failed to create students');
          students.forEach(s => testStudentIds.push(s.id));

          // Generate permission slips
          const result = await service.generatePermissionSlips({ 
            tripId: trip.id,
            rosterIds: [roster.id]
          });
          result.slips.forEach(slip => testSlipIds.push(slip.id));

          // Verify each slip has required fields
          result.slips.forEach(slip => {
            // Trip ID matches
            expect(slip.trip_id).toBe(trip.id);

            // Student ID is from our created students
            const studentIds = students.map(s => s.id);
            expect(studentIds).toContain(slip.student_id);

            // Status is pending
            expect(slip.status).toBe('pending');

            // Magic link token exists and is non-empty
            expect(slip.magic_link_token).toBeTruthy();
            expect(slip.magic_link_token!.length).toBeGreaterThan(0);

            // Token expiration is set and in the future
            expect(slip.token_expires_at).toBeTruthy();
            const expiresAt = new Date(slip.token_expires_at!);
            const now = new Date();
            expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());

            // Token expires approximately 7 days from now (within 2 hour tolerance for test execution time)
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const timeDiff = Math.abs(expiresAt.getTime() - sevenDaysFromNow.getTime());
            const twoHours = 2 * 60 * 60 * 1000;
            expect(timeDiff).toBeLessThan(twoHours);

            // Created and updated timestamps exist
            expect(slip.created_at).toBeTruthy();
            expect(slip.updated_at).toBeTruthy();
          });
        }
      ),
      { numRuns: 8 }
    );
  }, 180000);
});
