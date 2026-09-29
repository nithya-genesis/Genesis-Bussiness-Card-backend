"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const publicProposalController_js_1 = require("../controllers/publicProposalController.js");
const rateLimiter_js_1 = require("../middleware/rateLimiter.js");
const router = (0, express_1.Router)();
// Publicly accessible endpoints via cryptographic token
router.get('/:token', publicProposalController_js_1.PublicProposalController.getByToken);
// Support both PUT /:token and PUT /:token/modify / POST /:token/modify
router.put('/:token', rateLimiter_js_1.authAndPublicLimiter, publicProposalController_js_1.PublicProposalController.modify);
router.put('/:token/modify', rateLimiter_js_1.authAndPublicLimiter, publicProposalController_js_1.PublicProposalController.modify);
router.post('/:token/modify', rateLimiter_js_1.authAndPublicLimiter, publicProposalController_js_1.PublicProposalController.modify);
// Submission & Change Request endpoints
router.post('/:token/submit', rateLimiter_js_1.authAndPublicLimiter, publicProposalController_js_1.PublicProposalController.submit);
router.post('/:token/request-changes', rateLimiter_js_1.authAndPublicLimiter, publicProposalController_js_1.PublicProposalController.requestChanges);
// PDF Download
router.get('/:token/pdf', publicProposalController_js_1.PublicProposalController.downloadPdf);
exports.default = router;
