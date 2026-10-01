import { prisma } from '../models/prisma.js';

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entity: 'PROPOSAL' | 'COLLEGE' | 'PLAN' | 'ADDON' | 'USER' | 'SETTING' | 'AUTH' | 'PROGRAM';
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Persists an immutable audit log entry in the system
 */
export async function logAuditEvent(params: CreateAuditLogParams): Promise<void> {
  try {
    const oldValueStr = params.oldValue
      ? typeof params.oldValue === 'string'
        ? params.oldValue
        : JSON.stringify(params.oldValue)
      : null;

    const newValueStr = params.newValue
      ? typeof params.newValue === 'string'
        ? params.newValue
        : JSON.stringify(params.newValue)
      : null;

    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: oldValueStr,
        newValue: newValueStr,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    // Non-blocking: audit logs should never crash the main transaction
  }
}
