import { z } from 'zod';

// ==================== AUTH SCHEMAS ====================
export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  role: z.enum(['SYSTEM_ADMIN', 'BD_MANAGER', 'BD_EXECUTIVE']).default('BD_EXECUTIVE'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['SYSTEM_ADMIN', 'BD_MANAGER', 'BD_EXECUTIVE']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: z.string().min(6).optional(),
});

// ==================== COLLEGE SCHEMAS ====================
export const createCollegeSchema = z.object({
  name: z.string().min(3, 'College name must be at least 3 characters'),
  placementOfficerName: z.string().min(2, 'Placement Officer name is required'),
  placementOfficerEmail: z.string().email('Valid placement officer email is required'),
  placementOfficerPhone: z.string().min(8, 'Valid contact phone number is required'),
  address: z.string().min(3, 'College address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(4, 'Pincode is required'),
  studentCount: z.coerce.number().int().min(1, 'Student count must be at least 1').default(100),
  notes: z.string().optional(),
});

export const updateCollegeSchema = createCollegeSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// ==================== PLAN SCHEMAS ====================
export const planModuleSchema = z.object({
  name: z.string().min(2, 'Module name is required'),
  hours: z.coerce.number().int().min(0, 'Module hours must be non-negative'),
  displayOrder: z.coerce.number().int().default(0),
});

export const createPlanSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  code: z.string().min(2, 'Plan code is required').toUpperCase(),
  description: z.string().min(5, 'Plan description is required'),
  totalHours: z.coerce.number().int().min(1, 'Total hours must be at least 1'),
  pricingModel: z.enum(['HOURLY', 'FIXED_PLAN', 'CUSTOM']).default('HOURLY'),
  fixedPrice: z.coerce.number().positive().optional(),
  displayOrder: z.coerce.number().int().default(0),
  modules: z.array(planModuleSchema).optional().default([]),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// ==================== ADDON SCHEMAS ====================
export const createAddonSchema = z.object({
  name: z.string().min(2, 'Add-on name is required'),
  code: z.string().min(2, 'Add-on code is required').toUpperCase(),
  description: z.string().min(5, 'Description is required'),
  pricingType: z.enum(['PER_STUDENT', 'PER_HOUR', 'FIXED']).default('PER_STUDENT'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
});

export const updateAddonSchema = createAddonSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// ==================== TRAINING PROGRAM SCHEMAS ====================
export const createTrainingProgramSchema = z.object({
  name: z.string().min(2, 'Program name is required'),
  code: z.string().min(2, 'Program code is required').toUpperCase(),
  description: z.string().min(5, 'Description is required'),
  category: z.string().default('CORE'),
  hours: z.coerce.number().int().min(1, 'Hours must be at least 1').optional(),
  defaultHours: z.coerce.number().int().min(1, 'Default hours must be at least 1').optional(),
  pricingType: z.enum(['PER_STUDENT', 'PER_HOUR', 'FIXED']).default('PER_HOUR'),
  rate: z.coerce.number().min(0, 'Rate must be non-negative').optional(),
  defaultPrice: z.coerce.number().min(0, 'Default price must be non-negative').optional(),
  displayOrder: z.coerce.number().int().default(0),
});

export const updateTrainingProgramSchema = createTrainingProgramSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// ==================== PRICING & PROPOSAL SCHEMAS ====================
export const customProgramInputSchema = z.object({
  programId: z.string().optional(),
  programName: z.string().optional(),
  name: z.string().optional(),
  code: z.string().optional(),
  hours: z.coerce.number().min(0).default(0),
  pricingType: z.enum(['PER_STUDENT', 'PER_HOUR', 'FIXED']).optional().default('PER_HOUR'),
  rate: z.coerce.number().min(0).optional().default(40),
  unitRate: z.coerce.number().min(0).optional(),
});

export const customItemInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  pricingType: z.enum(['PER_STUDENT', 'PER_HOUR', 'FIXED', 'FLAT', 'PER_UNIT']).optional().default('PER_STUDENT'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
});

export const calculatePriceSchema = z.object({
  planId: z.string().optional(),
  planType: z.string().optional(),
  studentCount: z.coerce.number().int().min(1, 'Student count must be at least 1'),
  hourlyRate: z.coerce.number().positive().optional(),
  pricingModel: z.enum(['HOURLY', 'FIXED_PLAN', 'CUSTOM']).optional(),
  selectedAddonIds: z.array(z.string()).optional().default([]),
  customProgramsData: z.any().optional(),
  customPrograms: z.array(z.any()).optional().default([]),
  customItems: z.array(customItemInputSchema).optional().default([]),
  discountType: z.enum(['FIXED', 'PERCENTAGE']).optional().default('FIXED'),
  discountValue: z.coerce.number().min(0).optional().default(0),
  gstRate: z.coerce.number().min(0).max(100).optional(),
});

export const createProposalSchema = z.object({
  collegeId: z.string().min(1, 'Valid College ID is required'),
  planId: z.string().optional(),
  planType: z.string().optional(),
  studentCount: z.coerce.number().int().min(1, 'Student count must be at least 1'),
  minStudents: z.coerce.number().int().min(1).optional().default(50),
  maxStudents: z.coerce.number().int().min(1).optional().default(2000),
  hourlyRate: z.coerce.number().positive().optional(),
  pricingModel: z.enum(['HOURLY', 'FIXED_PLAN', 'CUSTOM']).optional(),
  selectedAddonIds: z.array(z.string()).optional().default([]),
  customProgramsData: z.any().optional(),
  customPrograms: z.array(z.any()).optional().default([]),
  customItems: z.array(customItemInputSchema).optional().default([]),
  discountType: z.enum(['FIXED', 'PERCENTAGE']).optional().default('FIXED'),
  discountValue: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

export const updateProposalSchema = createProposalSchema.partial().extend({
  status: z.string().optional(),
});

export const collegeModifyProposalSchema = z.object({
  studentCount: z.coerce.number().int().min(1, 'Student count must be at least 1'),
  selectedAddonIds: z.array(z.string()).optional().default([]),
  collegeNotes: z.string().optional(),
});

export const approveProposalSchema = z.object({
  notes: z.string().optional(),
});

export const rejectProposalSchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason is mandatory'),
  reason: z.string().min(3).optional(), // alias
});

// ==================== SETTINGS SCHEMA ====================
export const updateSettingSchema = z.object({
  value: z.string().min(1, 'Setting value cannot be empty'),
  description: z.string().optional(),
});
