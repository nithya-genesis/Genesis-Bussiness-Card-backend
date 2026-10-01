"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddonController = void 0;
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../validators/index.js");
const auditService_js_1 = require("../services/auditService.js");
class AddonController {
    static async list(req, res, next) {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const where = includeInactive ? {} : { status: 'ACTIVE' };
            const addons = await prisma_js_1.prisma.addon.findMany({
                where,
                orderBy: { createdAt: 'asc' },
            });
            res.status(200).json({
                success: true,
                data: addons,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const addon = await prisma_js_1.prisma.addon.findUnique({ where: { id } });
            if (!addon) {
                res.status(404).json({ success: false, message: 'Add-on not found' });
                return;
            }
            res.status(200).json({ success: true, data: addon });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const validated = index_js_1.createAddonSchema.parse(req.body);
            const existing = await prisma_js_1.prisma.addon.findUnique({
                where: { code: validated.code },
            });
            if (existing) {
                res.status(400).json({
                    success: false,
                    message: `Add-on with code '${validated.code}' already exists`,
                });
                return;
            }
            const addon = await prisma_js_1.prisma.addon.create({
                data: validated,
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'ADDON_CREATED',
                entity: 'ADDON',
                entityId: addon.id,
                newValue: { name: addon.name, price: addon.price, pricingType: addon.pricingType },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(201).json({
                success: true,
                message: 'Add-on created successfully',
                data: addon,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const id = String(req.params.id);
            const validated = index_js_1.updateAddonSchema.parse(req.body);
            const existing = await prisma_js_1.prisma.addon.findUnique({ where: { id } });
            if (!existing) {
                res.status(404).json({ success: false, message: 'Add-on not found' });
                return;
            }
            const updated = await prisma_js_1.prisma.addon.update({
                where: { id },
                data: validated,
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'ADDON_UPDATED',
                entity: 'ADDON',
                entityId: updated.id,
                oldValue: { name: existing.name, price: existing.price },
                newValue: validated,
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: 'Add-on updated successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AddonController = AddonController;
