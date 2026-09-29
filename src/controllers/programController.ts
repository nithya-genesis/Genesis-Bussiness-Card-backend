import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';
import { createTrainingProgramSchema, updateTrainingProgramSchema } from '../validators/index.js';
import { logAuditEvent } from '../services/auditService.js';

export class ProgramController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { includeInactive } = req.query;
      const where: { status?: string } = {};

      if (includeInactive !== 'true') {
        where.status = 'ACTIVE';
      }

      const programs = await prisma.trainingProgram.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      const normalized = programs.map((p) => ({
        ...p,
        hours: p.hours || p.defaultHours || 15,
        defaultHours: p.hours || p.defaultHours || 15,
        rate: p.rate !== undefined ? p.rate : (p.defaultPrice !== undefined ? p.defaultPrice : 40),
        defaultPrice: p.rate !== undefined ? p.rate : (p.defaultPrice !== undefined ? p.defaultPrice : 40),
      }));

      res.status(200).json({
        success: true,
        data: normalized,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const program = await prisma.trainingProgram.findUnique({
        where: { id: String(id) },
      });

      if (!program) {
        res.status(404).json({ success: false, message: 'Training Program not found' });
        return;
      }

      const normalized = {
        ...program,
        hours: program.hours || program.defaultHours || 15,
        defaultHours: program.hours || program.defaultHours || 15,
        rate: program.rate !== undefined ? program.rate : (program.defaultPrice !== undefined ? program.defaultPrice : 40),
        defaultPrice: program.rate !== undefined ? program.rate : (program.defaultPrice !== undefined ? program.defaultPrice : 40),
      };

      res.status(200).json({
        success: true,
        data: normalized,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createTrainingProgramSchema.parse(req.body);

      const existing = await prisma.trainingProgram.findUnique({
        where: { code: validated.code },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: `Program with code '${validated.code}' already exists.`,
          code: 'PROGRAM_CODE_EXISTS',
        });
        return;
      }

      const hours = validated.hours || validated.defaultHours || 15;
      const rate = validated.rate !== undefined ? validated.rate : (validated.defaultPrice !== undefined ? validated.defaultPrice : 40);

      const program = await prisma.trainingProgram.create({
        data: {
          name: validated.name,
          code: validated.code,
          description: validated.description,
          category: validated.category,
          hours,
          defaultHours: hours,
          pricingType: validated.pricingType,
          rate,
          defaultPrice: rate,
          displayOrder: validated.displayOrder,
          status: 'ACTIVE',
        },
      });

      await logAuditEvent({
        userId: req.user?.userId || null,
        action: 'PROGRAM_CREATED',
        entity: 'PROGRAM',
        entityId: program.id,
        newValue: program,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Training Program added to catalogue successfully',
        data: program,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateTrainingProgramSchema.parse(req.body);

      const existing = await prisma.trainingProgram.findUnique({
        where: { id: String(id) },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Training Program not found' });
        return;
      }

      const updateData: any = { ...validated };
      const hours = validated.hours !== undefined ? validated.hours : validated.defaultHours;
      const rate = validated.rate !== undefined ? validated.rate : validated.defaultPrice;

      if (hours !== undefined) {
        updateData.hours = hours;
        updateData.defaultHours = hours;
      }
      if (rate !== undefined) {
        updateData.rate = rate;
        updateData.defaultPrice = rate;
      }

      const updated = await prisma.trainingProgram.update({
        where: { id: String(id) },
        data: updateData,
      });

      await logAuditEvent({
        userId: req.user?.userId || null,
        action: 'PROGRAM_UPDATED',
        entity: 'PROGRAM',
        entityId: updated.id,
        oldValue: existing,
        newValue: updated,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Training Program updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await prisma.trainingProgram.findUnique({
        where: { id: String(id) },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Training Program not found' });
        return;
      }

      const deactivated = await prisma.trainingProgram.update({
        where: { id: String(id) },
        data: { status: 'INACTIVE' },
      });

      await logAuditEvent({
        userId: req.user?.userId || null,
        action: 'PROGRAM_DEACTIVATED',
        entity: 'PROGRAM',
        entityId: deactivated.id,
        oldValue: { status: existing.status },
        newValue: { status: 'INACTIVE' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Training Program deactivated successfully',
        data: deactivated,
      });
    } catch (err) {
      next(err);
    }
  }
}
