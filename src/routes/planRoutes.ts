import { Router } from 'express';
import { PlanController } from '../controllers/planController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', PlanController.list);
router.get('/:id', PlanController.getById);
router.post('/', authorize('SYSTEM_ADMIN', 'BD_MANAGER'), PlanController.create);
router.put('/:id', authorize('SYSTEM_ADMIN', 'BD_MANAGER'), PlanController.update);

export default router;
