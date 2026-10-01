import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';
import { updateSettingSchema } from '../validators/index.js';
import { logAuditEvent } from '../services/auditService.js';

export class SettingController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' },
      });

      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  public static async getByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = String(req.params.key);
      const setting = await prisma.systemSetting.findUnique({ where: { key } });

      if (!setting) {
        res.status(404).json({ success: false, message: 'Setting not found' });
        return;
      }

      res.status(200).json({ success: true, data: setting });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = String(req.params.key);
      const validated = updateSettingSchema.parse(req.body);

      const existing = await prisma.systemSetting.findUnique({ where: { key } });

      const updated = await prisma.systemSetting.upsert({
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

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }
}
