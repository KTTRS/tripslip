/**
 * Venue Employee Service
 * 
 * Manages venue employee management using venue_users table
 * - Invite employees to venues
 * - Manage employee roles and permissions
 * - Handle employee activation/deactivation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Types for venue employee management
export type VenueRole = 'administrator' | 'editor' | 'viewer';

export interface VenueEmployee {
  id: string;
  user_id: string;
  venue_id: string;
  role: VenueRole;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  deactivated_at: string | null;
  created_at: string;
}

export interface InviteEmployeeParams {
  venueId: string;
  email: string;
  employeeName: string;
  role: VenueRole;
  invitedBy: string;
}

export interface UpdateEmployeeRoleParams {
  employee_id: string;
  role: VenueRole;
}

interface InvitationData {
  venueId: string;
  email: string;
  employeeName: string;
  role: VenueRole;
  invitedBy: string;
}

interface InvitationStatus {
  id: string;
  email: string;
  employeeName: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  administrator: [
    'venue.read',
    'venue.write', 
    'venue.delete',
    'venue.manage_employees',
    'venue.manage_bookings',
    'venue.view_analytics'
  ],
  editor: [
    'venue.read',
    'venue.write',
    'venue.manage_bookings'
  ],
  viewer: [
    'venue.read'
  ]
} as const;

export class VenueEmployeeService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Invite an employee to a venue (simplified version using venue_users)
   */
  async inviteEmployee(params: InviteEmployeeParams): Promise<{ success: boolean; invitationId?: string; error?: string }> {
    try {
      // For now, create a pending venue_users record
      // In a full implementation, this would create an invitation record first
      const { data: invitation, error } = await this.supabase
        .from('venue_users')
        .insert({
          venue_id: params.venueId,
          user_id: 'pending', // Placeholder until user accepts
          role: params.role,
          invited_by: params.invitedBy,
          invited_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, invitationId: invitation.id };
    } catch (error) {
      return { success: false, error: 'Failed to send invitation' };
    }
  }

  /**
   * Accept an invitation (simplified)
   */
  async acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string; venueId?: string }> {
    try {
      // In a full implementation, this would look up the invitation by token
      // For now, just return success
      return { success: true, venueId: 'venue-id' };
    } catch (error) {
      return { success: false, error: 'Failed to accept invitation' };
    }
  }

  /**
   * Update employee role
   */
  async updateEmployeeRole(params: UpdateEmployeeRoleParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('venue_users')
        .update({ role: params.role })
        .eq('id', params.employee_id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update employee role' };
    }
  }

  /**
   * Deactivate an employee
   */
  async deactivateEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('venue_users')
        .update({ deactivated_at: new Date().toISOString() })
        .eq('id', employeeId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to deactivate employee' };
    }
  }

  /**
   * Reactivate an employee
   */
  async reactivateEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('venue_users')
        .update({ deactivated_at: null })
        .eq('id', employeeId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to reactivate employee' };
    }
  }

  /**
   * Get venue employees
   */
  async getVenueEmployees(venueId: string, includeDeactivated = false): Promise<VenueEmployee[]> {
    try {
      let query = this.supabase
        .from('venue_users')
        .select('*')
        .eq('venue_id', venueId);

      if (!includeDeactivated) {
        query = query.is('deactivated_at', null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(user => ({
        ...user,
        role: user.role as VenueRole
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get venue invitations (alias for compatibility)
   */
  async getVenueInvitations(venueId: string): Promise<InvitationStatus[]> {
    // For now, return pending venue_users as invitations
    try {
      const { data, error } = await this.supabase
        .from('venue_users')
        .select('*')
        .eq('venue_id', venueId)
        .is('accepted_at', null)
        .is('deactivated_at', null);

      if (error) {
        throw error;
      }

      return (data || []).map(user => ({
        id: user.id,
        email: 'pending@example.com', // Placeholder
        employeeName: 'Pending User', // Placeholder
        role: user.role,
        status: 'pending' as const,
        invitedAt: user.invited_at || user.created_at,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedAt: user.accepted_at || undefined
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, venueId: string, permission: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('venue_users')
        .select('role')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .is('deactivated_at', null)
        .single();

      if (error || !data) {
        return false;
      }

      const role = data.role as VenueRole;
      const permissions = ROLE_PERMISSIONS[role] || [];
      return permissions.includes(permission as any);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user permissions for a venue
   */
  async getUserPermissions(userId: string, venueId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('venue_users')
        .select('role')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .is('deactivated_at', null)
        .single();

      if (error || !data) {
        return [];
      }

      const role = data.role as VenueRole;
      return [...(ROLE_PERMISSIONS[role] || [])];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if user is administrator
   */
  async isAdministrator(userId: string, venueId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('venue_users')
        .select('role')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .is('deactivated_at', null)
        .single();

      if (error || !data) {
        return false;
      }

      return data.role === 'administrator';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user role for a venue
   */
  async getUserRole(userId: string, venueId: string): Promise<VenueRole | null> {
    try {
      const { data, error } = await this.supabase
        .from('venue_users')
        .select('role')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .is('deactivated_at', null)
        .single();

      if (error || !data) {
        return null;
      }

      return data.role as VenueRole;
    } catch (error) {
      return null;
    }
  }

  /**
   * Send invitation (legacy method for compatibility)
   */
  async sendInvitation(data: InvitationData): Promise<{ success: boolean; invitationId?: string; error?: string }> {
    return this.inviteEmployee({
      venueId: data.venueId,
      email: data.email,
      employeeName: data.employeeName,
      role: data.role,
      invitedBy: data.invitedBy
    });
  }

  /**
   * Resend invitation (legacy method for compatibility)
   */
  async resendInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    // For now, just return success
    return { success: true };
  }

  /**
   * Cancel invitation (legacy method for compatibility)
   */
  async cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    // For now, just return success
    return { success: true };
  }

  /**
   * Generate invitation token (private helper)
   */
  private generateInvitationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get invitation status (private helper)
   */
  private getInvitationStatus(invitation: any): 'pending' | 'accepted' | 'expired' {
    if (invitation.accepted_at) {
      return 'accepted';
    }
    
    const expiresAt = new Date(invitation.expires_at || Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (expiresAt < new Date()) {
      return 'expired';
    }
    
    return 'pending';
  }
}

/**
 * Factory function to create venue employee service
 */
export function createVenueEmployeeService(supabase: SupabaseClient<Database>): VenueEmployeeService {
  return new VenueEmployeeService(supabase);
}