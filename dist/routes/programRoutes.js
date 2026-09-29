"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const programController_js_1 = require("../controllers/programController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Read operations accessible by authenticated users (BD Executive, BD Manager, System Admin)
router.get('/', auth_js_1.authenticate, programController_js_1.ProgramController.getAll);
router.get('/:id', auth_js_1.authenticate, programController_js_1.ProgramController.getById);
// Write operations restricted to BD_MANAGER and SYSTEM_ADMIN
router.post('/', auth_js_1.authenticate, (0, auth_js_1.authorize)('BD_MANAGER', 'SYSTEM_ADMIN'), programController_js_1.ProgramController.create);
router.put('/:id', auth_js_1.authenticate, (0, auth_js_1.authorize)('BD_MANAGER', 'SYSTEM_ADMIN'), programController_js_1.ProgramController.update);
router.delete('/:id', auth_js_1.authenticate, (0, auth_js_1.authorize)('BD_MANAGER', 'SYSTEM_ADMIN'), programController_js_1.ProgramController.deactivate);
exports.default = router;
