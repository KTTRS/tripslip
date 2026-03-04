/**
 * Property-Based Tests - Approval Workflow (Task 13.4)
 * 
 * Tests three core properties:
 * - Property 25: Trip Request Routing
 * - Property 27: Approval Status Transition Validity
 * - Property 28: Approval Denial Reason Requirement
 * 
 * **Validates: Requirements 11.5, 11.6, 11.7, 12.7, 12.10, 13.1-13.6**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApprovalWorkflowService, ApprovalStatus } from '../../approval-workflow-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

describe('Property-Based Tests - Approval Workflow (Task 13.4)', () => {
  let supabase: SupabaseClient;
  let approvalService: ApprovalWorkflowService;
  let testSchoolId: string;
  let testVenueId: string;
  let testExperienceId: string;
  let testUserId: string;
  let testTeacherId: string;
  const createdChainIds: string[] = [];
  const createdTripIds: string[] = [];
  const createdApprovalIds: string[] = [];

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    approvalService = new ApprovalWorkflowService(supabase);

    // Generate proper UUIDs for test data
    // Use a timestamp-based approach that fits UUID format
    const timestamp = Date.now().toString(16).padStart(12, '0').slice(-12);
    testUserId = `00000000-0000-0000-0000-${timestamp}`;
    testSchoolId = `00000000-0000-0000-0001-${timestamp}`;
    testTeacherId = `00000000-0000-0000-0002-${timestamp}`;

    // Create test school
    await supabase.from('schools').insert({
      id: testSchoolId,
      name: `Test School ${Date.now()}`,
      district_id: null,
    });

    // Create test venue
    const { data: venue } = await supabase
      .from('venues')
      .insert({
        name: `Test Venue ${Date.now()}`,
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
        description: 'Test experience for approval workflow',
        duration_minutes: 60,
        capacity: 50,
        min_students: 10,
        max_students: 50,
      })
      .select()
      .single();
    testExperienceId = experience!.id;

    // Create test teacher (without user_id since it references auth.users)
    await supabase.from('teachers').insert({
      id: testTeacherId,
      school_id: testSchoolId,
      first_name: 'Test',
      last_name: 'Teacher',
      email: `test${Date.now()}@teacher.com`,
    });
  });

  afterEach(async () => {
    // Clean up created approvals first (foreign key dependencies)
    if (createdApprovalIds.length > 0) {
      await supabase.from('trip_approvals').delete().in('id', createdApprovalIds);
      createdApprovalIds.length = 0;
    }

    // Clean up created trips
    if (createdTripIds.length > 0) {
      await supabase.from('trip_approval_routing').delete().in('trip_id', createdTripIds);
      await supabase.from('trips').delete().in('id', createdTripIds);
      createdTripIds.length = 0;
    }

    // Clean up created chains
    if (createdChainIds.length > 0) {
      await supabase.from('approval_chain_steps').delete().in('chain_id', createdChainIds);
      await supabase.from('approval_chains').delete().in('id', createdChainIds);
      createdChainIds.length = 0;
    }

    // Clean up test data in reverse order of creation (foreign key dependencies)
    if (testTeacherId) {
      await supabase.from('teachers').delete().eq('id', testTeacherId);
      testTeacherId = '';
    }
    if (testExperienceId) {
      await supabase.from('experiences').delete().eq('id', testExperienceId);
      testExperienceId = '';
    }
    if (testVenueId) {
      await supabase.from('venues').delete().eq('id', testVenueId);
      testVenueId = '';
    }
    if (testSchoolId) {
      await supabase.from('schools').delete().eq('id', testSchoolId);
      testSchoolId = '';
    }
  });

  /**
   * Property 25: Trip Request Routing
   * 
   * For any submitted trip request, it SHALL be routed to all administrators 
   * whose approval is required based on the configured approval chain rules 
   * for that trip type, cost, and characteristics.
   * 
   * **Validates: Requirements 11.5, 11.6, 11.7, 13.1-13.6**
   */
  it('Property 25: Trip is routed to all required approvers based on chain configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          costCents: fc.integer({ min: 1000, max: 100000 }),
          isOvernight: fc.boolean(),
          isOutOfState: fc.boolean(),
          durationDays: fc.integer({ min: 1, max: 7 }),
          numApprovers: fc.integer({ min: 1, max: 4 }),
        }),
        async (tripData) => {
          // Create an approval chain
          const chain = await approvalService.createApprovalChain({
            school_id: testSchoolId,
            name: `Test Chain ${Date.now()}`,
            min_cost_cents: 0,
            max_cost_cents: 200000,
            approval_type: 'sequential',
            priority: 1,
          });
          createdChainIds.push(chain.id);

          // Create approval steps (without approver_user_id since it references auth.users)
          const stepIds: string[] = [];
          for (let i = 0; i < tripData.numApprovers; i++) {
            const step = await approvalService.createApprovalChainStep({
              chain_id: chain.id,
              step_order: i + 1,
              role_required: `approver_${i + 1}`,
              approver_name: `Approver ${i + 1}`,
            });
            stepIds.push(step.id);
          }

          // Create a trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          // Route the trip for approval
          let routing;
          try {
            routing = await approvalService.routeTripForApproval(
              trip!.id,
              testSchoolId,
              {
                cost_cents: tripData.costCents,
                is_overnight: tripData.isOvernight,
                is_out_of_state: tripData.isOutOfState,
                duration_days: tripData.durationDays,
              }
            );
          } catch (error) {
            console.error('Routing error:', error);
            throw error;
          }

          // Property: Trip should be routed to the correct chain
          expect(routing.chain_id).toBe(chain.id);

          // Property: Approval records should be created for all steps
          const approvals = await approvalService.getTripApprovals(trip!.id);
          expect(approvals).toHaveLength(tripData.numApprovers);

          // Property: Each approval should have the correct step order
          for (let i = 0; i < tripData.numApprovers; i++) {
            expect(approvals[i].step_order).toBe(i + 1);
            expect(approvals[i].chain_id).toBe(chain.id);
            createdApprovalIds.push(approvals[i].id);
          }

          // Property: All approvals should start in pending status
          for (const approval of approvals) {
            expect(approval.status).toBe('pending');
          }

          // Clean up for this iteration (in correct order)
          await supabase.from('trip_approvals').delete().eq('trip_id', trip!.id);
          await supabase.from('trip_approval_routing').delete().eq('trip_id', trip!.id);
          await supabase.from('trips').delete().eq('id', trip!.id);
          await supabase.from('approval_chain_steps').delete().eq('chain_id', chain.id);
          await supabase.from('approval_chains').delete().eq('id', chain.id);
          
          // Remove from tracking arrays
          const chainIndex = createdChainIds.indexOf(chain.id);
          if (chainIndex > -1) createdChainIds.splice(chainIndex, 1);
          const tripIndex = createdTripIds.indexOf(trip!.id);
          if (tripIndex > -1) createdTripIds.splice(tripIndex, 1);
        }
      ),
      { numRuns: 50 }
    );
  }, 180000);

  /**
   * Property 25: Trip routing respects cost thresholds
   * 
   * For any trip with a specific cost, it SHALL be routed to the approval chain 
   * that matches its cost range.
   * 
   * **Validates: Requirements 11.5, 13.4**
   */
  it('Property 25: Trip routing respects cost thresholds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 100000 }),
        async (tripCost) => {
          // Create two approval chains with different cost ranges
          const lowCostChain = await approvalService.createApprovalChain({
            school_id: testSchoolId,
            name: `Low Cost Chain ${Date.now()}`,
            min_cost_cents: 0,
            max_cost_cents: 50000,
            approval_type: 'sequential',
            priority: 2,
          });
          createdChainIds.push(lowCostChain.id);

          const highCostChain = await approvalService.createApprovalChain({
            school_id: testSchoolId,
            name: `High Cost Chain ${Date.now()}`,
            min_cost_cents: 50001,
            max_cost_cents: 200000,
            approval_type: 'sequential',
            priority: 1,
          });
          createdChainIds.push(highCostChain.id);

          // Create steps for both chains (without approver_user_id)
          await approvalService.createApprovalChainStep({
            chain_id: lowCostChain.id,
            step_order: 1,
            role_required: 'principal',
            approver_name: 'Principal',
          });

          await approvalService.createApprovalChainStep({
            chain_id: highCostChain.id,
            step_order: 1,
            role_required: 'district_admin',
            approver_name: 'District Admin',
          });

          // Create a trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          // Route the trip
          const routing = await approvalService.routeTripForApproval(
            trip!.id,
            testSchoolId,
            { cost_cents: tripCost }
          );

          // Property: Trip should be routed to the correct chain based on cost
          if (tripCost <= 50000) {
            expect(routing.chain_id).toBe(lowCostChain.id);
          } else {
            expect(routing.chain_id).toBe(highCostChain.id);
          }

          const approvals = await approvalService.getTripApprovals(trip!.id);
          for (const approval of approvals) {
            createdApprovalIds.push(approval.id);
          }

          // Clean up for this iteration (in correct order)
          await supabase.from('trip_approvals').delete().eq('trip_id', trip!.id);
          await supabase.from('trip_approval_routing').delete().eq('trip_id', trip!.id);
          await supabase.from('trips').delete().eq('id', trip!.id);
          await supabase.from('approval_chain_steps').delete().eq('chain_id', lowCostChain.id);
          await supabase.from('approval_chain_steps').delete().eq('chain_id', highCostChain.id);
          await supabase.from('approval_chains').delete().eq('id', lowCostChain.id);
          await supabase.from('approval_chains').delete().eq('id', highCostChain.id);
          
          // Remove from tracking arrays
          const lowChainIndex = createdChainIds.indexOf(lowCostChain.id);
          if (lowChainIndex > -1) createdChainIds.splice(lowChainIndex, 1);
          const highChainIndex = createdChainIds.indexOf(highCostChain.id);
          if (highChainIndex > -1) createdChainIds.splice(highChainIndex, 1);
          const tripIndex = createdTripIds.indexOf(trip!.id);
          if (tripIndex > -1) createdTripIds.splice(tripIndex, 1);
        }
      ),
      { numRuns: 50 }
    );
  }, 180000);

  /**
   * Property 27: Approval Status Transition Validity
   * 
   * For any trip approval, status transitions SHALL follow valid state machine rules:
   * - pending → under_review → approved/rejected
   * - pending → approved/rejected
   * - pending → changes_requested → under_review → approved/rejected
   * 
   * And once approved or rejected, the status SHALL NOT transition back to pending.
   * 
   * **Validates: Requirements 12.10**
   */
  it('Property 27: Valid status transitions are allowed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          ['pending', 'approved'] as ApprovalStatus[],
          ['pending', 'rejected'] as ApprovalStatus[],
          ['pending', 'under_review', 'approved'] as ApprovalStatus[],
          ['pending', 'changes_requested', 'under_review', 'approved'] as ApprovalStatus[]
        ),
        async (statusSequence) => {
          // Create a simple approval chain
          const chain = await approvalService.createApprovalChain({
            school_id: testSchoolId,
            name: `Test Chain ${Date.now()}`,
            approval_type: 'sequential',
            priority: 1,
          });
          createdChainIds.push(chain.id);

          const step = await approvalService.createApprovalChainStep({
            chain_id: chain.id,
            step_order: 1,
            role_required: 'principal',
            approver_name: 'Principal',
          });

          // Create a trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          // Route the trip
          await approvalService.routeTripForApproval(trip!.id, testSchoolId, {});

          // Get the approval
          const approvals = await approvalService.getTripApprovals(trip!.id);
          let approval = approvals[0];
          createdApprovalIds.push(approval.id);

          // Property: Should start in pending status
          expect(approval.status).toBe('pending');

          // Execute the status sequence
          for (let i = 1; i < statusSequence.length; i++) {
            const targetStatus = statusSequence[i];

            if (targetStatus === 'approved') {
              approval = await approvalService.approveTrip({
                approval_id: approval.id,
                comments: 'Approved',
              });
            } else if (targetStatus === 'rejected') {
              approval = await approvalService.rejectTrip({
                approval_id: approval.id,
                reason: 'Rejected for testing',
                comments: 'Test rejection',
              });
            } else if (targetStatus === 'changes_requested') {
              approval = await approvalService.requestChanges({
                approval_id: approval.id,
                changes_requested: 'Please provide more details',
              });
            } else if (targetStatus === 'under_review') {
              if (statusSequence[i - 1] === 'changes_requested') {
                approval = await approvalService.respondToChangeRequest({
                  approval_id: approval.id,
                  teacher_response: 'Here are the details',
                });
              } else {
                // Manually update to under_review
                const { data } = await supabase
                  .from('trip_approvals')
                  .update({ status: 'under_review' })
                  .eq('id', approval.id)
                  .select()
                  .single();
                approval = data!;
              }
            }

            // Property: Status should match the target
            expect(approval.status).toBe(targetStatus);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 180000);

  /**
   * Property 27: Approved status cannot transition to other states
   * 
   * For any approval in 'approved' status, attempting to transition to any 
   * other status SHALL be rejected or have no effect.
   * 
   * **Validates: Requirements 12.10**
   */
  it('Property 27: Approved status cannot transition to other states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (reason) => {
          // Create a simple approval chain
          const chain = await approvalService.createApprovalChain({
            school_id: testSchoolId,
            name: `Test Chain ${Date.now()}`,
            approval_type: 'sequential',
            priority: 1,
          });
          createdChainIds.push(chain.id);

          await approvalService.createApprovalChainStep({
            chain_id: chain.id,
            step_order: 1,
            role_required: 'principal',
            
            approver_name: 'Principal',
          });

          // Create and route a trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          await approvalService.routeTripForApproval(trip!.id, testSchoolId, {});

          // Get and approve the approval
          const approvals = await approvalService.getTripApprovals(trip!.id);
          let approval = approvals[0];
          createdApprovalIds.push(approval.id);

          approval = await approvalService.approveTrip({
            approval_id: approval.id,
            comments: 'Approved',
          });

          expect(approval.status).toBe('approved');

          // Property: Attempting to reject an approved approval should fail or have no effect
          try {
            const result = await approvalService.rejectTrip({
              approval_id: approval.id,
              reason: reason,
            });
            // If it doesn't throw, status should still be approved
            expect(result.status).toBe('approved');
          } catch (error) {
            // If it throws, that's also acceptable
            expect(error).toBeDefined();
          }

          // Verify the approval is still approved
          const finalApproval = await approvalService.getApprovalById(approval.id);
          expect(finalApproval!.status).toBe('approved');
        }
      ),
      { numRuns: 20 }
    );
  }, 180000);

  /**
   * Property 28: Approval Denial Reason Requirement
   * 
   * For any trip approval that is denied, a rejection reason SHALL be required 
   * and SHALL NOT be empty.
   * 
   * **Validates: Requirements 12.7**
   */
  it('Property 28: Rejection requires a non-empty reason', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        async (reason) => {
          // Create a simple approval chain
          const chain = await approvalService.createApprovalChain({
            school_id: testSchoolId,
            name: `Test Chain ${Date.now()}`,
            approval_type: 'sequential',
            priority: 1,
          });
          createdChainIds.push(chain.id);

          await approvalService.createApprovalChainStep({
            chain_id: chain.id,
            step_order: 1,
            role_required: 'principal',
            
            approver_name: 'Principal',
          });

          // Create and route a trip
          const { data: trip } = await supabase
            .from('trips')
            .insert({
              experience_id: testExperienceId,
              teacher_id: testTeacherId,
              trip_date: '2024-06-15',
              status: 'pending',
            })
            .select()
            .single();

          createdTripIds.push(trip!.id);

          await approvalService.routeTripForApproval(trip!.id, testSchoolId, {});

          // Get the approval
          const approvals = await approvalService.getTripApprovals(trip!.id);
          const approval = approvals[0];
          createdApprovalIds.push(approval.id);

          // Reject with the provided reason
          const rejectedApproval = await approvalService.rejectTrip({
            approval_id: approval.id,
            reason: reason,
          });

          // Property: Rejection reason should be set and not empty
          expect(rejectedApproval.reason).toBeDefined();
          expect(rejectedApproval.reason).toBe(reason);
          expect(rejectedApproval.reason!.length).toBeGreaterThan(0);

          // Property: Status should be rejected
          expect(rejectedApproval.status).toBe('rejected');
          expect(rejectedApproval.decision).toBe('rejected');
        }
      ),
      { numRuns: 20 }
    );
  }, 180000);

  /**
   * Property 28: Rejection with empty reason should fail
   * 
   * For any trip approval rejection attempt with an empty reason, 
   * the operation SHALL fail.
   * 
   * **Validates: Requirements 12.7**
   */
  it('Property 28: Rejection with empty reason should fail', async () => {
    // Create a simple approval chain
    const chain = await approvalService.createApprovalChain({
      school_id: testSchoolId,
      name: `Test Chain ${Date.now()}`,
      approval_type: 'sequential',
      priority: 1,
    });
    createdChainIds.push(chain.id);

    await approvalService.createApprovalChainStep({
      chain_id: chain.id,
      step_order: 1,
      role_required: 'principal',
      
      approver_name: 'Principal',
    });

    // Create and route a trip
    const { data: trip } = await supabase
      .from('trips')
      .insert({
        experience_id: testExperienceId,
              teacher_id: testTeacherId,
        trip_date: '2024-06-15',
        status: 'pending',
      })
      .select()
      .single();

    createdTripIds.push(trip!.id);

    await approvalService.routeTripForApproval(trip!.id, testSchoolId, {});

    // Get the approval
    const approvals = await approvalService.getTripApprovals(trip!.id);
    const approval = approvals[0];
    createdApprovalIds.push(approval.id);

    // Property: Attempting to reject with empty reason should fail
    // Note: This test assumes the service validates the reason
    // If validation is at the database level, this will throw an error
    try {
      await approvalService.rejectTrip({
        approval_id: approval.id,
        reason: '',
      });
      // If it doesn't throw, we should check that the approval wasn't actually rejected
      const finalApproval = await approvalService.getApprovalById(approval.id);
      expect(finalApproval!.status).not.toBe('rejected');
    } catch (error) {
      // If it throws, that's the expected behavior
      expect(error).toBeDefined();
    }
  }, 180000);
});
