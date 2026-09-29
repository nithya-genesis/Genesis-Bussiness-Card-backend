import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';
import { collegeModifyProposalSchema } from '../validators/index.js';
import { calculateProposalPricing } from '../services/pricingEngine.js';
import { logAuditEvent } from '../services/auditService.js';
import { NotificationService } from '../services/notificationService.js';
import { PDFService } from '../pdf/pdfService.js';
import { formatINR } from '../utils/currency.js';

export class PublicProposalController {
  /**
   * Resolves a public proposal by its cryptographic token
   */
  public static async getByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = String(req.params.token);

      const proposal = await prisma.proposal.findUnique({
        where: { publicToken: token },
        include: {
          college: {
            select: {
              name: true,
              placementOfficerName: true,
              placementOfficerEmail: true,
              placementOfficerPhone: true,
              address: true,
              city: true,
              state: true,
              pincode: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              totalHours: true,
              modules: {
                select: { name: true, hours: true, displayOrder: true },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
          addons: {
            select: {
              addonId: true,
              nameSnapshot: true,
              pricingTypeSnapshot: true,
              priceSnapshot: true,
              calculatedCost: true,
            },
          },
        },
      });

      if (!proposal || proposal.isDeleted || proposal.status === 'ARCHIVED') {
        res.status(404).json({
          success: false,
          message: 'Proposal Unavailable. This proposal is no longer active.',
          code: 'PROPOSAL_UNAVAILABLE',
        });
        return;
      }

      // Check Expiration
      const isExpired = new Date() > new Date(proposal.tokenExpiresAt);
      if (isExpired && proposal.status !== 'APPROVED') {
        if (proposal.status !== 'EXPIRED') {
          await prisma.proposal.update({
            where: { id: proposal.id },
            data: { status: 'EXPIRED' },
          });
        }
      }

      // Track VIEWED transition
      if (proposal.status === 'SHARED' || proposal.status === 'DRAFT') {
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: { status: 'VIEWED' },
        });

        await logAuditEvent({
          userId: null,
          action: 'PROPOSAL_VIEWED',
          entity: 'PROPOSAL',
          entityId: proposal.id,
          newValue: { viewedAt: new Date() },
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || undefined,
        });
      }

      // Fetch all available active add-ons so the college can toggle additions
      const availableAddons = await prisma.addon.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          pricingType: true,
          price: true,
        },
        orderBy: { name: 'asc' },
      });

      const subtotal = proposal.subtotal || (proposal.baseTrainingCost + proposal.addonsTotalCost + proposal.customItemsTotalCost);
      let discountAmount = 0;
      if (proposal.discountValue > 0) {
        if (proposal.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * proposal.discountValue) / 100;
        } else {
          discountAmount = proposal.discountValue;
        }
      }
      const taxableAmount = proposal.taxableAmount || Math.max(0, subtotal - discountAmount);
      const costPerStudentBeforeGst = proposal.studentCount > 0 ? Math.round((taxableAmount / proposal.studentCount) * 100) / 100 : 0;
      const gstRate = proposal.gstRate || 18.0;
      const gstAmount = proposal.gstAmount || Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
      const gstPerStudent = proposal.studentCount > 0 ? Math.round((gstAmount / proposal.studentCount) * 100) / 100 : 0;
      const grandTotal = proposal.grandTotal || (taxableAmount + gstAmount);
      const finalCostPerStudent = proposal.studentCount > 0 ? Math.round((grandTotal / proposal.studentCount) * 100) / 100 : 0;

      // Parse custom programs data if present
      let customPrograms = undefined;
      if (proposal.customProgramsData) {
        try {
          customPrograms = JSON.parse(proposal.customProgramsData);
        } catch {
          // ignore
        }
      }

      // Fetch custom items
      const customItems = await prisma.proposalCustomItem.findMany({
        where: { proposalId: proposal.id },
      });

      res.status(200).json({
        success: true,
        data: {
          id: proposal.id,
          proposalId: proposal.proposalId,
          publicToken: proposal.publicToken,
          status: proposal.status,
          currentVersion: proposal.currentVersion,
          tokenExpiresAt: proposal.tokenExpiresAt,
          createdAt: proposal.createdAt,
          college: proposal.college,
          plan: proposal.plan,
          customPrograms,
          studentCount: proposal.studentCount,
          minStudents: proposal.minStudents,
          maxStudents: proposal.maxStudents,
          totalHours: proposal.totalHours,
          hourlyRate: proposal.hourlyRateSnapshot,
          baseTrainingCost: proposal.baseTrainingCost,
          selectedAddons: proposal.addons,
          availableAddons,
          addonsTotalCost: proposal.addonsTotalCost,
          customItems,
          customItemsTotalCost: proposal.customItemsTotalCost,
          subtotal,
          discountValue: proposal.discountValue,
          discountType: proposal.discountType,
          discountAmount,
          taxableAmount,
          costPerStudentBeforeGst,
          gstRate,
          gstAmount,
          gstPerStudent,
          grandTotal,
          finalCostPerStudent,
          finalTotal: grandTotal,
          currency: proposal.currency,
          collegeNotes: proposal.collegeNotes,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Allows college to modify only permitted parameters (studentCount within bounds, selectedAddons)
   */
  public static async modify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = String(req.params.token);
      const validated = collegeModifyProposalSchema.parse(req.body);

      const proposal = await prisma.proposal.findUnique({
        where: { publicToken: token },
        include: {
          college: true,
          plan: { include: { modules: true } },
          addons: true,
          customItems: true,
        },
      });

      if (!proposal || proposal.isDeleted || proposal.status === 'ARCHIVED') {
        res.status(404).json({ success: false, message: 'Proposal Unavailable. This proposal is no longer active.' });
        return;
      }

      if (proposal.status === 'APPROVED') {
        res.status(400).json({
          success: false,
          message: 'This proposal has already been finalized and approved. No further modifications are permitted.',
          code: 'PROPOSAL_FINALIZED',
        });
        return;
      }

      if (new Date() > new Date(proposal.tokenExpiresAt)) {
        res.status(400).json({
          success: false,
          message: 'This proposal link has expired. Please contact your Genesis BD representative for a renewal.',
          code: 'PROPOSAL_EXPIRED',
        });
        return;
      }

      // Validate student count bounds
      if (validated.studentCount < proposal.minStudents) {
        res.status(400).json({
          success: false,
          message: `Student count cannot be lower than the agreed minimum of ${proposal.minStudents} students.`,
          code: 'MIN_STUDENTS_VIOLATION',
        });
        return;
      }

      if (validated.studentCount > proposal.maxStudents) {
        res.status(400).json({
          success: false,
          message: `Student count cannot exceed maximum batch limit of ${proposal.maxStudents} students.`,
          code: 'MAX_STUDENTS_VIOLATION',
        });
        return;
      }

      // Parse custom programs if custom plan
      let customPrograms = undefined;
      if (proposal.customProgramsData) {
        try {
          customPrograms = JSON.parse(proposal.customProgramsData);
        } catch {
          // ignore
        }
      }

      // Perform strict server-side calculation using preserved proposal snapshot rate
      const calculated = await calculateProposalPricing({
        planId: proposal.planId,
        studentCount: validated.studentCount,
        hourlyRate: proposal.hourlyRateSnapshot,
        pricingModel: proposal.pricingModelSnapshot as any,
        selectedAddonIds: validated.selectedAddonIds,
        customPrograms,
        customItems: proposal.customItems.map((ci) => ({
          name: ci.name,
          description: ci.description || undefined,
          quantity: ci.quantity,
          pricingType: ci.pricingType as any,
          unitPrice: ci.unitPrice,
        })),
        discountType: proposal.discountType as any,
        discountValue: proposal.discountValue,
      });

      // Update addons
      await prisma.proposalAddon.deleteMany({ where: { proposalId: proposal.id } });
      await prisma.proposalAddon.createMany({
        data: calculated.addons.map((a) => ({
          proposalId: proposal.id,
          addonId: a.addonId,
          nameSnapshot: a.name,
          pricingTypeSnapshot: a.pricingType,
          priceSnapshot: a.price,
          calculatedCost: a.calculatedCost,
        })),
      });

      // Update custom items
      if (calculated.customItems && calculated.customItems.length > 0) {
        await prisma.proposalCustomItem.deleteMany({ where: { proposalId: proposal.id } });
        await prisma.proposalCustomItem.createMany({
          data: calculated.customItems.map((ci) => ({
            proposalId: proposal.id,
            name: ci.name,
            description: ci.description || null,
            quantity: ci.quantity,
            pricingType: ci.pricingType,
            unitPrice: ci.unitPrice,
            calculatedCost: ci.calculatedCost,
          })),
        });
      }

      const nextVersion = proposal.currentVersion + 1;
      const nextStatus = proposal.status === 'PENDING_MANAGER_APPROVAL' || proposal.status === 'SUBMITTED'
        ? proposal.status
        : 'COLLEGE_MODIFIED';

      const updated = await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          studentCount: validated.studentCount,
          baseTrainingCost: calculated.baseTrainingCost,
          addonsTotalCost: calculated.addonsTotalCost,
          customItemsTotalCost: calculated.customItemsTotalCost,
          subtotal: calculated.subtotal,
          taxableAmount: calculated.taxableAmount,
          gstRate: calculated.gstRate,
          gstAmount: calculated.gstAmount,
          grandTotal: calculated.grandTotal,
          finalTotal: calculated.finalTotal,
          collegeNotes: validated.collegeNotes || proposal.collegeNotes,
          status: nextStatus,
          currentVersion: nextVersion,
        },
        include: {
          college: true,
          plan: { include: { modules: true } },
          addons: true,
          customItems: true,
        },
      });

      await prisma.proposalVersion.create({
        data: {
          proposalId: proposal.id,
          versionNumber: nextVersion,
          snapshotData: JSON.stringify(updated),
          changedByRole: 'COLLEGE',
          changeSummary: `College adjusted enrollment to ${validated.studentCount} students & updated add-ons. Recalculated Grand Total: ${formatINR(calculated.grandTotal)}`,
          calculatedTotal: calculated.grandTotal,
        },
      });

      await logAuditEvent({
        userId: null,
        action: 'COLLEGE_MODIFIED',
        entity: 'PROPOSAL',
        entityId: proposal.id,
        oldValue: { studentCount: proposal.studentCount, grandTotal: proposal.grandTotal || proposal.finalTotal },
        newValue: { studentCount: updated.studentCount, grandTotal: updated.grandTotal, version: nextVersion },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Proposal successfully updated with server-calculated pricing and GST',
        data: {
          studentCount: updated.studentCount,
          baseTrainingCost: updated.baseTrainingCost,
          addonsTotalCost: updated.addonsTotalCost,
          customItemsTotalCost: updated.customItemsTotalCost,
          subtotal: updated.subtotal,
          taxableAmount: updated.taxableAmount,
          costPerStudentBeforeGst: calculated.costPerStudentBeforeGst,
          gstRate: updated.gstRate,
          gstAmount: updated.gstAmount,
          gstPerStudent: calculated.gstPerStudent,
          grandTotal: updated.grandTotal,
          finalCostPerStudent: calculated.finalCostPerStudent,
          finalTotal: updated.finalTotal,
          selectedAddons: updated.addons,
          customItems: updated.customItems,
          status: updated.status,
          currentVersion: updated.currentVersion,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Final submission by college -> sets PENDING_MANAGER_APPROVAL and creates manager notification
   */
  public static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = String(req.params.token);
      const { collegeNotes } = req.body || {};

      const proposal = await prisma.proposal.findUnique({
        where: { publicToken: token },
        include: { college: true, plan: true },
      });

      if (!proposal || proposal.isDeleted || proposal.status === 'ARCHIVED') {
        res.status(404).json({ success: false, message: 'Proposal Unavailable. This proposal is no longer active.' });
        return;
      }

      if (proposal.status === 'APPROVED') {
        res.status(400).json({ success: false, message: 'Proposal already approved' });
        return;
      }

      if (new Date() > new Date(proposal.tokenExpiresAt)) {
        res.status(400).json({ success: false, message: 'Proposal link has expired' });
        return;
      }

      const nextVersion = proposal.currentVersion + 1;

      const updated = await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          status: 'PENDING_MANAGER_APPROVAL',
          submittedAt: new Date(),
          collegeNotes: collegeNotes || proposal.collegeNotes,
          currentVersion: nextVersion,
        },
        include: { college: true, plan: true },
      });

      await prisma.proposalVersion.create({
        data: {
          proposalId: proposal.id,
          versionNumber: nextVersion,
          snapshotData: JSON.stringify(updated),
          changedByRole: 'COLLEGE',
          changeSummary: `College confirmed sizing & submitted proposal for Manager sign-off (${updated.studentCount} students, Grand Total: ${formatINR(updated.grandTotal)})`,
          calculatedTotal: updated.grandTotal,
        },
      });

      await logAuditEvent({
        userId: null,
        action: 'PROPOSAL_SUBMITTED',
        entity: 'PROPOSAL',
        entityId: proposal.id,
        newValue: { submittedAt: updated.submittedAt, grandTotal: updated.grandTotal || updated.finalTotal },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

      await NotificationService.notifyProposalSubmitted(
        updated.proposalId,
        updated.college.name,
        updated.studentCount,
        updated.plan.name,
        formatINR(updated.grandTotal || updated.finalTotal),
        updated.id
      );

      await logAuditEvent({
        userId: null,
        action: 'MANAGER_NOTIFIED',
        entity: 'PROPOSAL',
        entityId: proposal.id,
        newValue: { proposalId: updated.proposalId, college: updated.college.name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Proposal submitted successfully. Your proposal has been sent to the Genesis team for final approval.',
        data: {
          proposalId: updated.proposalId,
          status: updated.status,
          submittedAt: updated.submittedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * College requests changes on proposal -> status transitions to COLLEGE_MODIFIED, creator BD executive notified
   */
  public static async requestChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = String(req.params.token);
      const { reason, notes } = req.body || {};
      const changeReason = (reason || notes || '').trim() || 'College requested revisions';

      const proposal = await prisma.proposal.findUnique({
        where: { publicToken: token },
        include: { college: true, plan: true, createdBy: true },
      });

      if (!proposal || proposal.isDeleted || proposal.status === 'ARCHIVED') {
        res.status(404).json({ success: false, message: 'Proposal Unavailable. This proposal is no longer active.' });
        return;
      }

      if (proposal.status === 'APPROVED') {
        res.status(400).json({
          success: false,
          message: 'Approved proposals cannot be modified. Please contact your Genesis BD representative.',
          code: 'PROPOSAL_LOCKED',
        });
        return;
      }

      const nextVersion = proposal.currentVersion + 1;

      const updated = await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          status: 'COLLEGE_MODIFIED',
          collegeNotes: changeReason,
          currentVersion: nextVersion,
        },
        include: { college: true, plan: true },
      });

      await prisma.proposalVersion.create({
        data: {
          proposalId: proposal.id,
          versionNumber: nextVersion,
          snapshotData: JSON.stringify(updated),
          changedByRole: 'COLLEGE',
          changeSummary: `College requested adjustments: "${changeReason}"`,
          calculatedTotal: updated.grandTotal || updated.finalTotal,
        },
      });

      await logAuditEvent({
        userId: null,
        action: 'COLLEGE_REQUESTED_CHANGES',
        entity: 'PROPOSAL',
        entityId: proposal.id,
        newValue: { reason: changeReason, status: 'COLLEGE_MODIFIED', version: nextVersion },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

      // Targeted notification ONLY to creator BD executive
      await NotificationService.notifyCollegeRequestedChanges(
        updated.proposalId,
        updated.college.name,
        proposal.createdById,
        changeReason,
        updated.id
      );

      res.status(200).json({
        success: true,
        message: 'Your revision request has been submitted to the Genesis BD representative.',
        data: {
          proposalId: updated.proposalId,
          status: updated.status,
          collegeNotes: updated.collegeNotes,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = String(req.params.token);
      const proposal = await prisma.proposal.findUnique({
        where: { publicToken: token },
        include: {
          college: true,
          plan: { include: { modules: { orderBy: { displayOrder: 'asc' } } } },
          addons: true,
          customItems: true,
          createdBy: { select: { fullName: true, email: true, phone: true } },
          approvedBy: { select: { fullName: true, email: true } },
        },
      });

      if (!proposal || proposal.isDeleted || proposal.status === 'ARCHIVED') {
        res.status(404).json({ success: false, message: 'Proposal Unavailable. This proposal is no longer active.' });
        return;
      }

      const subtotal = proposal.subtotal || (proposal.baseTrainingCost + proposal.addonsTotalCost + proposal.customItemsTotalCost);
      let discountAmount = 0;
      if (proposal.discountValue > 0) {
        if (proposal.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * proposal.discountValue) / 100;
        } else {
          discountAmount = proposal.discountValue;
        }
      }
      const taxableAmount = proposal.taxableAmount || Math.max(0, subtotal - discountAmount);
      const gstRate = proposal.gstRate || 18.0;
      const gstAmount = proposal.gstAmount || Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
      const grandTotal = proposal.grandTotal || (taxableAmount + gstAmount);

      let customPrograms: any[] = [];
      if (proposal.customProgramsData) {
        try {
          customPrograms = JSON.parse(proposal.customProgramsData);
        } catch {
          // ignore
        }
      }

      const pdfBuffer = await PDFService.generateProposalPdf({
        proposalId: proposal.proposalId,
        publicToken: proposal.publicToken,
        version: proposal.currentVersion,
        status: proposal.status,
        createdAt: proposal.createdAt,
        validUntil: proposal.tokenExpiresAt,
        college: {
          name: proposal.college.name,
          placementOfficerName: proposal.college.placementOfficerName,
          placementOfficerEmail: proposal.college.placementOfficerEmail,
          placementOfficerPhone: proposal.college.placementOfficerPhone,
          address: proposal.college.address,
          city: proposal.college.city,
          state: proposal.college.state,
          pincode: proposal.college.pincode,
        },
        plan: {
          name: proposal.plan.name,
          code: proposal.plan.code,
          description: proposal.plan.description,
          totalHours: proposal.totalHours,
          modules: customPrograms.length > 0
            ? customPrograms.map((cp) => ({ name: cp.name || cp.programName, hours: cp.hours }))
            : proposal.plan.modules.map((m: { name: string; hours: number }) => ({
                name: m.name,
                hours: m.hours,
              })),
        },
        studentCount: proposal.studentCount,
        hourlyRate: proposal.hourlyRateSnapshot,
        baseTrainingCost: proposal.baseTrainingCost,
        addons: proposal.addons.map((a: { nameSnapshot: string; pricingTypeSnapshot: string; priceSnapshot: number; calculatedCost: number }) => ({
          name: a.nameSnapshot,
          pricingType: a.pricingTypeSnapshot,
          price: a.priceSnapshot,
          calculatedCost: a.calculatedCost,
        })),
        addonsTotalCost: proposal.addonsTotalCost,
        customItems: proposal.customItems.map((ci) => ({
          name: ci.name,
          description: ci.description || undefined,
          quantity: ci.quantity,
          pricingType: ci.pricingType,
          unitPrice: ci.unitPrice,
          calculatedCost: ci.calculatedCost,
        })),
        customItemsTotalCost: proposal.customItemsTotalCost,
        subtotal,
        discountValue: proposal.discountValue,
        discountType: proposal.discountType,
        discountAmount,
        taxableAmount,
        gstRate,
        gstAmount,
        grandTotal,
        finalTotal: grandTotal,
        createdBy: proposal.createdBy,
        approvedBy: proposal.approvedBy,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Genesis_Proposal_${proposal.proposalId}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
}
