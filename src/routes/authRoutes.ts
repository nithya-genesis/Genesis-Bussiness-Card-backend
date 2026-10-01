import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { authAndPublicLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authAndPublicLimiter, AuthController.login);
router.post('/admin-login', authAndPublicLimiter, AuthController.login);
router.get('/me', authenticate, AuthController.me);
router.get('/users', authenticate, authorize('SYSTEM_ADMIN', 'BD_MANAGER'), AuthController.listUsers);
router.post('/users', authenticate, authorize('SYSTEM_ADMIN'), AuthController.createUser);
router.put('/users/:id', authenticate, authorize('SYSTEM_ADMIN'), AuthController.updateUser);

export default router;
