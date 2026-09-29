import { Router } from 'express';
import { SettingController } from '../controllers/settingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', SettingController.list);
router.get('/:key', SettingController.getByKey);
router.put('/:key', authorize('SYSTEM_ADMIN', 'BD_MANAGER'), SettingController.update);

export default router;
