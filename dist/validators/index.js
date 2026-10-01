"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingSchema = exports.rejectProposalSchema = exports.approveProposalSchema = exports.collegeModifyProposalSchema = exports.updateProposalSchema = exports.createProposalSchema = exports.calculatePriceSchema = exports.customItemInputSchema = exports.customProgramInputSchema = exports.updateTrainingProgramSchema = exports.createTrainingProgramSchema = exports.updateAddonSchema = exports.createAddonSchema = exports.updatePlanSchema = exports.createPlanSchema = exports.planModuleSchema = exports.updateCollegeSchema = exports.createCollegeSchema = exports.updateUserSchema = exports.createUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// ==================== AUTH SCHEMAS ====================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email address is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email address is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    fullName: zod_1.z.string().min(2, 'Full name is required'),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['SYSTEM_ADMIN', 'BD_MANAGER', 'BD_EXECUTIVE']).default('BD_EXECUTIVE'),
});
exports.updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['SYSTEM_ADMIN', 'BD_MANAGER', 'BD_EXECUTIVE']).optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
    password: zod_1.z.string().min(6).optional(),
});
// ==================== COLLEGE SCHEMAS ====================
exports.createCollegeSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'College name must be at least 3 characters'),
    placementOfficerName: zod_1.z.string().min(2, 'Placement Officer name is required'),
    placementOfficerEmail: zod_1.z.string().email('Valid placement officer email is required'),
    placementOfficerPhone: zod_1.z.string().min(8, 'Valid contact phone number is required'),
    address: zod_1.z.string().min(3, 'College address is required'),
    city: zod_1.z.string().min(2, 'City is required'),
    state: zod_1.z.string().min(2, 'State is required'),
    pincode: zod_1.z.string().min(4, 'Pincode is required'),
    studentCount: zod_1.z.coerce.number().int().min(1, 'Student count must be at least 1').default(100),
    notes: zod_1.z.string().optional(),
});
exports.updateCollegeSchema = exports.createCollegeSchema.partial().extend({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
// ==================== PLAN SCHEMAS ====================
exports.planModuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Module name is required'),
    hours: zod_1.z.coerce.number().int().min(0, 'Module hours must be non-negative'),
    displayOrder: zod_1.z.coerce.number().int().default(0),
});
exports.createPlanSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Plan name is required'),
    code: zod_1.z.string().min(2, 'Plan code is required').toUpperCase(),
    description: zod_1.z.string().min(5, 'Plan description is required'),
    totalHours: zod_1.z.coerce.number().int().min(1, 'Total hours must be at least 1'),
    pricingModel: zod_1.z.enum(['HOURLY', 'FIXED_PLAN', 'CUSTOM']).default('HOURLY'),
    fixedPrice: zod_1.z.coerce.number().positive().optional(),
    displayOrder: zod_1.z.coerce.number().int().default(0),
    modules: zod_1.z.array(exports.planModuleSchema).optional().default([]),
});
exports.updatePlanSchema = exports.createPlanSchema.partial().extend({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
// ==================== ADDON SCHEMAS ====================
exports.createAddonSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Add-on name is required'),
    code: zod_1.z.string().min(2, 'Add-on code is required').toUpperCase(),
    description: zod_1.z.string().min(5, 'Description is required'),
    pricingType: zod_1.z.enum(['PER_STUDENT', 'PER_HOUR', 'FIXED']).default('PER_STUDENT'),
    price: zod_1.z.coerce.number().min(0, 'Price must be non-negative'),
});
exports.updateAddonSchema = exports.createAddonSchema.partial().extend({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
// ==================== TRAINING PROGRAM SCHEMAS ====================
exports.createTrainingProgramSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Program name is required'),
    code: zod_1.z.string().min(2, 'Program code is required').toUpperCase(),
    description: zod_1.z.string().min(5, 'Description is required'),
    category: zod_1.z.string().default('CORE'),
    hours: zod_1.z.coerce.number().int().min(1, 'Hours must be at least 1').optional(),
    defaultHours: zod_1.z.coerce.number().int().min(1, 'Default hours must be at least 1').optional(),
    pricingType: zod_1.z.enum(['PER_STUDENT', 'PER_HOUR', 'FIXED']).default('PER_HOUR'),
    rate: zod_1.z.coerce.number().min(0, 'Rate must be non-negative').optional(),
    defaultPrice: zod_1.z.coerce.number().min(0, 'Default price must be non-negative').optional(),
    displayOrder: zod_1.z.coerce.number().int().default(0),
});
exports.updateTrainingProgramSchema = exports.createTrainingProgramSchema.partial().extend({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
// ==================== PRICING & PROPOSAL SCHEMAS ====================
exports.customProgramInputSchema = zod_1.z.object({
    programId: zod_1.z.string().optional(),
    programName: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    code: zod_1.z.string().optional(),
    hours: zod_1.z.coerce.number().min(0).default(0),
    pricingType: zod_1.z.enum(['PER_STUDENT', 'PER_HOUR', 'FIXED']).optional().default('PER_HOUR'),
    rate: zod_1.z.coerce.number().min(0).optional().default(40),
    unitRate: zod_1.z.coerce.number().min(0).optional(),
});
exports.customItemInputSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Item name is required'),
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.coerce.number().int().min(1).optional().default(1),
    pricingType: zod_1.z.enum(['PER_STUDENT', 'PER_HOUR', 'FIXED', 'FLAT', 'PER_UNIT']).optional().default('PER_STUDENT'),
    unitPrice: zod_1.z.coerce.number().min(0, 'Unit price must be non-negative'),
});
exports.calculatePriceSchema = zod_1.z.object({
    planId: zod_1.z.string().optional(),
    planType: zod_1.z.string().optional(),
    studentCount: zod_1.z.coerce.number().int().min(1, 'Student count must be at least 1'),
    hourlyRate: zod_1.z.coerce.number().positive().optional(),
    pricingModel: zod_1.z.enum(['HOURLY', 'FIXED_PLAN', 'CUSTOM']).optional(),
    selectedAddonIds: zod_1.z.array(zod_1.z.string()).optional().default([]),
    customProgramsData: zod_1.z.any().optional(),
    customPrograms: zod_1.z.array(zod_1.z.any()).optional().default([]),
    customItems: zod_1.z.array(exports.customItemInputSchema).optional().default([]),
    discountType: zod_1.z.enum(['FIXED', 'PERCENTAGE']).optional().default('FIXED'),
    discountValue: zod_1.z.coerce.number().min(0).optional().default(0),
    gstRate: zod_1.z.coerce.number().min(0).max(100).optional(),
});
exports.createProposalSchema = zod_1.z.object({
    collegeId: zod_1.z.string().min(1, 'Valid College ID is required'),
    planId: zod_1.z.string().optional(),
    planType: zod_1.z.string().optional(),
    studentCount: zod_1.z.coerce.number().int().min(1, 'Student count must be at least 1'),
    minStudents: zod_1.z.coerce.number().int().min(1).optional().default(50),
    maxStudents: zod_1.z.coerce.number().int().min(1).optional().default(2000),
    hourlyRate: zod_1.z.coerce.number().positive().optional(),
    pricingModel: zod_1.z.enum(['HOURLY', 'FIXED_PLAN', 'CUSTOM']).optional(),
    selectedAddonIds: zod_1.z.array(zod_1.z.string()).optional().default([]),
    customProgramsData: zod_1.z.any().optional(),
    customPrograms: zod_1.z.array(zod_1.z.any()).optional().default([]),
    customItems: zod_1.z.array(exports.customItemInputSchema).optional().default([]),
    discountType: zod_1.z.enum(['FIXED', 'PERCENTAGE']).optional().default('FIXED'),
    discountValue: zod_1.z.coerce.number().min(0).optional().default(0),
    notes: zod_1.z.string().optional(),
});
exports.updateProposalSchema = exports.createProposalSchema.partial().extend({
    status: zod_1.z.string().optional(),
});
exports.collegeModifyProposalSchema = zod_1.z.object({
    studentCount: zod_1.z.coerce.number().int().min(1, 'Student count must be at least 1'),
    selectedAddonIds: zod_1.z.array(zod_1.z.string()).optional().default([]),
    collegeNotes: zod_1.z.string().optional(),
});
exports.approveProposalSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
});
exports.rejectProposalSchema = zod_1.z.object({
    rejectionReason: zod_1.z.string().min(3, 'Rejection reason is mandatory'),
    reason: zod_1.z.string().min(3).optional(), // alias
});
// ==================== SETTINGS SCHEMA ====================
exports.updateSettingSchema = zod_1.z.object({
    value: zod_1.z.string().min(1, 'Setting value cannot be empty'),
    description: zod_1.z.string().optional(),
});
