import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('SYSTEM_ADMIN', 'BD_MANAGER'));

router.get('/', AuditController.list);

export default router;
