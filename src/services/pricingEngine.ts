import { prisma } from '../models/prisma.js';
import { config } from '../config/index.js';

export interface CustomProgramInput {
  programId?: string;
  programName?: string;
  name?: string;
  code?: string;
  hours: number;
  pricingType?: 'PER_STUDENT' | 'PER_HOUR' | 'FIXED';
  rate?: number;
  unitRate?: number;
}

export interface CustomItemInput {
  id?: string;
  name: string;
  description?: string;
  quantity?: number;
  pricingType?: 'PER_STUDENT' | 'PER_HOUR' | 'FIXED' | 'FLAT' | 'PER_UNIT';
  unitPrice: number;
}

export interface CalculatedCustomItemResult {
  name: string;
  description?: string;
  quantity: number;
  pricingType: string;
  unitPrice: number;
  calculatedCost: number;
}

export interface CalculatedProgramResult {
  programId?: string;
  name: string;
  hours: number;
  pricingType: string;
  rate: number;
  calculatedCost: number;
}

export interface PricingCalculationInput {
  planId?: string;
  planType?: string;
  studentCount: number;
  hourlyRate?: number; // Optional override (for custom rate)
  pricingModel?: 'HOURLY' | 'FIXED_PLAN' | 'CUSTOM';
  selectedAddonIds?: string[];
  customPrograms?: any[];
  customProgramsData?: any;
  customItems?: CustomItemInput[];
  discountType?: 'FIXED' | 'PERCENTAGE';
  discountValue?: number;
  gstRate?: number; // Optional GST rate override, defaults to system setting or 18%
}

export interface CalculatedAddonResult {
  addonId: string;
  name: string;
  code: string;
  pricingType: string;
  price: number;
  calculatedCost: number;
}

export interface PricingCalculationResult {
  planId: string;
  planName: string;
  planCode: string;
  totalHours: number;
  studentCount: number;
  pricingModel: string;
  effectiveHourlyRate: number;
  baseTrainingCost: number;
  customPrograms?: CalculatedProgramResult[];
  addons: CalculatedAddonResult[];
  addonsTotalCost: number;
  customItems?: CalculatedCustomItemResult[];
  customItemsTotalCost: number;
  subtotal: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  costPerStudentBeforeGst: number;
  gstRate: number;
  gstAmount: number;
  gstPerStudent: number;
  grandTotal: number;
  finalCostPerStudent: number;
  finalTotal: number; // Backward compatibility alias to grandTotal
  currency: string;
}

/**
 * Retrieves the live system-wide default hourly rate from DB settings with fallback to env
 */
export async function getSystemDefaultHourlyRate(): Promise<number> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'DEFAULT_HOURLY_RATE' },
    });
    if (setting && setting.value) {
      const parsed = parseFloat(setting.value);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback on failure / pre-migration
  }
  return config.defaultHourlyRate;
}

/**
 * Retrieves the live system-wide default GST percentage (e.g. 18.0)
 */
export async function getSystemDefaultGstRate(): Promise<number> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'DEFAULT_GST_RATE' },
    });
    if (setting && setting.value) {
      const parsed = parseFloat(setting.value);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback on failure
  }
  return 18.0;
}

/**
 * Pure Pricing Calculation Engine
 * Server-side source of truth for all proposals
 */
export async function calculateProposalPricing(
  input: PricingCalculationInput
): Promise<PricingCalculationResult> {
  const {
    planId,
    studentCount,
    hourlyRate,
    pricingModel: overridePricingModel,
    selectedAddonIds = [],
    customPrograms = [],
    customItems = [],
    discountType = 'FIXED',
    discountValue = 0,
    gstRate: customGstRate,
  } = input;

  if (studentCount <= 0) {
    throw new Error('Student count must be greater than 0');
  }

  // Extract raw custom programs from either customPrograms or customProgramsData
  const rawPrograms = (input.customPrograms && input.customPrograms.length > 0)
    ? input.customPrograms
    : (input.customProgramsData || []);
  let parsedCustomPrograms: any[] = [];
  if (Array.isArray(rawPrograms)) {
    parsedCustomPrograms = rawPrograms;
  } else if (typeof rawPrograms === 'string') {
    try {
      parsedCustomPrograms = JSON.parse(rawPrograms);
    } catch {
      parsedCustomPrograms = [];
    }
  }

  // 1. Fetch Plan details
  let plan = null;
  const isExplicitCustom = input.planType === 'CUSTOM' || planId === 'CUSTOM' || (!planId && parsedCustomPrograms.length > 0);

  if (planId && !isExplicitCustom) {
    plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { modules: true },
    });

    if (!plan) {
      // Check by code
      plan = await prisma.plan.findUnique({
        where: { code: planId.toUpperCase() },
        include: { modules: true },
      });
    }
  }

  const isCustomPlan = isExplicitCustom || (plan && plan.code === 'CUSTOM') || (!plan && parsedCustomPrograms.length > 0);

  if (isCustomPlan && (!plan || plan.code !== 'CUSTOM')) {
    plan = await prisma.plan.findUnique({
      where: { code: 'CUSTOM' },
      include: { modules: true },
    });
  }

  if (!plan) {
    plan = {
      id: 'CUSTOM',
      name: 'Custom Plan',
      code: 'CUSTOM',
      description: 'Modular custom training curriculum',
      totalHours: 0,
      pricingModel: 'CUSTOM',
      fixedPrice: null,
      status: 'ACTIVE',
      modules: [],
    } as any;
  }

  const defaultHourlyRate = await getSystemDefaultHourlyRate();
  const defaultGstRate = customGstRate !== undefined ? customGstRate : await getSystemDefaultGstRate();
  const pricingModel = isCustomPlan ? 'CUSTOM' : (overridePricingModel || plan.pricingModel || 'HOURLY');

  let effectiveHourlyRate = defaultHourlyRate;
  let baseTrainingCost = 0;
  let totalHours = plan.totalHours || 0;
  const calculatedPrograms: CalculatedProgramResult[] = [];

  // Custom Plan calculation
  if (isCustomPlan) {
    if (parsedCustomPrograms && parsedCustomPrograms.length > 0) {
      let customTotalHours = 0;
      let customBaseCost = 0;

      for (const prog of parsedCustomPrograms) {
        let pType = prog.pricingType;
        let pRate = prog.rate !== undefined ? prog.rate : prog.unitRate;
        let pHours = prog.hours;
        let pName = prog.name || prog.programName;

        // DB Fallback if fields are missing
        if (prog.programId && (pRate === undefined || pHours === undefined || !pType || !pName)) {
          try {
            const dbProg = await prisma.trainingProgram.findUnique({
              where: { id: prog.programId },
            });
            if (dbProg) {
              pType = pType || dbProg.pricingType;
              const anyProg = dbProg as any;
              pRate = pRate !== undefined ? pRate : (anyProg.rate ?? anyProg.defaultPrice ?? (anyProg.pricingType === 'PER_STUDENT' ? (anyProg.defaultPerStudentRate || 200) : (anyProg.defaultHourlyRate || defaultHourlyRate)));
              pHours = pHours !== undefined ? pHours : (anyProg.hours ?? anyProg.defaultHours ?? 10);
              pName = pName || dbProg.name;
            }
          } catch {
            // ignore
          }
        }

        pType = pType || 'PER_HOUR';
        pRate = pRate !== undefined ? Number(pRate) : defaultHourlyRate;
        pHours = pHours !== undefined ? Number(pHours) : 0;
        pName = pName || 'Custom Program';

        customTotalHours += pHours;

        let cost = 0;
        if (pType === 'PER_STUDENT') {
          cost = pRate * studentCount;
        } else if (pType === 'FIXED') {
          cost = pRate;
        } else {
          // PER_HOUR: hours * rate * studentCount
          cost = pHours * studentCount * pRate;
        }

        customBaseCost += cost;
        calculatedPrograms.push({
          programId: prog.programId,
          name: pName,
          hours: pHours,
          pricingType: pType,
          rate: pRate,
          calculatedCost: cost,
        });
      }

      totalHours = customTotalHours;
      baseTrainingCost = customBaseCost;
      effectiveHourlyRate = totalHours > 0 && studentCount > 0
        ? Math.round((baseTrainingCost / (totalHours * studentCount)) * 100) / 100
        : defaultHourlyRate;
    } else {
      totalHours = 0;
      baseTrainingCost = 0;
      effectiveHourlyRate = defaultHourlyRate;
    }
  } else if (pricingModel === 'FIXED_PLAN' && plan.fixedPrice !== null && plan.fixedPrice !== undefined) {
    baseTrainingCost = plan.fixedPrice;
    effectiveHourlyRate = plan.totalHours > 0 && studentCount > 0 
      ? plan.fixedPrice / (plan.totalHours * studentCount) 
      : defaultHourlyRate;
  } else {
    // Default HOURLY strategy: Hours × Students × Rate
    effectiveHourlyRate = hourlyRate !== undefined && hourlyRate > 0 ? hourlyRate : defaultHourlyRate;
    baseTrainingCost = plan.totalHours * studentCount * effectiveHourlyRate;
  }

  // 2. Fetch and calculate Add-ons
  const calculatedAddons: CalculatedAddonResult[] = [];
  let addonsTotalCost = 0;

  if (selectedAddonIds.length > 0) {
    const addons = await prisma.addon.findMany({
      where: {
        id: { in: selectedAddonIds },
        status: 'ACTIVE',
      },
    });

    for (const addon of addons) {
      let itemCost = 0;
      if (addon.pricingType === 'PER_STUDENT') {
        itemCost = addon.price * studentCount;
      } else if (addon.pricingType === 'PER_HOUR') {
        itemCost = addon.price * totalHours;
      } else {
        // FIXED
        itemCost = addon.price;
      }

      calculatedAddons.push({
        addonId: addon.id,
        name: addon.name,
        code: addon.code,
        pricingType: addon.pricingType,
        price: addon.price,
        calculatedCost: itemCost,
      });

      addonsTotalCost += itemCost;
    }
  }

  // 3. Calculate Custom Items
  const calculatedCustomItems: CalculatedCustomItemResult[] = [];
  let customItemsTotalCost = 0;

  if (customItems && customItems.length > 0) {
    for (const item of customItems) {
      if (!item.name || item.unitPrice < 0) continue;
      const pType = item.pricingType || 'PER_STUDENT';
      let itemCost = 0;
      let effectiveQty = 1;

      if (pType === 'PER_STUDENT') {
        effectiveQty = studentCount;
        itemCost = item.unitPrice * studentCount;
      } else if (pType === 'PER_HOUR') {
        effectiveQty = totalHours;
        itemCost = item.unitPrice * totalHours;
      } else {
        effectiveQty = item.quantity && item.quantity > 0 ? item.quantity : 1;
        itemCost = item.unitPrice * effectiveQty;
      }

      calculatedCustomItems.push({
        name: item.name,
        description: item.description,
        quantity: effectiveQty,
        pricingType: pType,
        unitPrice: item.unitPrice,
        calculatedCost: itemCost,
      });

      customItemsTotalCost += itemCost;
    }
  }

  // 4. Compute Subtotal and Discounts
  const subtotal = baseTrainingCost + addonsTotalCost + customItemsTotalCost;
  let discountAmount = 0;

  if (discountValue > 0) {
    if (discountType === 'PERCENTAGE') {
      discountAmount = Math.round(((subtotal * Math.min(discountValue, 100)) / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(discountValue, subtotal);
    }
  }

  // 5. Compute Taxable Amount, Cost per student, GST (18%) and Grand Total
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const costPerStudentBeforeGst = studentCount > 0 ? Math.round((taxableAmount / studentCount) * 100) / 100 : 0;
  const gstRate = defaultGstRate;
  const gstAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100; // Round to 2 decimals
  const gstPerStudent = studentCount > 0 ? Math.round((gstAmount / studentCount) * 100) / 100 : 0;
  const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;
  const finalCostPerStudent = studentCount > 0 ? Math.round((grandTotal / studentCount) * 100) / 100 : 0;
  const finalTotal = grandTotal;

  return {
    planId: plan.id,
    planName: plan.name,
    planCode: plan.code,
    totalHours,
    studentCount,
    pricingModel,
    effectiveHourlyRate,
    baseTrainingCost,
    customPrograms: calculatedPrograms.length > 0 ? calculatedPrograms : undefined,
    addons: calculatedAddons,
    addonsTotalCost,
    customItems: calculatedCustomItems.length > 0 ? calculatedCustomItems : undefined,
    customItemsTotalCost,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    taxableAmount,
    costPerStudentBeforeGst,
    gstRate,
    gstAmount,
    gstPerStudent,
    grandTotal,
    finalCostPerStudent,
    finalTotal,
    currency: 'INR',
  };
}
