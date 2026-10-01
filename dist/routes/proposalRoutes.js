"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proposalController_js_1 = require("../controllers/proposalController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
// Pricing Calculation (accessible to authenticated BD users for live preview)
router.post('/calculate', proposalController_js_1.ProposalController.calculate);
// Pending Manager Approval specific listing (BD Manager only)
router.get('/pending-approval', (0, auth_js_1.authorize)('BD_MANAGER'), proposalController_js_1.ProposalController.getPendingApproval);
// Proposal CRUD & Actions
router.get('/', (0, auth_js_1.authorize)('BD_MANAGER', 'BD_EXECUTIVE', 'SYSTEM_ADMIN'), proposalController_js_1.ProposalController.list);
router.get('/:id', (0, auth_js_1.authorize)('BD_MANAGER', 'BD_EXECUTIVE', 'SYSTEM_ADMIN'), proposalController_js_1.ProposalController.getById);
router.post('/', (0, auth_js_1.authorize)('BD_MANAGER', 'BD_EXECUTIVE'), proposalController_js_1.ProposalController.create);
router.put('/:id', (0, auth_js_1.authorize)('BD_MANAGER', 'BD_EXECUTIVE'), proposalController_js_1.ProposalController.update);
// Shareable Link & QR Code
router.post('/:id/share', (0, auth_js_1.authorize)('BD_MANAGER', 'BD_EXECUTIVE'), proposalController_js_1.ProposalController.generateShareLink);
router.get('/:id/qr', (0, auth_js_1.authorize)('BD_MANAGER', 'BD_EXECUTIVE'), proposalController_js_1.ProposalController.getQrCode);
router.get('/:id/qr/download', (0, auth_js_1.authorize)('BD_MANAGER', 'BD_EXECUTIVE'), proposalController_js_1.ProposalController.downloadQrImage);
// Approval Lifecycle (BD Manager only)
router.post('/:id/approve', (0, auth_js_1.authorize)('BD_MANAGER'), proposalController_js_1.ProposalController.approve);
router.post('/:id/reject', (0, auth_js_1.authorize)('BD_MANAGER'), proposalController_js_1.ProposalController.reject);
// Archive / Soft Delete (BD Manager only)
router.delete('/:id', (0, auth_js_1.authorize)('BD_MANAGER'), proposalController_js_1.ProposalController.archive);
router.post('/:id/archive', (0, auth_js_1.authorize)('BD_MANAGER'), proposalController_js_1.ProposalController.archive);
// PDF Generation (BD Manager, BD Executive, and System Admin)
router.get('/:id/pdf', (0, auth_js_1.authorize)('BD_MANAGER', 'BD_EXECUTIVE', 'SYSTEM_ADMIN'), proposalController_js_1.ProposalController.downloadPdf);
exports.default = router;
