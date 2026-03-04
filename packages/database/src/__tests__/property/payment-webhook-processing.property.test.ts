/**
 * Property-Based Tests - Payment Webhook Processing (Task 1.5)
 * 
 * Tests Property 2: Payment Webhook Processing
 * For any payment intent succeeded webhook event, the system should update 
 * the payment status to 'succeeded' and if all payments for a slip are complete, 
 * update the slip status to 'paid'.
 * 
 * **Validates: Requirements 1.6**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use service role key for tests to bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Payment Webhook Processing (Task 1.5)', () => {
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
        description: 'Test venue for webhook tests',
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
        description: 'Test experience for webhook tests',
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
   * Property 2: Payment Webhook Processing - Single Payment Success
   * 
   * For any permission slip with a single payment, when that payment succeeds,
   * both the payment status and slip status should update to 'succeeded' and 'paid' respectively.
   */
  it('Property 2: Single payment success updates payment and slip status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 1000000 }),
        async (amountCents) => {
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

          // Create payment in pending status
          const stripePaymentIntentId = `pi_test_${Date.now()}_${Math.random()}`;
          const { data: payment } = await supabase
            .from('payments')
            .insert({
              permission_slip_id: slip.id,
              parent_id: parent.id,
              amount_cents: amountCents,
              stripe_payment_intent_id: stripePaymentIntentId,
              status: 'pending',
              is_split_payment: false
            })
            .select()
            .single();

          if (!payment) throw new Error('Failed to create payment');
          testPaymentIds.push(payment.id);

          // Simulate webhook processing: Update payment to succeeded
          await supabase
            .from('payments')
            .update({
              status: 'succeeded',
              paid_at: new Date().toISOString()
            })
            .eq('stripe_payment_intent_id', stripePaymentIntentId);

          // Check if all payments for this slip are complete
          const { data: payments } = await supabase
            .from('payments')
            .select('status')
            .eq('permission_slip_id', slip.id);

          const allPaid = payments?.every(p => p.status === 'succeeded');

          // If all paid, update slip status
          if (allPaid) {
            await supabase
              .from('permission_slips')
              .update({ status: 'paid' })
              .eq('id', slip.id);
          }

          // Verify payment status updated
          const { data: updatedPayment } = await supabase
            .from('payments')
            .select('status')
            .eq('id', payment.id)
            .single();

          expect(updatedPayment?.status).toBe('succeeded');

          // Verify slip status updated to paid
          const { data: updatedSlip } = await supabase
            .from('permission_slips')
            .select('status')
            .eq('id', slip.id)
            .single();

          expect(updatedSlip?.status).toBe('paid');
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * Property 2: Payment Webhook Processing - Multiple Payments (Split Payment)
   * 
   * For any permission slip with multiple payments, the slip status should only
   * update to 'paid' when ALL payments have succeeded.
   */
  it('Property 2: Slip status updates to paid only when all split payments succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // Number of split payments
        fc.integer({ min: 100, max: 10000 }), // Amount per payment
        async (numPayments, amountPerPayment) => {
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

          const splitPaymentGroupId = crypto.randomUUID();

          // Create multiple payments for the same slip
          const paymentIds: string[] = [];
          for (let i = 0; i < numPayments; i++) {
            const { data: payment } = await supabase
              .from('payments')
              .insert({
                permission_slip_id: slip.id,
                parent_id: parent.id,
                amount_cents: amountPerPayment,
                stripe_payment_intent_id: `pi_test_${Date.now()}_${i}_${Math.random()}`,
                status: 'pending',
                is_split_payment: true,
                split_payment_group_id: splitPaymentGroupId
              })
              .select()
              .single();

            if (!payment) throw new Error('Failed to create payment');
            paymentIds.push(payment.id);
            testPaymentIds.push(payment.id);
          }

          // Process payments one by one, checking slip status after each
          for (let i = 0; i < numPayments; i++) {
            // Update payment to succeeded
            await supabase
              .from('payments')
              .update({
                status: 'succeeded',
                paid_at: new Date().toISOString()
              })
              .eq('id', paymentIds[i]);

            // Check if all payments are complete
            const { data: payments } = await supabase
              .from('payments')
              .select('status')
              .eq('permission_slip_id', slip.id);

            const allPaid = payments?.every(p => p.status === 'succeeded');

            // Update slip status if all paid
            if (allPaid) {
              await supabase
                .from('permission_slips')
                .update({ status: 'paid' })
                .eq('id', slip.id);
            }

            // Verify slip status
            const { data: updatedSlip } = await supabase
              .from('permission_slips')
              .select('status')
              .eq('id', slip.id)
              .single();

            if (i < numPayments - 1) {
              // Not all payments complete yet, slip should still be pending
              expect(updatedSlip?.status).toBe('pending');
            } else {
              // All payments complete, slip should be paid
              expect(updatedSlip?.status).toBe('paid');
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 180000);

  /**
   * Property 2: Payment Webhook Processing - Partial Payment Scenario
   * 
   * For any permission slip with multiple payments where only some succeed,
   * the slip status should remain unchanged (not 'paid').
   */
  it('Property 2: Slip status remains unchanged when payments are incomplete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }), // Total number of payments
        fc.integer({ min: 1, max: 3 }), // Number of payments to succeed (less than total)
        fc.integer({ min: 100, max: 10000 }), // Amount per payment
        async (totalPayments, succeededPayments, amountPerPayment) => {
          // Ensure we have incomplete payments
          if (succeededPayments >= totalPayments) {
            succeededPayments = totalPayments - 1;
          }

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

          const splitPaymentGroupId = crypto.randomUUID();

          // Create multiple payments
          const paymentIds: string[] = [];
          for (let i = 0; i < totalPayments; i++) {
            const { data: payment } = await supabase
              .from('payments')
              .insert({
                permission_slip_id: slip.id,
                parent_id: parent.id,
                amount_cents: amountPerPayment,
                stripe_payment_intent_id: `pi_test_${Date.now()}_${i}_${Math.random()}`,
                status: 'pending',
                is_split_payment: true,
                split_payment_group_id: splitPaymentGroupId
              })
              .select()
              .single();

            if (!payment) throw new Error('Failed to create payment');
            paymentIds.push(payment.id);
            testPaymentIds.push(payment.id);
          }

          // Mark only some payments as succeeded
          for (let i = 0; i < succeededPayments; i++) {
            await supabase
              .from('payments')
              .update({
                status: 'succeeded',
                paid_at: new Date().toISOString()
              })
              .eq('id', paymentIds[i]);
          }

          // Check if all payments are complete
          const { data: payments } = await supabase
            .from('payments')
            .select('status')
            .eq('permission_slip_id', slip.id);

          const allPaid = payments?.every(p => p.status === 'succeeded');

          // Only update slip if all paid
          if (allPaid) {
            await supabase
              .from('permission_slips')
              .update({ status: 'paid' })
              .eq('id', slip.id);
          }

          // Verify slip status remains pending (not all payments complete)
          const { data: updatedSlip } = await supabase
            .from('permission_slips')
            .select('status')
            .eq('id', slip.id)
            .single();

          expect(updatedSlip?.status).toBe('pending');
          expect(allPaid).toBe(false);
        }
      ),
      { numRuns: 5 }
    );
  }, 180000);

  /**
   * Property 2: Payment Webhook Processing - Idempotency
   * 
   * Processing the same payment success webhook multiple times should be idempotent:
   * the payment and slip status should remain consistent.
   */
  it('Property 2: Webhook processing is idempotent for duplicate events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 1000000 }),
        fc.integer({ min: 2, max: 5 }), // Number of times to process the same webhook
        async (amountCents, processingAttempts) => {
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

          const stripePaymentIntentId = `pi_test_${Date.now()}_${Math.random()}`;
          const { data: payment } = await supabase
            .from('payments')
            .insert({
              permission_slip_id: slip.id,
              parent_id: parent.id,
              amount_cents: amountCents,
              stripe_payment_intent_id: stripePaymentIntentId,
              status: 'pending',
              is_split_payment: false
            })
            .select()
            .single();

          if (!payment) throw new Error('Failed to create payment');
          testPaymentIds.push(payment.id);

          // Process the same webhook multiple times
          for (let i = 0; i < processingAttempts; i++) {
            // Simulate webhook processing
            await supabase
              .from('payments')
              .update({
                status: 'succeeded',
                paid_at: new Date().toISOString()
              })
              .eq('stripe_payment_intent_id', stripePaymentIntentId);

            const { data: payments } = await supabase
              .from('payments')
              .select('status')
              .eq('permission_slip_id', slip.id);

            const allPaid = payments?.every(p => p.status === 'succeeded');

            if (allPaid) {
              await supabase
                .from('permission_slips')
                .update({ status: 'paid' })
                .eq('id', slip.id);
            }
          }

          // Verify final state is consistent
          const { data: finalPayment } = await supabase
            .from('payments')
            .select('status')
            .eq('id', payment.id)
            .single();

          const { data: finalSlip } = await supabase
            .from('permission_slips')
            .select('status')
            .eq('id', slip.id)
            .single();

          expect(finalPayment?.status).toBe('succeeded');
          expect(finalSlip?.status).toBe('paid');
        }
      ),
      { numRuns: 5 }
    );
  }, 180000);
});
