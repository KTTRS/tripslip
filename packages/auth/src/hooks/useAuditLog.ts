import { useCallback } from 'react';
import { useAuth } from '../context';
import { createAuditService } from '../audit-service';
import type { AuditAction } from '../audit-service';

export interface UseAuditLogReturn {
  logCreate: (
    tableName: string,
    recordId: string,
    metadata?: Record<string, any>
  ) => Promise<void>;

  logUpdate: (
    tableName: string,
    recordId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ) => Promise<void>;

  logDelete: (
    tableName: string,
    recordId: string,
    metadata?: Record<string, any>
  ) => Promise<void>;

  withAuditLog: <T>(
    action: AuditAction,
    tableName: string,
    recordId: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ) => Promise<T>;
}

export function useAuditLog(): UseAuditLogReturn {
  const { supabaseClient, user } = useAuth();
  const auditService = createAuditService(supabaseClient);

  const logCreate = useCallback(
    async (
      tableName: string,
      recordId: string,
      metadata?: Record<string, any>
    ) => {
      if (!user) return;
      await auditService.logCreate(tableName, recordId, user.id, metadata);
    },
    [auditService, user]
  );

  const logUpdate = useCallback(
    async (
      tableName: string,
      recordId: string,
      oldValues?: Record<string, any>,
      newValues?: Record<string, any>
    ) => {
      if (!user) return;
      await auditService.logUpdate(tableName, recordId, user.id, oldValues, newValues);
    },
    [auditService, user]
  );

  const logDelete = useCallback(
    async (
      tableName: string,
      recordId: string,
      metadata?: Record<string, any>
    ) => {
      if (!user) return;
      await auditService.logDelete(tableName, recordId, user.id, metadata);
    },
    [auditService, user]
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
    [logCreate, logUpdate, logDelete, user]
  );

  return {
    logCreate,
    logUpdate,
    logDelete,
    withAuditLog,
  };
}
