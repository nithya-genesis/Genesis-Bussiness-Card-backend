import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';
import { createAddonSchema, updateAddonSchema } from '../validators/index.js';
import { logAuditEvent } from '../services/auditService.js';

export class AddonController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const where = includeInactive ? {} : { status: 'ACTIVE' };

      const addons = await prisma.addon.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: addons,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const addon = await prisma.addon.findUnique({ where: { id } });

      if (!addon) {
        res.status(404).json({ success: false, message: 'Add-on not found' });
        return;
      }

      res.status(200).json({ success: true, data: addon });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createAddonSchema.parse(req.body);

      const existing = await prisma.addon.findUnique({
        where: { code: validated.code },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          message: `Add-on with code '${validated.code}' already exists`,
        });
        return;
      }

      const addon = await prisma.addon.create({
        data: validated,
      });

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const validated = updateAddonSchema.parse(req.body);

      const existing = await prisma.addon.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Add-on not found' });
        return;
      }

      const updated = await prisma.addon.update({
        where: { id },
        data: validated,
      });

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }
}
