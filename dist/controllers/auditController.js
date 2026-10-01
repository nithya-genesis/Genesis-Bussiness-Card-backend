"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const prisma_js_1 = require("../models/prisma.js");
class AuditController {
    static async list(req, res, next) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '30', 10);
            const action = req.query.action;
            const entity = req.query.entity;
            const skip = (page - 1) * limit;
            const where = {};
            if (action)
                where.action = action;
            if (entity)
                where.entity = entity;
            const [total, logs] = await Promise.all([
                prisma_js_1.prisma.auditLog.count({ where }),
                prisma_js_1.prisma.auditLog.findMany({
                    where,
                    include: {
                        user: { select: { id: true, fullName: true, email: true, role: true } },
                    },
                    orderBy: { timestamp: 'desc' },
                    skip,
                    take: limit,
                }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    logs,
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
}
exports.AuditController = AuditController;
