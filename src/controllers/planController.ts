import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';
import { createPlanSchema, updatePlanSchema } from '../validators/index.js';
import { logAuditEvent } from '../services/auditService.js';

export class PlanController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const where = includeInactive ? {} : { status: 'ACTIVE' };

      const plans = await prisma.plan.findMany({
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
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const plan = await prisma.plan.findUnique({
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
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createPlanSchema.parse(req.body);

      const existing = await prisma.plan.findUnique({
        where: { code: validated.code },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          message: `Plan code '${validated.code}' already exists`,
        });
        return;
      }

      const plan = await prisma.plan.create({
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

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const validated = updatePlanSchema.parse(req.body);

      const existing = await prisma.plan.findUnique({
        where: { id },
        include: { modules: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Plan not found' });
        return;
      }

      // Handle modules update if supplied
      if (validated.modules) {
        await prisma.planModule.deleteMany({ where: { planId: id } });
        await prisma.planModule.createMany({
          data: validated.modules.map((m, idx) => ({
            planId: id,
            name: m.name,
            hours: m.hours,
            displayOrder: m.displayOrder || idx,
          })),
        });
      }

      const { modules, ...planFields } = validated;

      const updated = await prisma.plan.update({
        where: { id },
        data: planFields,
        include: { modules: true },
      });

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }
}
