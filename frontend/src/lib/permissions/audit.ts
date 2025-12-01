/**
 * Enterprise Permission System - Audit Logging
 * Track all permission changes for security and compliance
 */
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

import type { PermissionAuditAction, PermissionAuditLog } from './types';

export interface AuditLogEntry {
  action: PermissionAuditAction;
  targetType: 'user' | 'role' | 'permission';
  targetId: string;
  permissionId?: string;
  roleId?: string;
  userId?: string;
  performedBy?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log permission change to audit log
 */
export async function logPermissionChange(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createServiceClient();
    if (!supabase) {
      logger.error('Service client not available for audit logging', {
        component: 'permissions-audit',
        action: 'log_permission_change',
        metadata: entry,
      });
      return;
    }

    const { error } = await supabase.from('permission_audit_log').insert({
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      permission_id: entry.permissionId || null,
      role_id: entry.roleId || null,
      user_id: entry.userId || null,
      performed_by: entry.performedBy || null,
      old_value: entry.oldValue || null,
      new_value: entry.newValue || null,
      metadata: entry.metadata || {},
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
    });

    if (error) {
      logger.error('Failed to log permission change', {
        component: 'permissions-audit',
        action: 'log_permission_change',
        metadata: { entry, error: error.message },
      });
    } else {
      logger.info('Permission change logged', {
        component: 'permissions-audit',
        action: 'log_permission_change',
        metadata: { action: entry.action, targetType: entry.targetType, targetId: entry.targetId },
      });
    }
  } catch (error) {
    logger.error('Unexpected error logging permission change', {
      component: 'permissions-audit',
      action: 'log_permission_change',
      metadata: entry,
    });
  }
}

/**
 * Get audit log entries
 */
export async function getAuditLog(options: {
  userId?: string;
  performedBy?: string;
  action?: PermissionAuditAction;
  limit?: number;
  offset?: number;
}): Promise<PermissionAuditLog[]> {
  try {
    const supabase = await createServiceClient();
    if (!supabase) {
      return [];
    }

    let query = supabase
      .from('permission_audit_log')
      .select('id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at, performed_by, old_value, new_value, metadata, target_type, target_id, permission_id, role_id')
      .order('created_at', { ascending: false });

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.performedBy) {
      query = query.eq('performed_by', options.performedBy);
    }

    if (options.action) {
      query = query.eq('action', options.action);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get audit log', {
        component: 'permissions-audit',
        action: 'get_audit_log',
        metadata: { options, error: error.message },
      });
      return [];
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      action: entry.action as PermissionAuditAction,
      targetType: entry.target_type as 'user' | 'role' | 'permission',
      targetId: entry.target_id,
      permissionId: entry.permission_id,
      roleId: entry.role_id,
      userId: entry.user_id,
      performedBy: entry.performed_by,
      oldValue: entry.old_value,
      newValue: entry.new_value,
      metadata: entry.metadata,
      ipAddress: entry.ip_address,
      userAgent: entry.user_agent,
      createdAt: entry.created_at,
    }));
  } catch (error) {
    logger.error('Unexpected error getting audit log', {
      component: 'permissions-audit',
      action: 'get_audit_log',
      metadata: options,
    });
    return [];
  }
}
