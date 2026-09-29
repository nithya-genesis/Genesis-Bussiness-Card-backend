"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProposalController = void 0;
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../validators/index.js");
const pricingEngine_js_1 = require("../services/pricingEngine.js");
const idGenerator_js_1 = require("../utils/idGenerator.js");
const token_js_1 = require("../utils/token.js");
const qrService_js_1 = require("../qr/qrService.js");
const pdfService_js_1 = require("../pdf/pdfService.js");
const auditService_js_1 = require("../services/auditService.js");
const notificationService_js_1 = require("../services/notificationService.js");
const currency_js_1 = require("../utils/currency.js");
const index_js_2 = require("../config/index.js");
class ProposalController {
    /**
     * Pure calculation endpoint for live reactive preview
     */
    static async calculate(req, res, next) {
        try {
            const validated = index_js_1.calculatePriceSchema.parse(req.body);
            const result = await (0, pricingEngine_js_1.calculateProposalPricing)(validated);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '20', 10);
            const search = (req.query.search || '').trim();
            const status = req.query.status;
            const planId = req.query.planId;
            const collegeId = req.query.collegeId;
            const sortBy = (req.query.sortBy || 'newest');
            const skip = (page - 1) * limit;
            const where = {};
            if (status && status !== 'ALL') {
                if (status === 'ARCHIVED') {
                    where.OR = [{ status: 'ARCHIVED' }, { isDeleted: true }];
                }
                else if (status === 'PENDING_MANAGER_APPROVAL') {
                    where.status = { in: ['PENDING_MANAGER_APPROVAL', 'SUBMITTED'] };
                    where.isDeleted = false;
                }
                else {
                    where.status = status;
                    where.isDeleted = false;
                }
            }
            else {
                where.isDeleted = false;
                where.status = { not: 'ARCHIVED' };
            }
            if (planId) {
                where.planId = planId;
            }
            if (collegeId) {
                where.collegeId = collegeId;
            }
            if (search) {
                where.OR = [
                    { proposalId: { contains: search } },
                    { college: { name: { contains: search } } },
                    { college: { placementOfficerName: { contains: search } } },
                    { college: { collegeId: { contains: search } } },
                ];
            }
            let orderBy = { createdAt: 'desc' };
            if (sortBy === 'oldest')
                orderBy = { createdAt: 'asc' };
            if (sortBy === 'highest_value')
                orderBy = { finalTotal: 'desc' };
            if (sortBy === 'lowest_value')
                orderBy = { finalTotal: 'asc' };
            const [total, proposals] = await Promise.all([
                prisma_js_1.prisma.proposal.count({ where }),
                prisma_js_1.prisma.proposal.findMany({
                    where,
                    include: {
                        college: {
                            select: {
                                id: true,
                                collegeId: true,
                                name: true,
                                placementOfficerName: true,
                                city: true,
                                state: true,
                            },
                        },
                        plan: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                totalHours: true,
                            },
                        },
                        createdBy: {
                            select: { id: true, fullName: true, email: true },
                        },
                        approvedBy: {
                            select: { id: true, fullName: true, email: true },
                        },
                        addons: {
                            include: { addon: true },
                        },
                        customItems: true,
                    },
                    orderBy,
                    skip,
                    take: limit,
                }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    proposals,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Dedicated list for BD Manager review: Proposals pending approval
     */
    static async getPendingApproval(req, res, next) {
        try {
            const proposals = await prisma_js_1.prisma.proposal.findMany({
                where: {
                    status: { in: ['PENDING_MANAGER_APPROVAL', 'SUBMITTED'] },
                    isDeleted: false,
                },
                include: {
                    college: true,
                    plan: {
                        include: { modules: { orderBy: { displayOrder: 'asc' } } },
                    },
                    createdBy: { select: { id: true, fullName: true, email: true, phone: true } },
                    approvedBy: { select: { id: true, fullName: true, email: true } },
                    addons: { include: { addon: true } },
                    customItems: true,
                },
                orderBy: { submittedAt: 'desc' },
            });
            res.status(200).json({
                success: true,
                data: {
                    proposals,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const proposal = await prisma_js_1.prisma.proposal.findUnique({
                where: { id },
                include: {
                    college: true,
                    plan: {
                        include: { modules: { orderBy: { displayOrder: 'asc' } } },
                    },
                    addons: {
                        include: { addon: true },
                    },
                    customItems: true,
                    createdBy: {
                        select: { id: true, fullName: true, email: true, phone: true },
                    },
                    approvedBy: {
                        select: { id: true, fullName: true, email: true },
                    },
                    versions: {
                        orderBy: { versionNumber: 'desc' },
                    },
                },
            });
            if (!proposal) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            // Parse custom programs data
            let customPrograms = undefined;
            if (proposal.customProgramsData) {
                try {
                    customPrograms = JSON.parse(proposal.customProgramsData);
                }
                catch {
                    // ignore
                }
            }
            const publicUrl = qrService_js_1.QRService.getPublicProposalUrl(proposal.publicToken);
            const qrDataUrl = await qrService_js_1.QRService.generateDataUrl(proposal.publicToken);
            const costPerStudentBeforeGst = proposal.studentCount > 0 ? Math.round((proposal.taxableAmount / proposal.studentCount) * 100) / 100 : 0;
            const gstPerStudent = proposal.studentCount > 0 ? Math.round((proposal.gstAmount / proposal.studentCount) * 100) / 100 : 0;
            const finalCostPerStudent = proposal.studentCount > 0 ? Math.round((proposal.grandTotal / proposal.studentCount) * 100) / 100 : 0;
            res.status(200).json({
                success: true,
                data: {
                    ...proposal,
                    customPrograms,
                    costPerStudentBeforeGst,
                    gstPerStudent,
                    finalCostPerStudent,
                    shareLink: publicUrl,
                    qrCodeDataUrl: qrDataUrl,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const validated = index_js_1.createProposalSchema.parse(req.body);
            // Verify College
            const college = await prisma_js_1.prisma.college.findUnique({
                where: { id: validated.collegeId },
            });
            if (!college) {
                res.status(400).json({ success: false, message: 'Invalid College specified' });
                return;
            }
            // Calculate server-side pricing
            const calculated = await (0, pricingEngine_js_1.calculateProposalPricing)({
                planId: validated.planId,
                planType: validated.planType,
                studentCount: validated.studentCount,
                hourlyRate: validated.hourlyRate,
                pricingModel: validated.pricingModel,
                selectedAddonIds: validated.selectedAddonIds,
                customPrograms: (validated.customProgramsData || validated.customPrograms),
                customProgramsData: validated.customProgramsData,
                customItems: validated.customItems,
                discountType: validated.discountType,
                discountValue: validated.discountValue,
            });
            const generatedProposalId = await (0, idGenerator_js_1.generateProposalId)();
            const publicToken = (0, token_js_1.generateSecureToken)();
            const tokenExpiresAt = new Date();
            tokenExpiresAt.setDate(tokenExpiresAt.getDate() + index_js_2.config.proposalTokenExpiryDays);
            const customProgramsData = calculated.customPrograms ? JSON.stringify(calculated.customPrograms) : null;
            const proposal = await prisma_js_1.prisma.proposal.create({
                data: {
                    proposalId: generatedProposalId,
                    publicToken,
                    tokenExpiresAt,
                    collegeId: validated.collegeId,
                    planId: calculated.planId,
                    createdById: req.user.userId,
                    customProgramsData,
                    studentCount: validated.studentCount,
                    minStudents: validated.minStudents || 50,
                    maxStudents: validated.maxStudents || 2000,
                    totalHours: calculated.totalHours,
                    hourlyRateSnapshot: calculated.effectiveHourlyRate,
                    pricingModelSnapshot: calculated.pricingModel,
                    baseTrainingCost: calculated.baseTrainingCost,
                    addonsTotalCost: calculated.addonsTotalCost,
                    customItemsTotalCost: calculated.customItemsTotalCost,
                    subtotal: calculated.subtotal,
                    discountValue: validated.discountValue || 0,
                    discountType: validated.discountType || 'FIXED',
                    taxableAmount: calculated.taxableAmount,
                    gstRate: calculated.gstRate,
                    gstAmount: calculated.gstAmount,
                    grandTotal: calculated.grandTotal,
                    finalTotal: calculated.finalTotal,
                    currency: 'INR',
                    status: 'DRAFT',
                    currentVersion: 1,
                    notes: validated.notes || null,
                    addons: {
                        create: calculated.addons.map((a) => ({
                            addonId: a.addonId,
                            nameSnapshot: a.name,
                            pricingTypeSnapshot: a.pricingType,
                            priceSnapshot: a.price,
                            calculatedCost: a.calculatedCost,
                        })),
                    },
                    customItems: {
                        create: (calculated.customItems || []).map((ci) => ({
                            name: ci.name,
                            description: ci.description || null,
                            quantity: ci.quantity,
                            pricingType: ci.pricingType,
                            unitPrice: ci.unitPrice,
                            calculatedCost: ci.calculatedCost,
                        })),
                    },
                },
                include: {
                    college: true,
                    plan: { include: { modules: true } },
                    addons: true,
                    customItems: true,
                    createdBy: { select: { id: true, fullName: true, email: true } },
                },
            });
            // Save initial Proposal Version
            await prisma_js_1.prisma.proposalVersion.create({
                data: {
                    proposalId: proposal.id,
                    versionNumber: 1,
                    snapshotData: JSON.stringify(proposal),
                    changedByRole: req.user.role,
                    changeSummary: `Initial proposal drafted for ${college.name} (${calculated.studentCount} students, ${(0, currency_js_1.formatINR)(calculated.grandTotal)})`,
                    calculatedTotal: calculated.grandTotal,
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.userId,
                action: 'PROPOSAL_CREATED',
                entity: 'PROPOSAL',
                entityId: proposal.id,
                newValue: {
                    proposalId: proposal.proposalId,
                    collegeName: college.name,
                    grandTotal: proposal.grandTotal,
                    studentCount: proposal.studentCount,
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            if (calculated.customItems && calculated.customItems.length > 0) {
                await (0, auditService_js_1.logAuditEvent)({
                    userId: req.user?.userId,
                    action: 'CUSTOM_ITEM_ADDED',
                    entity: 'PROPOSAL',
                    entityId: proposal.id,
                    newValue: calculated.customItems,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent') || undefined,
                });
            }
            res.status(201).json({
                success: true,
                message: 'Proposal created successfully',
                data: proposal,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const id = String(req.params.id);
            const validated = index_js_1.updateProposalSchema.parse(req.body);
            const existing = await prisma_js_1.prisma.proposal.findUnique({
                where: { id },
                include: { college: true, plan: true, addons: true, customItems: true },
            });
            if (!existing) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            const userUid = req.user?.id || req.user?.userId;
            if (req.user?.role === 'BD_EXECUTIVE' && existing.createdById !== userUid) {
                res.status(403).json({ success: false, message: 'You can only edit proposals that you created' });
                return;
            }
            if (existing.status === 'APPROVED') {
                res.status(400).json({
                    success: false,
                    message: 'Approved proposals are locked and immutable. Create a new proposal version to introduce revisions.',
                    code: 'PROPOSAL_LOCKED',
                });
                return;
            }
            const planId = validated.planId || existing.planId;
            const studentCount = validated.studentCount || existing.studentCount;
            const hourlyRate = validated.hourlyRate !== undefined ? validated.hourlyRate : existing.hourlyRateSnapshot;
            const pricingModel = (validated.pricingModel || existing.pricingModelSnapshot);
            const selectedAddonIds = validated.selectedAddonIds !== undefined
                ? validated.selectedAddonIds
                : existing.addons.map((a) => a.addonId);
            const discountType = (validated.discountType || existing.discountType);
            const discountValue = validated.discountValue !== undefined ? validated.discountValue : existing.discountValue;
            const customPrograms = validated.customPrograms !== undefined
                ? validated.customPrograms
                : (existing.customProgramsData ? JSON.parse(existing.customProgramsData) : []);
            const customItems = validated.customItems !== undefined
                ? validated.customItems
                : existing.customItems.map((ci) => ({
                    name: ci.name,
                    description: ci.description || undefined,
                    quantity: ci.quantity,
                    pricingType: ci.pricingType,
                    unitPrice: ci.unitPrice,
                }));
            const calculated = await (0, pricingEngine_js_1.calculateProposalPricing)({
                planId,
                studentCount,
                hourlyRate,
                pricingModel,
                selectedAddonIds,
                customPrograms,
                customItems,
                discountType,
                discountValue,
            });
            // Update addons relationship
            await prisma_js_1.prisma.proposalAddon.deleteMany({ where: { proposalId: id } });
            await prisma_js_1.prisma.proposalAddon.createMany({
                data: calculated.addons.map((a) => ({
                    proposalId: id,
                    addonId: a.addonId,
                    nameSnapshot: a.name,
                    pricingTypeSnapshot: a.pricingType,
                    priceSnapshot: a.price,
                    calculatedCost: a.calculatedCost,
                })),
            });
            // Update custom items relationship
            await prisma_js_1.prisma.proposalCustomItem.deleteMany({ where: { proposalId: id } });
            if (calculated.customItems && calculated.customItems.length > 0) {
                await prisma_js_1.prisma.proposalCustomItem.createMany({
                    data: calculated.customItems.map((ci) => ({
                        proposalId: id,
                        name: ci.name,
                        description: ci.description || null,
                        quantity: ci.quantity,
                        pricingType: ci.pricingType,
                        unitPrice: ci.unitPrice,
                        calculatedCost: ci.calculatedCost,
                    })),
                });
            }
            const nextVersion = existing.currentVersion + 1;
            const customProgramsData = calculated.customPrograms ? JSON.stringify(calculated.customPrograms) : null;
            let nextStatus = existing.status;
            if (existing.status === 'REJECTED' || existing.status === 'COLLEGE_MODIFIED' || existing.status === 'MODIFIED_BY_COLLEGE') {
                nextStatus = 'DRAFT';
            }
            if (validated.status) {
                nextStatus = validated.status;
            }
            const updated = await prisma_js_1.prisma.proposal.update({
                where: { id },
                data: {
                    planId: calculated.planId,
                    customProgramsData,
                    studentCount,
                    minStudents: validated.minStudents !== undefined ? validated.minStudents : existing.minStudents,
                    maxStudents: validated.maxStudents !== undefined ? validated.maxStudents : existing.maxStudents,
                    totalHours: calculated.totalHours,
                    hourlyRateSnapshot: calculated.effectiveHourlyRate,
                    pricingModelSnapshot: calculated.pricingModel,
                    baseTrainingCost: calculated.baseTrainingCost,
                    addonsTotalCost: calculated.addonsTotalCost,
                    customItemsTotalCost: calculated.customItemsTotalCost,
                    subtotal: calculated.subtotal,
                    discountValue,
                    discountType,
                    taxableAmount: calculated.taxableAmount,
                    gstRate: calculated.gstRate,
                    gstAmount: calculated.gstAmount,
                    grandTotal: calculated.grandTotal,
                    finalTotal: calculated.finalTotal,
                    status: nextStatus,
                    rejectionReason: nextStatus === 'DRAFT' ? null : existing.rejectionReason,
                    currentVersion: nextVersion,
                    notes: validated.notes !== undefined ? validated.notes : existing.notes,
                },
                include: {
                    college: true,
                    plan: true,
                    addons: true,
                    customItems: true,
                },
            });
            // Save Proposal Version
            await prisma_js_1.prisma.proposalVersion.create({
                data: {
                    proposalId: id,
                    versionNumber: nextVersion,
                    snapshotData: JSON.stringify(updated),
                    changedByRole: req.user.role,
                    changeSummary: `Proposal revised to v${nextVersion}: ${studentCount} students, Grand Total: ${(0, currency_js_1.formatINR)(calculated.grandTotal)}`,
                    calculatedTotal: calculated.grandTotal,
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.userId,
                action: 'PROPOSAL_UPDATED',
                entity: 'PROPOSAL',
                entityId: id,
                oldValue: { grandTotal: existing.grandTotal || existing.finalTotal, studentCount: existing.studentCount },
                newValue: { grandTotal: updated.grandTotal, studentCount: updated.studentCount, version: nextVersion },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: 'Proposal updated successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async generateShareLink(req, res, next) {
        try {
            const id = String(req.params.id);
            const proposal = await prisma_js_1.prisma.proposal.findUnique({ where: { id } });
            if (!proposal) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            if (proposal.status === 'DRAFT') {
                await prisma_js_1.prisma.proposal.update({
                    where: { id },
                    data: { status: 'SHARED' },
                });
            }
            const publicUrl = qrService_js_1.QRService.getPublicProposalUrl(proposal.publicToken);
            const qrDataUrl = await qrService_js_1.QRService.generateDataUrl(proposal.publicToken);
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.userId,
                action: 'PROPOSAL_SHARED',
                entity: 'PROPOSAL',
                entityId: proposal.id,
                newValue: { publicUrl },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: 'Shareable proposal link generated',
                data: {
                    publicToken: proposal.publicToken,
                    shareLink: publicUrl,
                    qrCodeDataUrl: qrDataUrl,
                    tokenExpiresAt: proposal.tokenExpiresAt,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getQrCode(req, res, next) {
        try {
            const id = String(req.params.id);
            const proposal = await prisma_js_1.prisma.proposal.findUnique({ where: { id } });
            if (!proposal) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            const dataUrl = await qrService_js_1.QRService.generateDataUrl(proposal.publicToken);
            const svg = await qrService_js_1.QRService.generateSvg(proposal.publicToken);
            const url = qrService_js_1.QRService.getPublicProposalUrl(proposal.publicToken);
            res.status(200).json({
                success: true,
                data: {
                    dataUrl,
                    svg,
                    url,
                    proposalId: proposal.proposalId,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async downloadQrImage(req, res, next) {
        try {
            const id = String(req.params.id);
            const proposal = await prisma_js_1.prisma.proposal.findUnique({ where: { id } });
            if (!proposal) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            const pngBuffer = await qrService_js_1.QRService.generateBuffer(proposal.publicToken);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename="QR_${proposal.proposalId}.png"`);
            res.send(pngBuffer);
        }
        catch (err) {
            next(err);
        }
    }
    static async approve(req, res, next) {
        try {
            const id = String(req.params.id);
            const validated = index_js_1.approveProposalSchema.parse(req.body);
            const proposal = await prisma_js_1.prisma.proposal.findUnique({
                where: { id },
                include: { college: true, createdBy: true },
            });
            if (!proposal) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            const updated = await prisma_js_1.prisma.proposal.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    approvedById: req.user.userId,
                    approvedAt: new Date(),
                    notes: validated.notes || proposal.notes,
                },
                include: {
                    college: true,
                    plan: true,
                    createdBy: { select: { id: true, fullName: true, email: true } },
                    approvedBy: { select: { id: true, fullName: true, email: true } },
                },
            });
            await prisma_js_1.prisma.proposalVersion.create({
                data: {
                    proposalId: id,
                    versionNumber: proposal.currentVersion,
                    snapshotData: JSON.stringify(updated),
                    changedByRole: req.user.role,
                    changeSummary: `Proposal officially approved by BD Manager ${req.user.fullName}`,
                    calculatedTotal: updated.grandTotal || updated.finalTotal,
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.userId,
                action: 'PROPOSAL_APPROVED',
                entity: 'PROPOSAL',
                entityId: id,
                newValue: { approvedBy: req.user?.fullName, grandTotal: updated.grandTotal },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            if (proposal.createdById) {
                await notificationService_js_1.NotificationService.notifyProposalApproved(updated.proposalId, updated.college.name, proposal.createdById, updated.id);
            }
            res.status(200).json({
                success: true,
                message: 'Proposal approved and finalized successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async reject(req, res, next) {
        try {
            const id = String(req.params.id);
            const validated = index_js_1.rejectProposalSchema.parse(req.body);
            const reason = validated.rejectionReason || validated.reason || 'Proposal rejected by Manager';
            const proposal = await prisma_js_1.prisma.proposal.findUnique({
                where: { id },
                include: { college: true, createdBy: true },
            });
            if (!proposal) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            const updated = await prisma_js_1.prisma.proposal.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    rejectionReason: reason,
                },
                include: { college: true },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.userId,
                action: 'PROPOSAL_REJECTED',
                entity: 'PROPOSAL',
                entityId: id,
                newValue: { rejectionReason: reason },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            if (proposal.createdById) {
                await notificationService_js_1.NotificationService.notifyProposalRejected(proposal.proposalId, proposal.college.name, proposal.createdById, reason, proposal.id);
            }
            res.status(200).json({
                success: true,
                message: 'Proposal rejected and notification dispatched to BD Executive',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async downloadPdf(req, res, next) {
        try {
            const id = String(req.params.id);
            const proposal = await prisma_js_1.prisma.proposal.findUnique({
                where: { id },
                include: {
                    college: true,
                    plan: { include: { modules: { orderBy: { displayOrder: 'asc' } } } },
                    addons: true,
                    customItems: true,
                    createdBy: { select: { fullName: true, email: true, phone: true } },
                    approvedBy: { select: { fullName: true, email: true } },
                },
            });
            if (!proposal) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            // Compute GST values if legacy proposal did not have them
            const subtotal = proposal.subtotal || (proposal.baseTrainingCost + proposal.addonsTotalCost + proposal.customItemsTotalCost);
            let discountAmount = 0;
            if (proposal.discountValue > 0) {
                if (proposal.discountType === 'PERCENTAGE') {
                    discountAmount = (subtotal * proposal.discountValue) / 100;
                }
                else {
                    discountAmount = proposal.discountValue;
                }
            }
            const taxableAmount = proposal.taxableAmount || Math.max(0, subtotal - discountAmount);
            const gstRate = proposal.gstRate || 18.0;
            const gstAmount = proposal.gstAmount || Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
            const grandTotal = proposal.grandTotal || (taxableAmount + gstAmount);
            let customPrograms = [];
            if (proposal.customProgramsData) {
                try {
                    customPrograms = JSON.parse(proposal.customProgramsData);
                }
                catch {
                    // ignore
                }
            }
            const pdfBuffer = await pdfService_js_1.PDFService.generateProposalPdf({
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
                        ? customPrograms.map((cp) => ({ name: cp.name, hours: cp.hours }))
                        : proposal.plan.modules.map((m) => ({
                            name: m.name,
                            hours: m.hours,
                        })),
                },
                studentCount: proposal.studentCount,
                hourlyRate: proposal.hourlyRateSnapshot,
                baseTrainingCost: proposal.baseTrainingCost,
                addons: proposal.addons.map((a) => ({
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
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.userId,
                action: 'PDF_GENERATED',
                entity: 'PROPOSAL',
                entityId: proposal.id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="Genesis_Proposal_${proposal.proposalId}.pdf"`);
            res.send(pdfBuffer);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Archive / soft-delete a proposal (BD_MANAGER only)
     */
    static async archive(req, res, next) {
        try {
            const id = String(req.params.id);
            const reason = (req.body?.reason || '').trim() || undefined;
            const proposal = await prisma_js_1.prisma.proposal.findUnique({
                where: { id },
                include: {
                    college: true,
                    createdBy: true,
                },
            });
            if (!proposal) {
                res.status(404).json({ success: false, message: 'Proposal not found' });
                return;
            }
            if (proposal.isDeleted || proposal.status === 'ARCHIVED') {
                res.status(400).json({ success: false, message: 'Proposal is already archived' });
                return;
            }
            const updated = await prisma_js_1.prisma.proposal.update({
                where: { id },
                data: {
                    isDeleted: true,
                    status: 'ARCHIVED',
                    deletedAt: new Date(),
                    deletedById: req.user?.id || null,
                    archiveReason: reason || null,
                },
                include: {
                    college: true,
                    plan: true,
                    createdBy: { select: { id: true, fullName: true, email: true } },
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'PROPOSAL_ARCHIVED',
                entity: 'PROPOSAL',
                entityId: proposal.id,
                oldValue: { status: proposal.status, isDeleted: proposal.isDeleted },
                newValue: { status: 'ARCHIVED', isDeleted: true, reason },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            // Targeted notification ONLY to creator BD executive
            if (proposal.createdById) {
                await notificationService_js_1.NotificationService.notifyProposalArchived(proposal.proposalId, proposal.college.name, proposal.createdById, reason, proposal.id);
            }
            res.status(200).json({
                success: true,
                message: 'Proposal archived successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProposalController = ProposalController;
