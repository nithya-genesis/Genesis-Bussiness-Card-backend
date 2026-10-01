"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanController = void 0;
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../validators/index.js");
const auditService_js_1 = require("../services/auditService.js");
class PlanController {
    static async list(req, res, next) {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const where = includeInactive ? {} : { status: 'ACTIVE' };
            const plans = await prisma_js_1.prisma.plan.findMany({
                where,
                include: {
                    modules: {
                        orderBy: { displayOrder: 'asc' },
                    },
                },
                orderBy: { displayOrder: 'asc' },
            });
            res.status(200).json({
                success: true,
                data: plans,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const plan = await prisma_js_1.prisma.plan.findUnique({
                where: { id },
                include: {
                    modules: { orderBy: { displayOrder: 'asc' } },
                },
            });
            if (!plan) {
                res.status(404).json({ success: false, message: 'Plan not found' });
                return;
            }
            res.status(200).json({ success: true, data: plan });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const validated = index_js_1.createPlanSchema.parse(req.body);
            const existing = await prisma_js_1.prisma.plan.findUnique({
                where: { code: validated.code },
            });
            if (existing) {
                res.status(400).json({
                    success: false,
                    message: `Plan code '${validated.code}' already exists`,
                });
                return;
            }
            const plan = await prisma_js_1.prisma.plan.create({
                data: {
                    name: validated.name,
                    code: validated.code,
                    description: validated.description,
                    totalHours: validated.totalHours,
                    pricingModel: validated.pricingModel,
                    fixedPrice: validated.fixedPrice || null,
                    displayOrder: validated.displayOrder,
                    modules: {
                        create: validated.modules.map((m, idx) => ({
                            name: m.name,
                            hours: m.hours,
                            displayOrder: m.displayOrder || idx,
                        })),
                    },
                },
                include: { modules: true },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'PLAN_CREATED',
                entity: 'PLAN',
                entityId: plan.id,
                newValue: { name: plan.name, totalHours: plan.totalHours, pricingModel: plan.pricingModel },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(201).json({
                success: true,
                message: 'Plan created successfully',
                data: plan,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const id = String(req.params.id);
            const validated = index_js_1.updatePlanSchema.parse(req.body);
            const existing = await prisma_js_1.prisma.plan.findUnique({
                where: { id },
                include: { modules: true },
            });
            if (!existing) {
                res.status(404).json({ success: false, message: 'Plan not found' });
                return;
            }
            // Handle modules update if supplied
            if (validated.modules) {
                await prisma_js_1.prisma.planModule.deleteMany({ where: { planId: id } });
                await prisma_js_1.prisma.planModule.createMany({
                    data: validated.modules.map((m, idx) => ({
                        planId: id,
                        name: m.name,
                        hours: m.hours,
                        displayOrder: m.displayOrder || idx,
                    })),
                });
            }
            const { modules, ...planFields } = validated;
            const updated = await prisma_js_1.prisma.plan.update({
                where: { id },
                data: planFields,
                include: { modules: true },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'PLAN_UPDATED',
                entity: 'PLAN',
                entityId: updated.id,
                oldValue: { name: existing.name, totalHours: existing.totalHours },
                newValue: planFields,
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: 'Plan updated successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PlanController = PlanController;
