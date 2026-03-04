/**
 * Audit Logging Service
 * Tracks admin actions for security and compliance
 * Validates Requirements: 9.5, 19.5
 */

import type { SupabaseClient } from '@tripslip/database';

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'role_assignment' 
  | 'role_removal' 
  | 'role_switch';

export interface AuditLogEntry {
  action: AuditAction;
  table_name: string;
  record_id?: string;
  user_id: string;
  user_role?: string;
  organization_type?: string;
  organization_id?: string;
  metadata?: Record<string, any>;
}

export interface AuditService {
  /**
   * Log an admin action
   */
  logAction(entry: AuditLogEntry): Promise<void>;

  /**
   * Log a create action
   */
  logCreate(
    tableName: string,
    recordId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void>;

  /**
   * Log an update action
   */
  logUpdate(
    tableName: string,
    recordId: string,
    userId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void>;

  /**
   * Log a delete action
   */
  logDelete(
    tableName: string,
    recordId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void>;

  /**
   * Log a role assignment change
   */
  logRoleAssignment(
    userId: string,
    targetUserId: string,
    roleName: string,
    organizationType: string,
    organizationId: string
  ): Promise<void>;

  /**
   * Log a role removal
   */
  logRoleRemoval(
    userId: string,
    targetUserId: string,
    roleName: string,
    organizationType: string,
    organizationId: string
  ): Promise<void>;

  /**
   * Log a role switch
   */
  logRoleSwitch(
    userId: string,
    fromRole: string,
    toRole: string,
    organizationType: string,
    organizationId: string
  ): Promise<void>;
}

/**
 * Implementation of AuditService using Supabase
 */
export class SupabaseAuditService implements AuditService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get current user context from session
   */
  private async getUserContext(): Promise<{
    userId: string;
    userRole?: string;
    organizationType?: string;
    organizationId?: string;
  }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    // Extract role information from JWT claims
    const claims = session.user.app_metadata || {};
    
    return {
      userId: session.user.id,
      userRole: claims.role,
      organizationType: claims.organization_type,
      organizationId: claims.organization_id,
    };
  }

  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await (this.supabase as any)
        .from('audit_logs')
        .insert({
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          user_id: entry.user_id,
          user_role: entry.user_role,
          organization_type: entry.organization_type,
          organization_id: entry.organization_id,
          metadata: entry.metadata || {},
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw - audit logging should not break the main operation
      }
    } catch (err) {
      console.error('Audit logging error:', err);
      // Don't throw - audit logging should not break the main operation
    }
  }

  async logCreate(
    tableName: string,
    recordId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const context = await this.getUserContext();
    
    await this.logAction({
      action: 'create',
      table_name: tableName,
      record_id: recordId,
      user_id: userId,
      user_role: context.userRole,
      organization_type: context.organizationType,
      organization_id: context.organizationId,
      metadata,
    });
  }

  async logUpdate(
    tableName: string,
    recordId: string,
    userId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    const context = await this.getUserContext();
    
    await this.logAction({
      action: 'update',
      table_name: tableName,
      record_id: recordId,
      user_id: userId,
      user_role: context.userRole,
      organization_type: context.organizationType,
      organization_id: context.organizationId,
      metadata: {
        old_values: oldValues,
        new_values: newValues,
      },
    });
  }

  async logDelete(
    tableName: string,
    recordId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const context = await this.getUserContext();
    
    await this.logAction({
      action: 'delete',
      table_name: tableName,
      record_id: recordId,
      user_id: userId,
      user_role: context.userRole,
      organization_type: context.organizationType,
      organization_id: context.organizationId,
      metadata,
    });
  }

  async logRoleAssignment(
    userId: string,
    targetUserId: string,
    roleName: string,
    organizationType: string,
    organizationId: string
  ): Promise<void> {
    const context = await this.getUserContext();
    
    await this.logAction({
      action: 'role_assignment',
      table_name: 'user_role_assignments',
      record_id: targetUserId,
      user_id: userId,
      user_role: context.userRole,
      organization_type: context.organizationType,
      organization_id: context.organizationId,
      metadata: {
        target_user_id: targetUserId,
        role_name: roleName,
        assigned_organization_type: organizationType,
        assigned_organization_id: organizationId,
      },
    });
  }

  async logRoleRemoval(
    userId: string,
    targetUserId: string,
    roleName: string,
    organizationType: string,
    organizationId: string
  ): Promise<void> {
    const context = await this.getUserContext();
    
    await this.logAction({
      action: 'role_removal',
      table_name: 'user_role_assignments',
      record_id: targetUserId,
      user_id: userId,
      user_role: context.userRole,
      organization_type: context.organizationType,
      organization_id: context.organizationId,
      metadata: {
        target_user_id: targetUserId,
        role_name: roleName,
        removed_organization_type: organizationType,
        removed_organization_id: organizationId,
      },
    });
  }

  async logRoleSwitch(
    userId: string,
    fromRole: string,
    toRole: string,
    organizationType: string,
    organizationId: string
  ): Promise<void> {
    await this.logAction({
      action: 'role_switch',
      table_name: 'active_role_context',
      record_id: userId,
      user_id: userId,
      user_role: toRole,
      organization_type: organizationType,
      organization_id: organizationId,
      metadata: {
        from_role: fromRole,
        to_role: toRole,
      },
    });
  }
}

/**
 * Factory function to create an AuditService instance
 */
export function createAuditService(supabase: SupabaseClient): AuditService {
  return new SupabaseAuditService(supabase);
}
