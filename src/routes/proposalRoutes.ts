import { Router } from 'express';
import { ProposalController } from '../controllers/proposalController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Pricing Calculation (accessible to authenticated BD users for live preview)
router.post('/calculate', ProposalController.calculate);

// Pending Manager Approval specific listing (BD Manager only)
router.get('/pending-approval', authorize('BD_MANAGER'), ProposalController.getPendingApproval);

// Proposal CRUD & Actions
router.get('/', authorize('BD_MANAGER', 'BD_EXECUTIVE', 'SYSTEM_ADMIN'), ProposalController.list);
router.get('/:id', authorize('BD_MANAGER', 'BD_EXECUTIVE', 'SYSTEM_ADMIN'), ProposalController.getById);
router.post('/', authorize('BD_MANAGER', 'BD_EXECUTIVE'), ProposalController.create);
router.put('/:id', authorize('BD_MANAGER', 'BD_EXECUTIVE'), ProposalController.update);

// Shareable Link & QR Code
router.post('/:id/share', authorize('BD_MANAGER', 'BD_EXECUTIVE'), ProposalController.generateShareLink);
router.get('/:id/qr', authorize('BD_MANAGER', 'BD_EXECUTIVE'), ProposalController.getQrCode);
router.get('/:id/qr/download', authorize('BD_MANAGER', 'BD_EXECUTIVE'), ProposalController.downloadQrImage);

// Approval Lifecycle (BD Manager only)
router.post('/:id/approve', authorize('BD_MANAGER'), ProposalController.approve);
router.post('/:id/reject', authorize('BD_MANAGER'), ProposalController.reject);

// Archive / Soft Delete (BD Manager only)
router.delete('/:id', authorize('BD_MANAGER'), ProposalController.archive);
router.post('/:id/archive', authorize('BD_MANAGER'), ProposalController.archive);

// PDF Generation (BD Manager, BD Executive, and System Admin)
router.get('/:id/pdf', authorize('BD_MANAGER', 'BD_EXECUTIVE', 'SYSTEM_ADMIN'), ProposalController.downloadPdf);

export default router;
