/**
 * useAuditLog Hook
 * Provides audit logging functionality for admin actions
 * Validates Requirements: 9.5, 19.5
 */

import { useCallback } from 'react';
import { createSupabaseClient } from '@tripslip/database';
import { createAuditService } from '../audit-service';
import type { AuditAction } from '../audit-service';

export interface UseAuditLogReturn {
  /**
   * Log a create action
   */
  logCreate: (
    tableName: string,
    recordId: string,
    metadata?: Record<string, any>
  ) => Promise<void>;

  /**
   * Log an update action
   */
  logUpdate: (
    tableName: string,
    recordId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ) => Promise<void>;

  /**
   * Log a delete action
   */
  logDelete: (
    tableName: string,
    recordId: string,
    metadata?: Record<string, any>
  ) => Promise<void>;

  /**
   * Wrap an async function with audit logging
   */
  withAuditLog: <T>(
    action: AuditAction,
    tableName: string,
    recordId: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ) => Promise<T>;
}

/**
 * Hook to access audit logging functionality
 */
export function useAuditLog(): UseAuditLogReturn {
  const supabase = createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  const auditService = createAuditService(supabase);

  const logCreate = useCallback(
    async (
      tableName: string,
      recordId: string,
      metadata?: Record<string, any>
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await auditService.logCreate(tableName, recordId, user.id, metadata);
    },
    [auditService, supabase]
  );

  const logUpdate = useCallback(
    async (
      tableName: string,
      recordId: string,
      oldValues?: Record<string, any>,
      newValues?: Record<string, any>
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await auditService.logUpdate(tableName, recordId, user.id, oldValues, newValues);
    },
    [auditService, supabase]
  );

  const logDelete = useCallback(
    async (
      tableName: string,
      recordId: string,
      metadata?: Record<string, any>
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await auditService.logDelete(tableName, recordId, user.id, metadata);
    },
    [auditService, supabase]
  );

  const withAuditLog = useCallback(
    async <T,>(
      action: AuditAction,
      tableName: string,
      recordId: string,
      fn: () => Promise<T>,
      metadata?: Record<string, any>
    ): Promise<T> => {
      const result = await fn();

      // Log the action after successful execution
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        switch (action) {
          case 'create':
            await logCreate(tableName, recordId, metadata);
            break;
          case 'update':
            await logUpdate(tableName, recordId, metadata?.old_values, metadata?.new_values);
            break;
          case 'delete':
            await logDelete(tableName, recordId, metadata);
            break;
        }
      }

      return result;
    },
    [logCreate, logUpdate, logDelete, supabase]
  );

  return {
    logCreate,
    logUpdate,
    logDelete,
    withAuditLog,
  };
}
