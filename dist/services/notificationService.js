"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_js_1 = require("../models/prisma.js");
/**
 * In-App & Multi-Channel Notification Service
 */
class NotificationService {
    static async send(payload) {
        const channel = payload.channel || 'IN_APP';
        console.log(`[Notification Dispatcher] [Channel: ${channel}] To: ${payload.recipientEmail || payload.recipientPhone || 'System'} | Subject: "${payload.subject}"`);
        return true;
    }
    static async notifyProposalSubmitted(proposalId, collegeName, studentCount, planName, amountStr, dbProposalId) {
        try {
            const managers = await prisma_js_1.prisma.user.findMany({
                where: {
                    role: 'BD_MANAGER',
                    status: 'ACTIVE',
                },
                select: { id: true },
            });
            if (managers.length > 0) {
                await prisma_js_1.prisma.notification.createMany({
                    data: managers.map((manager) => ({
                        userId: manager.id,
                        title: 'New Proposal Awaiting Approval',
                        message: `${collegeName} submitted proposal ${proposalId} (${studentCount} students, ${planName}, Grand Total ${amountStr})`,
                        link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals/pending-approval',
                        type: 'PROPOSAL_SUBMITTED',
                        isRead: false,
                    })),
                });
            }
        }
        catch (err) {
            console.error('Failed to create manager notification:', err);
        }
    }
    static async notifyProposalApproved(proposalId, collegeName, executiveUserId, dbProposalId) {
        try {
            await prisma_js_1.prisma.notification.create({
                data: {
                    userId: executiveUserId,
                    title: 'Proposal Approved',
                    message: `Your proposal for ${collegeName} (${proposalId}) has been officially approved.`,
                    link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals',
                    type: 'PROPOSAL_APPROVED',
                    isRead: false,
                },
            });
        }
        catch (err) {
            console.error('Failed to create executive notification:', err);
        }
    }
    static async notifyProposalRejected(proposalId, collegeName, executiveUserId, reason, dbProposalId) {
        try {
            await prisma_js_1.prisma.notification.create({
                data: {
                    userId: executiveUserId,
                    title: 'Proposal Rejected',
                    message: `Proposal for ${collegeName} (${proposalId}) was rejected. Reason: ${reason}`,
                    link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals',
                    type: 'PROPOSAL_REJECTED',
                    isRead: false,
                },
            });
        }
        catch (err) {
            console.error('Failed to create executive rejection notification:', err);
        }
    }
    static async notifyCollegeRequestedChanges(proposalId, collegeName, executiveUserId, reason, dbProposalId) {
        try {
            await prisma_js_1.prisma.notification.create({
                data: {
                    userId: executiveUserId,
                    title: 'College Requested Changes',
                    message: `${collegeName} requested changes on proposal ${proposalId}: "${reason}"`,
                    link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals',
                    type: 'COLLEGE_MODIFIED',
                    isRead: false,
                },
            });
        }
        catch (err) {
            console.error('Failed to create executive college change notification:', err);
        }
    }
    static async notifyProposalArchived(proposalId, collegeName, executiveUserId, reason, dbProposalId) {
        try {
            await prisma_js_1.prisma.notification.create({
                data: {
                    userId: executiveUserId,
                    title: 'Proposal Archived',
                    message: `Proposal ${proposalId} for ${collegeName} has been archived by the BD Manager.${reason ? ` Reason: ${reason}` : ''}`,
                    link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals',
                    type: 'PROPOSAL_ARCHIVED',
                    isRead: false,
                },
            });
        }
        catch (err) {
            console.error('Failed to create executive archive notification:', err);
        }
    }
}
exports.NotificationService = NotificationService;
