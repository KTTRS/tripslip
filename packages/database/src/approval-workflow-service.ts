/**
 * Approval Workflow Service (Task 13.3)
 * 
 * Implements:
 * - Configurable approval chain system
 * - Multi-level approval routing
 * - Approval delegation functionality
 * - Approval notification system
 * 
 * **Validates: Requirements 11.5, 11.6, 11.7, 11.8, 12.1, 12.2, 12.3, 12.4, 12.6, 12.7, 13.1-13.6**
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// TYPES
// =====================================================

export type ApprovalType = 'sequential' | 'parallel';
export type ApprovalStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'changes_requested';
export type RoutingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type MessageType = 'comment' | 'question' | 'response' | 'change_request' | 'alternative_suggestion';

export interface ApprovalChain {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  
  // Conditions
  min_cost_cents?: number;
  max_cost_cents?: number;
  requires_overnight?: boolean;
  requires_out_of_state?: boolean;
  requires_international?: boolean;
  min_duration_days?: number;
  
  // Configuration
  approval_type: ApprovalType;
  active: boolean;
  priority: number;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ApprovalChainStep {
  id: string;
  chain_id: string;
  step_order: number;
  role_required: string;
  approver_user_id?: string;
  approver_name?: string;
  
  // Delegation
  can_delegate: boolean;
  delegated_to?: string;
  delegated_at?: string;
  delegation_reason?: string;
  
  created_at: string;
}

export interface TripApproval {
  id: string;
  trip_id: string;
  chain_id?: string;
  step_id?: string;
  step_order?: number;
  
  administrator_id: string;
  administrator_name: string;
  
  status: ApprovalStatus;
  decision?: 'approved' | 'rejected';
  comments?: string;
  reason?: string;
  
  reviewed_at?: string;
  changes_requested?: string;
  teacher_response?: string;
  response_at?: string;
  
  delegated_from?: string;
  notification_sent: boolean;
  reminder_sent_at?: string;
  deadline?: string;
  
  created_at: string;
}

export interface TripApprovalRouting {
  id: string;
  trip_id: string;
  chain_id: string;
  
  // Trip characteristics
  trip_cost_cents?: number;
  is_overnight?: boolean;
  is_out_of_state?: boolean;
  is_international?: boolean;
  duration_days?: number;
  
  routing_status: RoutingStatus;
  current_step_order?: number;
  
  routed_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalConversation {
  id: string;
  trip_id: string;
  approval_id?: string;
  
  sender_id: string;
  sender_name: string;
  sender_role: 'teacher' | 'administrator';
  message: string;
  message_type: MessageType;
  
  parent_message_id?: string;
  created_at: string;
}

export interface ApprovalDelegation {
  id: string;
  step_id: string;
  delegated_from: string;
  delegated_to: string;
  reason?: string;
  start_date: string;
  end_date?: string;
  active: boolean;
  created_at: string;
  created_by?: string;
}

export interface CreateApprovalChainInput {
  school_id: string;
  name: string;
  description?: string;
  min_cost_cents?: number;
  max_cost_cents?: number;
  requires_overnight?: boolean;
  requires_out_of_state?: boolean;
  requires_international?: boolean;
  min_duration_days?: number;
  approval_type: ApprovalType;
  priority?: number;
}

export interface CreateApprovalChainStepInput {
  chain_id: string;
  step_order: number;
  role_required: string;
  approver_user_id?: string;
  approver_name?: string;
  can_delegate?: boolean;
}

export interface TripCharacteristics {
  cost_cents?: number;
  is_overnight?: boolean;
  is_out_of_state?: boolean;
  is_international?: boolean;
  duration_days?: number;
}

export interface ApproveInput {
  approval_id: string;
  comments?: string;
}

export interface RejectInput {
  approval_id: string;
  reason: string;
  comments?: string;
}

export interface RequestChangesInput {
  approval_id: string;
  changes_requested: string;
  comments?: string;
}

export interface RespondToChangesInput {
  approval_id: string;
  teacher_response: string;
}

export interface CreateConversationInput {
  trip_id: string;
  approval_id?: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'teacher' | 'administrator';
  message: string;
  message_type: MessageType;
  parent_message_id?: string;
}

export interface CreateDelegationInput {
  step_id: string;
  delegated_from: string;
  delegated_to: string;
  reason?: string;
  end_date?: string;
}

// =====================================================
// SERVICE
// =====================================================

export class ApprovalWorkflowService {
  constructor(private supabase: SupabaseClient) {}

  // =====================================================
  // APPROVAL CHAIN MANAGEMENT
  // =====================================================

  async createApprovalChain(input: CreateApprovalChainInput): Promise<ApprovalChain> {
    const { data, error } = await this.supabase
      .from('approval_chains')
      .insert({
        ...input,
        priority: input.priority ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getApprovalChain(chainId: string): Promise<ApprovalChain | null> {
    const { data, error } = await this.supabase
      .from('approval_chains')
      .select('*')
      .eq('id', chainId)
      .single();

    if (error) throw error;
    return data;
  }

  async getApprovalChainsForSchool(schoolId: string): Promise<ApprovalChain[]> {
    const { data, error } = await this.supabase
      .from('approval_chains')
      .select('*')
      .eq('school_id', schoolId)
      .eq('active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateApprovalChain(chainId: string, updates: Partial<ApprovalChain>): Promise<ApprovalChain> {
    const { data, error } = await this.supabase
      .from('approval_chains')
      .update(updates)
      .eq('id', chainId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deactivateApprovalChain(chainId: string): Promise<void> {
    const { error } = await this.supabase
      .from('approval_chains')
      .update({ active: false })
      .eq('id', chainId);

    if (error) throw error;
  }

  // =====================================================
  // APPROVAL CHAIN STEPS
  // =====================================================

  async createApprovalChainStep(input: CreateApprovalChainStepInput): Promise<ApprovalChainStep> {
    const { data, error } = await this.supabase
      .from('approval_chain_steps')
      .insert({
        ...input,
        can_delegate: input.can_delegate ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getApprovalChainSteps(chainId: string): Promise<ApprovalChainStep[]> {
    const { data, error } = await this.supabase
      .from('approval_chain_steps')
      .select('*')
      .eq('chain_id', chainId)
      .order('step_order');

    if (error) throw error;
    return data || [];
  }

  async updateApprovalChainStep(stepId: string, updates: Partial<ApprovalChainStep>): Promise<ApprovalChainStep> {
    const { data, error } = await this.supabase
      .from('approval_chain_steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteApprovalChainStep(stepId: string): Promise<void> {
    const { error } = await this.supabase
      .from('approval_chain_steps')
      .delete()
      .eq('id', stepId);

    if (error) throw error;
  }

  // =====================================================
  // TRIP APPROVAL ROUTING
  // =====================================================

  async routeTripForApproval(
    tripId: string,
    schoolId: string,
    characteristics: TripCharacteristics
  ): Promise<TripApprovalRouting> {
    // Find the appropriate approval chain
    const { data: chainId, error: chainError } = await this.supabase
      .rpc('get_approval_chain_for_trip', {
        p_trip_id: tripId,
        p_school_id: schoolId,
        p_cost_cents: characteristics.cost_cents || 0,
        p_is_overnight: characteristics.is_overnight || false,
        p_is_out_of_state: characteristics.is_out_of_state || false,
        p_is_international: characteristics.is_international || false,
        p_duration_days: characteristics.duration_days || 1,
      });

    if (chainError) throw chainError;
    if (!chainId) throw new Error('No approval chain found for trip characteristics');

    // Create routing record
    const { data: routing, error: routingError } = await this.supabase
      .from('trip_approval_routing')
      .insert({
        trip_id: tripId,
        chain_id: chainId,
        trip_cost_cents: characteristics.cost_cents,
        is_overnight: characteristics.is_overnight,
        is_out_of_state: characteristics.is_out_of_state,
        is_international: characteristics.is_international,
        duration_days: characteristics.duration_days,
        routing_status: 'pending',
      })
      .select()
      .single();

    if (routingError) throw routingError;

    // Create approval records for each step in the chain
    const { error: approvalsError } = await this.supabase
      .rpc('create_trip_approvals_from_chain', {
        p_trip_id: tripId,
        p_chain_id: chainId,
      });

    if (approvalsError) throw approvalsError;

    // Update routing status to in_progress
    const { data: updatedRouting, error: updateError } = await this.supabase
      .from('trip_approval_routing')
      .update({ routing_status: 'in_progress', current_step_order: 1 })
      .eq('id', routing.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return updatedRouting;
  }

  async getTripApprovalRouting(tripId: string): Promise<TripApprovalRouting | null> {
    const { data, error } = await this.supabase
      .from('trip_approval_routing')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    if (error) throw error;
    return data;
  }

  async getCurrentApproverForTrip(tripId: string): Promise<TripApproval | null> {
    const { data, error } = await this.supabase
      .rpc('get_current_approver_for_trip', {
        p_trip_id: tripId,
      });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Get the full approval record
    const { data: approval, error: approvalError } = await this.supabase
      .from('trip_approvals')
      .select('*')
      .eq('id', data[0].approval_id)
      .single();

    if (approvalError) throw approvalError;
    return approval;
  }

  // =====================================================
  // APPROVAL ACTIONS
  // =====================================================

  async approveTrip(input: ApproveInput): Promise<TripApproval> {
    // Get current approval to check status
    const { data: currentApproval } = await this.supabase
      .from('trip_approvals')
      .select('*')
      .eq('id', input.approval_id)
      .single();

    // Prevent transitions from terminal states
    if (currentApproval?.status === 'approved') {
      throw new Error('Cannot modify an already approved approval');
    }
    if (currentApproval?.status === 'rejected') {
      throw new Error('Cannot approve a rejected approval');
    }

    const { data, error } = await this.supabase
      .from('trip_approvals')
      .update({
        status: 'approved',
        decision: 'approved',
        comments: input.comments,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', input.approval_id)
      .select()
      .single();

    if (error) throw error;

    // Move to next step in the chain
    await this.advanceToNextStep(data.trip_id);

    return data;
  }

  async rejectTrip(input: RejectInput): Promise<TripApproval> {
    // Validate rejection reason is not empty or whitespace-only
    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error('Rejection reason is required and cannot be empty');
    }

    // Get current approval to check status
    const { data: currentApproval } = await this.supabase
      .from('trip_approvals')
      .select('*')
      .eq('id', input.approval_id)
      .single();

    // Prevent transitions from terminal states
    if (currentApproval?.status === 'approved') {
      throw new Error('Cannot reject an already approved approval');
    }
    if (currentApproval?.status === 'rejected') {
      throw new Error('Cannot modify an already rejected approval');
    }

    const { data, error } = await this.supabase
      .from('trip_approvals')
      .update({
        status: 'rejected',
        decision: 'rejected',
        reason: input.reason, // Store as-is, validation already checked it's not empty
        comments: input.comments,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', input.approval_id)
      .select()
      .single();

    if (error) throw error;

    // Mark routing as completed (rejected)
    await this.supabase
      .from('trip_approval_routing')
      .update({
        routing_status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('trip_id', data.trip_id);

    return data;
  }

  async requestChanges(input: RequestChangesInput): Promise<TripApproval> {
    // Get current approval to check status
    const { data: currentApproval } = await this.supabase
      .from('trip_approvals')
      .select('*')
      .eq('id', input.approval_id)
      .single();

    // Prevent transitions from terminal states
    if (currentApproval?.status === 'approved') {
      throw new Error('Cannot request changes for an already approved approval');
    }
    if (currentApproval?.status === 'rejected') {
      throw new Error('Cannot request changes for a rejected approval');
    }

    const { data, error } = await this.supabase
      .from('trip_approvals')
      .update({
        status: 'changes_requested',
        changes_requested: input.changes_requested,
        comments: input.comments,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', input.approval_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async respondToChangeRequest(input: RespondToChangesInput): Promise<TripApproval> {
    const { data, error } = await this.supabase
      .from('trip_approvals')
      .update({
        status: 'under_review',
        teacher_response: input.teacher_response,
        response_at: new Date().toISOString(),
      })
      .eq('id', input.approval_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async advanceToNextStep(tripId: string): Promise<void> {
    // Get current routing
    const routing = await this.getTripApprovalRouting(tripId);
    if (!routing) return;

    // Get the chain
    const chain = await this.getApprovalChain(routing.chain_id);
    if (!chain) return;

    if (chain.approval_type === 'sequential') {
      // For sequential approval, move to next step
      const nextStepOrder = (routing.current_step_order || 0) + 1;

      // Check if there are more steps
      const { data: nextStep } = await this.supabase
        .from('trip_approvals')
        .select('*')
        .eq('trip_id', tripId)
        .eq('step_order', nextStepOrder)
        .single();

      if (nextStep) {
        // Update routing to next step
        await this.supabase
          .from('trip_approval_routing')
          .update({ current_step_order: nextStepOrder })
          .eq('id', routing.id);
      } else {
        // No more steps, mark as completed
        await this.supabase
          .from('trip_approval_routing')
          .update({
            routing_status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', routing.id);
      }
    } else {
      // For parallel approval, check if all approvals are complete
      const { data: pendingApprovals } = await this.supabase
        .from('trip_approvals')
        .select('id')
        .eq('trip_id', tripId)
        .eq('status', 'pending');

      if (!pendingApprovals || pendingApprovals.length === 0) {
        // All approvals complete
        await this.supabase
          .from('trip_approval_routing')
          .update({
            routing_status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', routing.id);
      }
    }
  }

  // =====================================================
  // CONVERSATIONS
  // =====================================================

  async createConversationMessage(input: CreateConversationInput): Promise<ApprovalConversation> {
    const { data, error } = await this.supabase
      .from('approval_conversations')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getConversationThread(tripId: string): Promise<ApprovalConversation[]> {
    const { data, error } = await this.supabase
      .from('approval_conversations')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // DELEGATION
  // =====================================================

  async createDelegation(input: CreateDelegationInput): Promise<ApprovalDelegation> {
    const { data, error } = await this.supabase
      .from('approval_delegations')
      .insert({
        ...input,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Update the step to reflect the delegation
    await this.supabase
      .from('approval_chain_steps')
      .update({
        delegated_to: input.delegated_to,
        delegated_at: new Date().toISOString(),
      })
      .eq('id', input.step_id);

    return data;
  }

  async endDelegation(delegationId: string): Promise<void> {
    const { data: delegation, error: getError } = await this.supabase
      .from('approval_delegations')
      .select('*')
      .eq('id', delegationId)
      .single();

    if (getError) throw getError;

    const { error } = await this.supabase
      .from('approval_delegations')
      .update({
        active: false,
        end_date: new Date().toISOString(),
      })
      .eq('id', delegationId);

    if (error) throw error;

    // Remove delegation from step
    await this.supabase
      .from('approval_chain_steps')
      .update({
        delegated_to: null,
        delegated_at: null,
      })
      .eq('id', delegation.step_id);
  }

  async getActiveDelegationsForUser(userId: string): Promise<ApprovalDelegation[]> {
    const { data, error } = await this.supabase
      .from('approval_delegations')
      .select('*')
      .eq('delegated_to', userId)
      .eq('active', true);

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // QUERIES
  // =====================================================

  async getTripApprovals(tripId: string): Promise<TripApproval[]> {
    const { data, error } = await this.supabase
      .from('trip_approvals')
      .select('*')
      .eq('trip_id', tripId)
      .order('step_order');

    if (error) throw error;
    return data || [];
  }

  async getPendingApprovalsForUser(userId: string): Promise<TripApproval[]> {
    const { data, error } = await this.supabase
      .from('trip_approvals')
      .select('*')
      .eq('administrator_id', userId)
      .eq('status', 'pending')
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async getApprovalById(approvalId: string): Promise<TripApproval | null> {
    const { data, error } = await this.supabase
      .from('trip_approvals')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (error) throw error;
    return data;
  }
}
