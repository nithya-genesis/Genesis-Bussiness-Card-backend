import { Router } from 'express';
import { CollegeController } from '../controllers/collegeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', CollegeController.list);
router.get('/:id', CollegeController.getById);
router.post('/', authorize('SYSTEM_ADMIN', 'BD_MANAGER', 'BD_EXECUTIVE'), CollegeController.create);
router.put('/:id', authorize('SYSTEM_ADMIN', 'BD_MANAGER', 'BD_EXECUTIVE'), CollegeController.update);
router.delete('/:id', authorize('SYSTEM_ADMIN', 'BD_MANAGER'), CollegeController.delete);

export default router;
