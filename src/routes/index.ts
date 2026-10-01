import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import collegeRoutes from './collegeRoutes.js';
import planRoutes from './planRoutes.js';
import programRoutes from './programRoutes.js';
import addonRoutes from './addonRoutes.js';
import proposalRoutes from './proposalRoutes.js';
import publicProposalRoutes from './publicProposalRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import settingRoutes from './settingRoutes.js';
import auditRoutes from './auditRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/colleges', collegeRoutes);
router.use('/plans', planRoutes);
router.use('/programs', programRoutes);
router.use('/addons', addonRoutes);
router.use('/proposals', proposalRoutes);
router.use('/public/proposals', publicProposalRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
