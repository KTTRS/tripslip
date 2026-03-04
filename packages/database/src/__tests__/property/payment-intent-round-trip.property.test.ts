/**
 * Property-Based Tests - Payment Intent Round Trip (Task 1.2)
 * 
 * Tests Property 1: Payment Intent Round Trip
 * For any valid payment data, creating a payment intent then retrieving 
 * the payment record should return equivalent data with matching amount, 
 * slip ID, and parent ID.
 * 
 * **Validates: Requirements 1.3, 1.4, 1.10**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use service role key for tests to bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Payment Intent Round Trip (Task 1.2)', () => {
  let supabase: SupabaseClient;
  let testTeacherId: string;
  let testVenueId: string;
  let testExperienceId: string;
  let testRosterId: string;
  const testPaymentIds: string[] = [];
  const testSlipIds: string[] = [];
  const testTripIds: string[] = [];
  const testParentIds: string[] = [];
  const testStudentIds: string[] = [];
  const testRosterIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
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

    // Create test venue
    const { data: venue } = await supabase
      .from('venues')
      .insert({
        name: `Test Venue ${Date.now()}`,
        description: 'Test venue for payment tests',
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
        description: 'Test experience for payment tests',
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
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    if (testPaymentIds.length > 0) {
      await supabase.from('payments').delete().in('id', testPaymentIds);
      testPaymentIds.length = 0;
    }
    if (testSlipIds.length > 0) {
      await supabase.from('permission_slips').delete().in('id', testSlipIds);
      testSlipIds.length = 0;
    }
    if (testTripIds.length > 0) {
      await supabase.from('trips').delete().in('id', testTripIds);
      testTripIds.length = 0;
    }
    if (testStudentIds.length > 0) {
      await supabase.from('students').delete().in('id', testStudentIds);
      testStudentIds.length = 0;
    }
    if (testParentIds.length > 0) {
      await supabase.from('parents').delete().in('id', testParentIds);
      testParentIds.length = 0;
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
   * Property 1: Payment Intent Round Trip
   * 
   * For any valid payment data (amount, slip ID, parent ID), creating a payment 
   * record then retrieving it should return equivalent data with matching values.
   * 
   * This property ensures data consistency in the payment creation and retrieval flow.
   */
  it('Property 1: Payment intent round trip preserves amount, slip ID, and parent ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid payment amounts (in cents, between $1 and $10,000)
        fc.integer({ min: 100, max: 1000000 }),
        // Generate boolean for split payment
        fc.boolean(),
        async (amountCents, isSplitPayment) => {
          // Create test parent
          const { data: parent, error: parentError } = await supabase
            .from('parents')
            .insert({
              email: `test-parent-${Date.now()}-${Math.random()}@example.com`,
              first_name: 'Test',
              last_name: 'Parent',
              phone: '555-0100'
            })
            .select()
            .single();

          if (parentError || !parent) {
            throw new Error(`Failed to create test parent: ${parentError?.message}`);
          }
          testParentIds.push(parent.id);

          // Create test student
          const { data: student, error: studentError } = await supabase
            .from('students')
            .insert({
              roster_id: testRosterId,
              first_name: 'Test',
              last_name: 'Student'
            })
            .select()
            .single();

          if (studentError || !student) {
            throw new Error(`Failed to create test student: ${studentError?.message}`);
          }
          testStudentIds.push(student.id);

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

          // Create test permission slip
          const { data: slip, error: slipError } = await supabase
            .from('permission_slips')
            .insert({
              trip_id: trip.id,
              student_id: student.id,
              status: 'pending'
            })
            .select()
            .single();

          if (slipError || !slip) {
            throw new Error(`Failed to create test permission slip: ${slipError?.message}`);
          }
          testSlipIds.push(slip.id);

          // Generate split payment group ID if needed
          const splitPaymentGroupId = isSplitPayment 
            ? crypto.randomUUID() 
            : null;

          // Create payment record (simulating what create-payment-intent does)
          const { data: createdPayment, error: createError } = await supabase
            .from('payments')
            .insert({
              permission_slip_id: slip.id,
              parent_id: parent.id,
              amount_cents: amountCents,
              stripe_payment_intent_id: `pi_test_${Date.now()}_${Math.random()}`,
              status: 'pending',
              is_split_payment: isSplitPayment,
              split_payment_group_id: splitPaymentGroupId
            })
            .select()
            .single();

          if (createError || !createdPayment) {
            throw new Error(`Failed to create payment record: ${createError?.message}`);
          }
          testPaymentIds.push(createdPayment.id);

          // Retrieve the payment record
          const { data: retrievedPayment, error: retrieveError } = await supabase
            .from('payments')
            .select('*')
            .eq('id', createdPayment.id)
            .single();

          if (retrieveError || !retrievedPayment) {
            throw new Error(`Failed to retrieve payment record: ${retrieveError?.message}`);
          }

          // Verify round-trip consistency
          expect(retrievedPayment.amount_cents).toBe(amountCents);
          expect(retrievedPayment.permission_slip_id).toBe(slip.id);
          expect(retrievedPayment.parent_id).toBe(parent.id);
          expect(retrievedPayment.is_split_payment).toBe(isSplitPayment);
          expect(retrievedPayment.split_payment_group_id).toBe(splitPaymentGroupId);
          expect(retrievedPayment.status).toBe('pending');
          expect(retrievedPayment.id).toBe(createdPayment.id);
        }
      ),
      { numRuns: 10 } // Reduced runs for database operations
    );
  }, 120000); // 2 minute timeout for database operations

  /**
   * Property 1 (Edge Case): Zero or negative amounts should be rejected
   * 
   * The database has a CHECK constraint that amount_cents > 0.
   * This test verifies that invalid amounts are properly rejected.
   */
  it('Property 1 (Edge Case): Rejects zero or negative payment amounts', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate invalid amounts (zero or negative)
        fc.integer({ min: -10000, max: 0 }),
        async (invalidAmount) => {
          // Create minimal test data
          const { data: parent } = await supabase
            .from('parents')
            .insert({
              email: `test-parent-${Date.now()}-${Math.random()}@example.com`,
              first_name: 'Test',
              last_name: 'Parent',
              phone: '555-0100'
            })
            .select()
            .single();

          if (!parent) return;
          testParentIds.push(parent.id);

          const { data: student } = await supabase
            .from('students')
            .insert({
              roster_id: testRosterId,
              first_name: 'Test',
              last_name: 'Student'
            })
            .select()
            .single();

          if (!student) return;
          testStudentIds.push(student.id);

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

          if (!trip) return;
          testTripIds.push(trip.id);

          const { data: slip } = await supabase
            .from('permission_slips')
            .insert({
              trip_id: trip.id,
              student_id: student.id,
              status: 'pending'
            })
            .select()
            .single();

          if (!slip) return;
          testSlipIds.push(slip.id);

          // Attempt to create payment with invalid amount
          const { error } = await supabase
            .from('payments')
            .insert({
              permission_slip_id: slip.id,
              parent_id: parent.id,
              amount_cents: invalidAmount,
              stripe_payment_intent_id: `pi_test_${Date.now()}`,
              status: 'pending',
              is_split_payment: false
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
   * Property 1 (Consistency): Multiple retrievals return identical data
   * 
   * Retrieving the same payment record multiple times should always
   * return identical data, demonstrating read consistency.
   */
  it('Property 1 (Consistency): Multiple retrievals return identical payment data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 1000000 }),
        fc.boolean(),
        async (amountCents, isSplitPayment) => {
          // Create test data
          const { data: parent } = await supabase
            .from('parents')
            .insert({
              email: `test-parent-${Date.now()}-${Math.random()}@example.com`,
              first_name: 'Test',
              last_name: 'Parent',
              phone: '555-0100'
            })
            .select()
            .single();

          if (!parent) throw new Error('Failed to create parent');
          testParentIds.push(parent.id);

          const { data: student } = await supabase
            .from('students')
            .insert({
              roster_id: testRosterId,
              first_name: 'Test',
              last_name: 'Student'
            })
            .select()
            .single();

          if (!student) throw new Error('Failed to create student');
          testStudentIds.push(student.id);

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

          const { data: slip } = await supabase
            .from('permission_slips')
            .insert({
              trip_id: trip.id,
              student_id: student.id,
              status: 'pending'
            })
            .select()
            .single();

          if (!slip) throw new Error('Failed to create slip');
          testSlipIds.push(slip.id);

          // Create payment
          const { data: payment } = await supabase
            .from('payments')
            .insert({
              permission_slip_id: slip.id,
              parent_id: parent.id,
              amount_cents: amountCents,
              stripe_payment_intent_id: `pi_test_${Date.now()}_${Math.random()}`,
              status: 'pending',
              is_split_payment: isSplitPayment
            })
            .select()
            .single();

          if (!payment) throw new Error('Failed to create payment');
          testPaymentIds.push(payment.id);

          // Retrieve payment multiple times
          const { data: retrieval1 } = await supabase
            .from('payments')
            .select('*')
            .eq('id', payment.id)
            .single();

          const { data: retrieval2 } = await supabase
            .from('payments')
            .select('*')
            .eq('id', payment.id)
            .single();

          const { data: retrieval3 } = await supabase
            .from('payments')
            .select('*')
            .eq('id', payment.id)
            .single();

          // All retrievals should return identical data
          expect(retrieval1).toEqual(retrieval2);
          expect(retrieval2).toEqual(retrieval3);
          expect(retrieval1?.amount_cents).toBe(amountCents);
          expect(retrieval1?.permission_slip_id).toBe(slip.id);
          expect(retrieval1?.parent_id).toBe(parent.id);
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);
});
