"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingController = void 0;
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../validators/index.js");
const auditService_js_1 = require("../services/auditService.js");
class SettingController {
    static async list(req, res, next) {
        try {
            const settings = await prisma_js_1.prisma.systemSetting.findMany({
                orderBy: { key: 'asc' },
            });
            res.status(200).json({ success: true, data: settings });
        }
        catch (err) {
            next(err);
        }
    }
    static async getByKey(req, res, next) {
        try {
            const key = String(req.params.key);
            const setting = await prisma_js_1.prisma.systemSetting.findUnique({ where: { key } });
            if (!setting) {
                res.status(404).json({ success: false, message: 'Setting not found' });
                return;
            }
            res.status(200).json({ success: true, data: setting });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const key = String(req.params.key);
            const validated = index_js_1.updateSettingSchema.parse(req.body);
            const existing = await prisma_js_1.prisma.systemSetting.findUnique({ where: { key } });
            const updated = await prisma_js_1.prisma.systemSetting.upsert({
                where: { key },
                update: {
                    value: validated.value,
                    description: validated.description || existing?.description || '',
                },
                create: {
                    key,
                    value: validated.value,
                    description: validated.description || '',
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'SETTING_UPDATED',
                entity: 'SETTING',
                entityId: key,
                oldValue: existing ? { value: existing.value } : null,
                newValue: { value: updated.value },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: `System setting '${key}' updated successfully`,
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SettingController = SettingController;
