import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('SYSTEM_ADMIN', 'BD_MANAGER'), AuthController.listUsers);
router.post('/', authenticate, authorize('SYSTEM_ADMIN'), AuthController.createUser);
router.put('/:id', authenticate, authorize('SYSTEM_ADMIN'), AuthController.updateUser);

export default router;
