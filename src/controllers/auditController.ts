import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';

export class AuditController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '30', 10);
      const action = req.query.action as string;
      const entity = req.query.entity as string;

      const skip = (page - 1) * limit;
      const where: any = {};

      if (action) where.action = action;
      if (entity) where.entity = entity;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
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
    } catch (err) {
      next(err);
    }
  }
}
