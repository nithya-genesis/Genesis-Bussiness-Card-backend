import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';

export class DashboardController {
  public static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;

      // Base query filters - exclude deleted / archived proposals from active dashboard
      const proposalWhere: any = { isDeleted: false, status: { not: 'ARCHIVED' } };
      const collegeWhere: any = { isDeleted: false };

      const [
        totalColleges,
        totalProposals,
        activeProposals,
        pendingApproval,
        approvedProposals,
        totalVolumeAgg,
        pendingVolumeAgg,
        approvedVolumeAgg,
        proposalsByStatus,
        proposalsByPlan,
        recentProposals,
        recentAuditLogs,
      ] = await Promise.all([
        prisma.college.count({ where: collegeWhere }),
        prisma.proposal.count({ where: proposalWhere }),
        prisma.proposal.count({
          where: {
            ...proposalWhere,
            status: { in: ['SHARED', 'VIEWED', 'MODIFIED_BY_COLLEGE', 'COLLEGE_MODIFIED', 'SUBMITTED', 'PENDING_MANAGER_APPROVAL'] },
          },
        }),
        prisma.proposal.count({
          where: {
            ...proposalWhere,
            status: { in: ['PENDING_MANAGER_APPROVAL', 'SUBMITTED'] },
          },
        }),
        prisma.proposal.count({
          where: { ...proposalWhere, status: 'APPROVED' },
        }),
        prisma.proposal.aggregate({
          _sum: { grandTotal: true },
          where: {
            ...proposalWhere,
            status: { notIn: ['REJECTED', 'EXPIRED'] },
          },
        }),
        prisma.proposal.aggregate({
          _sum: { grandTotal: true },
          where: {
            ...proposalWhere,
            status: { in: ['PENDING_MANAGER_APPROVAL', 'SUBMITTED'] },
          },
        }),
        prisma.proposal.aggregate({
          _sum: { grandTotal: true },
          where: {
            ...proposalWhere,
            status: 'APPROVED',
          },
        }),
        prisma.proposal.groupBy({
          by: ['status'],
          _count: { id: true },
          where: proposalWhere,
        }),
        prisma.proposal.groupBy({
          by: ['planId'],
          _count: { id: true },
          _sum: { grandTotal: true },
          where: proposalWhere,
        }),
        prisma.proposal.findMany({
          where: proposalWhere,
          include: {
            college: { select: { id: true, name: true, city: true } },
            plan: { select: { name: true, totalHours: true } },
            createdBy: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
        prisma.auditLog.findMany({
          include: {
            user: { select: { fullName: true, role: true } },
          },
          orderBy: { timestamp: 'desc' },
          take: 8,
        }),
      ]);

      // Resolve plan names for grouping
      const plans = await prisma.plan.findMany({
        select: { id: true, name: true, code: true },
      });
      const planMap = new Map(plans.map((p) => [p.id, p.name]));

      const planStats = proposalsByPlan.map((p) => ({
        planId: p.planId,
        planName: planMap.get(p.planId) || 'Custom',
        count: p._count.id,
        totalValue: p._sum.grandTotal || 0,
      }));

      const statusMap: Record<string, number> = {
        DRAFT: 0,
        SHARED: 0,
        VIEWED: 0,
        COLLEGE_MODIFIED: 0,
        MODIFIED_BY_COLLEGE: 0,
        PENDING_MANAGER_APPROVAL: 0,
        SUBMITTED: 0,
        APPROVED: 0,
        REJECTED: 0,
        EXPIRED: 0,
      };

      proposalsByStatus.forEach((ps) => {
        statusMap[ps.status] = ps._count.id;
      });

      const totalProposalVolume = totalVolumeAgg._sum.grandTotal || 0;
      const pendingApprovalVolume = pendingVolumeAgg._sum.grandTotal || 0;
      const approvedDealsVolume = approvedVolumeAgg._sum.grandTotal || 0;

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalColleges,
            totalProposals,
            activeProposals,
            pendingApproval,
            approvedProposals,
            totalProposalVolume,
            pendingApprovalVolume,
            approvedDealsVolume,
            totalPipelineValue: totalProposalVolume,
          },
          statusDistribution: statusMap,
          planDistribution: planStats,
          recentProposals,
          recentAuditLogs,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
