import { Router } from 'express';
import { AddonController } from '../controllers/addonController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', AddonController.list);
router.get('/:id', AddonController.getById);
router.post('/', authorize('SYSTEM_ADMIN', 'BD_MANAGER'), AddonController.create);
router.put('/:id', authorize('SYSTEM_ADMIN', 'BD_MANAGER'), AddonController.update);

export default router;
