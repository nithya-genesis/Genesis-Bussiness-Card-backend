import { prisma } from '../models/prisma.js';

export interface NotificationPayload {
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
  channel?: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'IN_APP';
}

/**
 * In-App & Multi-Channel Notification Service
 */
export class NotificationService {
  public static async send(payload: NotificationPayload): Promise<boolean> {
    const channel = payload.channel || 'IN_APP';
    console.log(`[Notification Dispatcher] [Channel: ${channel}] To: ${payload.recipientEmail || payload.recipientPhone || 'System'} | Subject: "${payload.subject}"`);
    return true;
  }

  public static async notifyProposalSubmitted(
    proposalId: string,
    collegeName: string,
    studentCount: number,
    planName: string,
    amountStr: string,
    dbProposalId?: string
  ): Promise<void> {
    try {
      const managers = await prisma.user.findMany({
        where: {
          role: 'BD_MANAGER',
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      if (managers.length > 0) {
        await prisma.notification.createMany({
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
    } catch (err) {
      console.error('Failed to create manager notification:', err);
    }
  }

  public static async notifyProposalApproved(
    proposalId: string,
    collegeName: string,
    executiveUserId: string,
    dbProposalId?: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: executiveUserId,
          title: 'Proposal Approved',
          message: `Your proposal for ${collegeName} (${proposalId}) has been officially approved.`,
          link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals',
          type: 'PROPOSAL_APPROVED',
          isRead: false,
        },
      });
    } catch (err) {
      console.error('Failed to create executive notification:', err);
    }
  }

  public static async notifyProposalRejected(
    proposalId: string,
    collegeName: string,
    executiveUserId: string,
    reason: string,
    dbProposalId?: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: executiveUserId,
          title: 'Proposal Rejected',
          message: `Proposal for ${collegeName} (${proposalId}) was rejected. Reason: ${reason}`,
          link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals',
          type: 'PROPOSAL_REJECTED',
          isRead: false,
        },
      });
    } catch (err) {
      console.error('Failed to create executive rejection notification:', err);
    }
  }

  public static async notifyCollegeRequestedChanges(
    proposalId: string,
    collegeName: string,
    executiveUserId: string,
    reason: string,
    dbProposalId?: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: executiveUserId,
          title: 'College Requested Changes',
          message: `${collegeName} requested changes on proposal ${proposalId}: "${reason}"`,
          link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals',
          type: 'COLLEGE_MODIFIED',
          isRead: false,
        },
      });
    } catch (err) {
      console.error('Failed to create executive college change notification:', err);
    }
  }

  public static async notifyProposalArchived(
    proposalId: string,
    collegeName: string,
    executiveUserId: string,
    reason?: string,
    dbProposalId?: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: executiveUserId,
          title: 'Proposal Archived',
          message: `Proposal ${proposalId} for ${collegeName} has been archived by the BD Manager.${reason ? ` Reason: ${reason}` : ''}`,
          link: dbProposalId ? `/proposals/${dbProposalId}` : '/proposals',
          type: 'PROPOSAL_ARCHIVED',
          isRead: false,
        },
      });
    } catch (err) {
      console.error('Failed to create executive archive notification:', err);
    }
  }
}

