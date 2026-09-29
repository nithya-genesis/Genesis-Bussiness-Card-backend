import { Router } from 'express';
import { PublicProposalController } from '../controllers/publicProposalController.js';
import { authAndPublicLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Publicly accessible endpoints via cryptographic token
router.get('/:token', PublicProposalController.getByToken);

// Support both PUT /:token and PUT /:token/modify / POST /:token/modify
router.put('/:token', authAndPublicLimiter, PublicProposalController.modify);
router.put('/:token/modify', authAndPublicLimiter, PublicProposalController.modify);
router.post('/:token/modify', authAndPublicLimiter, PublicProposalController.modify);

// Submission & Change Request endpoints
router.post('/:token/submit', authAndPublicLimiter, PublicProposalController.submit);
router.post('/:token/request-changes', authAndPublicLimiter, PublicProposalController.requestChanges);

// PDF Download
router.get('/:token/pdf', PublicProposalController.downloadPdf);

export default router;
