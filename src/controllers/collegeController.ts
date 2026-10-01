import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';
import { createCollegeSchema, updateCollegeSchema } from '../validators/index.js';
import { generateCollegeId } from '../utils/idGenerator.js';
import { logAuditEvent } from '../services/auditService.js';

export class CollegeController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const search = (req.query.search as string || '').trim();
      const status = req.query.status as string;

      const skip = (page - 1) * limit;

      const where: any = { isDeleted: false };
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
        prisma.college.count({ where }),
        prisma.college.findMany({
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
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const college = await prisma.college.findUnique({
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
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createCollegeSchema.parse(req.body);
      const generatedId = await generateCollegeId();

      const college = await prisma.college.create({
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
          createdById: req.user!.id,
        },
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      });

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const validated = updateCollegeSchema.parse(req.body);

      const existing = await prisma.college.findUnique({ where: { id } });
      if (!existing || existing.isDeleted) {
        res.status(404).json({ success: false, message: 'College not found' });
        return;
      }

      const updated = await prisma.college.update({
        where: { id },
        data: validated,
      });

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const existing = await prisma.college.findUnique({ where: { id } });

      if (!existing || existing.isDeleted) {
        res.status(404).json({ success: false, message: 'College not found or already deleted' });
        return;
      }

      const updated = await prisma.college.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: req.user!.id,
          status: 'INACTIVE',
        },
      });

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }
}
