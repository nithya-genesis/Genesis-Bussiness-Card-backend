"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollegeController = void 0;
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../validators/index.js");
const idGenerator_js_1 = require("../utils/idGenerator.js");
const auditService_js_1 = require("../services/auditService.js");
class CollegeController {
    static async list(req, res, next) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '20', 10);
            const search = (req.query.search || '').trim();
            const status = req.query.status;
            const skip = (page - 1) * limit;
            const where = { isDeleted: false };
            if (status) {
                where.status = status;
            }
            if (search) {
                where.AND = [
                    {
                        OR: [
                            { name: { contains: search } },
                            { collegeId: { contains: search } },
                            { placementOfficerName: { contains: search } },
                            { placementOfficerEmail: { contains: search } },
                            { city: { contains: search } },
                            { state: { contains: search } },
                        ],
                    },
                ];
            }
            const [total, colleges] = await Promise.all([
                prisma_js_1.prisma.college.count({ where }),
                prisma_js_1.prisma.college.findMany({
                    where,
                    include: {
                        createdBy: {
                            select: { id: true, fullName: true, email: true },
                        },
                        proposals: {
                            select: {
                                id: true,
                                proposalId: true,
                                finalTotal: true,
                                status: true,
                                createdAt: true,
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 5,
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    colleges,
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
    static async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const college = await prisma_js_1.prisma.college.findUnique({
                where: { id },
                include: {
                    createdBy: { select: { id: true, fullName: true, email: true } },
                    proposals: {
                        include: {
                            plan: { select: { id: true, name: true, totalHours: true } },
                            createdBy: { select: { id: true, fullName: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            if (!college || college.isDeleted) {
                res.status(404).json({ success: false, message: 'College not found', code: 'COLLEGE_NOT_FOUND' });
                return;
            }
            res.status(200).json({ success: true, data: college });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const validated = index_js_1.createCollegeSchema.parse(req.body);
            const generatedId = await (0, idGenerator_js_1.generateCollegeId)();
            const college = await prisma_js_1.prisma.college.create({
                data: {
                    collegeId: generatedId,
                    name: validated.name,
                    placementOfficerName: validated.placementOfficerName,
                    placementOfficerEmail: validated.placementOfficerEmail,
                    placementOfficerPhone: validated.placementOfficerPhone,
                    address: validated.address,
                    city: validated.city,
                    state: validated.state,
                    pincode: validated.pincode,
                    studentCount: validated.studentCount,
                    notes: validated.notes || null,
                    createdById: req.user.id,
                },
                include: {
                    createdBy: { select: { id: true, fullName: true, email: true } },
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'COLLEGE_CREATED',
                entity: 'COLLEGE',
                entityId: college.id,
                newValue: { collegeId: college.collegeId, name: college.name, city: college.city },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(201).json({
                success: true,
                message: 'College created successfully',
                data: college,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const id = String(req.params.id);
            const validated = index_js_1.updateCollegeSchema.parse(req.body);
            const existing = await prisma_js_1.prisma.college.findUnique({ where: { id } });
            if (!existing || existing.isDeleted) {
                res.status(404).json({ success: false, message: 'College not found' });
                return;
            }
            const updated = await prisma_js_1.prisma.college.update({
                where: { id },
                data: validated,
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'COLLEGE_UPDATED',
                entity: 'COLLEGE',
                entityId: updated.id,
                oldValue: { name: existing.name, status: existing.status },
                newValue: validated,
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: 'College updated successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            const id = String(req.params.id);
            const existing = await prisma_js_1.prisma.college.findUnique({ where: { id } });
            if (!existing || existing.isDeleted) {
                res.status(404).json({ success: false, message: 'College not found or already deleted' });
                return;
            }
            const updated = await prisma_js_1.prisma.college.update({
                where: { id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedById: req.user.id,
                    status: 'INACTIVE',
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'COLLEGE_DELETED',
                entity: 'COLLEGE',
                entityId: updated.id,
                oldValue: { name: existing.name, collegeId: existing.collegeId },
                newValue: { isDeleted: true, deletedAt: new Date().toISOString() },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: 'College archived successfully',
                data: { id: updated.id, isDeleted: true },
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CollegeController = CollegeController;
