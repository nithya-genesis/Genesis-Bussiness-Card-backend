import { Router } from 'express';
import { ProgramController } from '../controllers/programController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Read operations accessible by authenticated users (BD Executive, BD Manager, System Admin)
router.get('/', authenticate, ProgramController.getAll);
router.get('/:id', authenticate, ProgramController.getById);

// Write operations restricted to BD_MANAGER and SYSTEM_ADMIN
router.post('/', authenticate, authorize('BD_MANAGER', 'SYSTEM_ADMIN'), ProgramController.create);
router.put('/:id', authenticate, authorize('BD_MANAGER', 'SYSTEM_ADMIN'), ProgramController.update);
router.delete('/:id', authenticate, authorize('BD_MANAGER', 'SYSTEM_ADMIN'), ProgramController.deactivate);

export default router;
