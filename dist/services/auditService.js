"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = logAuditEvent;
const prisma_js_1 = require("../models/prisma.js");
/**
 * Persists an immutable audit log entry in the system
 */
async function logAuditEvent(params) {
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
        await prisma_js_1.prisma.auditLog.create({
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
    }
    catch (err) {
        console.error('Failed to write audit log:', err);
        // Non-blocking: audit logs should never crash the main transaction
    }
}
