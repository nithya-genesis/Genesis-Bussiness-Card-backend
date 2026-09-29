import { calculateProposalPricing } from '../services/pricingEngine.js';
import { prisma } from '../models/prisma.js';

describe('Genesis Dynamic Pricing Engine with 18% GST', () => {
  let basePlanId: string;
  let standardPlanId: string;
  let premiumPlanId: string;
  let mockInterviewAddonId: string;
  let resumeWorkshopAddonId: string;

  beforeAll(async () => {
    const plans = await prisma.plan.findMany();
    const basePlan = plans.find((p) => p.code === 'BASE')!;
    const standardPlan = plans.find((p) => p.code === 'STANDARD')!;
    const premiumPlan = plans.find((p) => p.code === 'PREMIUM')!;

    basePlanId = basePlan.id;
    standardPlanId = standardPlan.id;
    premiumPlanId = premiumPlan.id;

    const addons = await prisma.addon.findMany();
    const mockAddon = addons.find((a) => a.code === 'MOCK_INTERVIEWS')!;
    const resumeAddon = addons.find((a) => a.code === 'RESUME_WORKSHOP')!;

    mockInterviewAddonId = mockAddon.id;
    resumeWorkshopAddonId = resumeAddon.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Base Plan: 30 × 100 × ₹40 = ₹1,20,000, GST = ₹21,600, Grand Total = ₹1,41,600', async () => {
    const result = await calculateProposalPricing({
      planId: basePlanId,
      studentCount: 100,
      hourlyRate: 40,
    });

    expect(result.totalHours).toBe(30);
    expect(result.studentCount).toBe(100);
    expect(result.effectiveHourlyRate).toBe(40);
    expect(result.baseTrainingCost).toBe(120000);
    expect(result.subtotal).toBe(120000);
    expect(result.taxableAmount).toBe(120000);
    expect(result.gstRate).toBe(18);
    expect(result.gstAmount).toBe(21600);
    expect(result.grandTotal).toBe(141600);
    expect(result.finalTotal).toBe(141600);
  });

  test('Standard Plan: 48 × 100 × ₹40 = ₹1,92,000, GST = ₹34,560, Grand Total = ₹2,26,560', async () => {
    const result = await calculateProposalPricing({
      planId: standardPlanId,
      studentCount: 100,
      hourlyRate: 40,
    });

    expect(result.totalHours).toBe(48);
    expect(result.studentCount).toBe(100);
    expect(result.effectiveHourlyRate).toBe(40);
    expect(result.baseTrainingCost).toBe(192000);
    expect(result.subtotal).toBe(192000);
    expect(result.taxableAmount).toBe(192000);
    expect(result.gstRate).toBe(18);
    expect(result.gstAmount).toBe(34560);
    expect(result.grandTotal).toBe(226560);
    expect(result.finalTotal).toBe(226560);
  });

  test('Premium Plan: 60 × 100 × ₹40 = ₹2,40,000, GST = ₹43,200, Grand Total = ₹2,83,200', async () => {
    const result = await calculateProposalPricing({
      planId: premiumPlanId,
      studentCount: 100,
      hourlyRate: 40,
    });

    expect(result.totalHours).toBe(60);
    expect(result.studentCount).toBe(100);
    expect(result.effectiveHourlyRate).toBe(40);
    expect(result.baseTrainingCost).toBe(240000);
    expect(result.subtotal).toBe(240000);
    expect(result.taxableAmount).toBe(240000);
    expect(result.gstRate).toBe(18);
    expect(result.gstAmount).toBe(43200);
    expect(result.grandTotal).toBe(283200);
    expect(result.finalTotal).toBe(283200);
  });

  test('Section 50 Test Case: Premium 60h × 250 students and college increase to 300 with 18% GST', async () => {
    const initial = await calculateProposalPricing({
      planId: premiumPlanId,
      studentCount: 250,
      hourlyRate: 40,
    });
    expect(initial.baseTrainingCost).toBe(600000);
    expect(initial.taxableAmount).toBe(600000);
    expect(initial.gstAmount).toBe(108000);
    expect(initial.grandTotal).toBe(708000);

    const updated = await calculateProposalPricing({
      planId: premiumPlanId,
      studentCount: 300,
      hourlyRate: 40,
    });
    expect(updated.baseTrainingCost).toBe(720000);
    expect(updated.taxableAmount).toBe(720000);
    expect(updated.gstAmount).toBe(129600);
    expect(updated.grandTotal).toBe(849600);
  });

  test('Discount applied before GST: Subtotal ₹8,28,000 - Discount ₹4,14,000 = Taxable ₹4,14,000, GST ₹74,520, Grand Total ₹4,88,520', async () => {
    // 60h × 345 students @ ₹40 = 828,000 subtotal
    const result = await calculateProposalPricing({
      planId: premiumPlanId,
      studentCount: 345,
      hourlyRate: 40,
      discountType: 'FIXED',
      discountValue: 414000,
    });

    expect(result.subtotal).toBe(828000);
    expect(result.discountAmount).toBe(414000);
    expect(result.taxableAmount).toBe(414000);
    expect(result.gstRate).toBe(18);
    expect(result.gstAmount).toBe(74520);
    expect(result.grandTotal).toBe(488520);
  });

  test('Pricing with Add-ons (Mock Interviews ₹500/student + Resume Workshop ₹150/student) + 18% GST', async () => {
    const result = await calculateProposalPricing({
      planId: premiumPlanId,
      studentCount: 200,
      hourlyRate: 40,
      selectedAddonIds: [mockInterviewAddonId, resumeWorkshopAddonId],
    });

    // Base: 60 * 200 * 40 = 480,000
    // Mock: 500 * 200 = 100,000
    // Resume: 150 * 200 = 30,000
    // Total Addons = 130,000
    // Subtotal = 610,000
    // GST (18%) = 109,800
    // Grand Total = 719,800
    expect(result.baseTrainingCost).toBe(480000);
    expect(result.addonsTotalCost).toBe(130000);
    expect(result.subtotal).toBe(610000);
    expect(result.taxableAmount).toBe(610000);
    expect(result.gstAmount).toBe(109800);
    expect(result.grandTotal).toBe(719800);
    expect(result.addons.length).toBe(2);
  });

  test('Custom Hourly Rate calculation (₹35/hr) + 18% GST', async () => {
    const result = await calculateProposalPricing({
      planId: standardPlanId,
      studentCount: 200,
      hourlyRate: 35,
      pricingModel: 'CUSTOM',
    });

    // 48 * 200 * 35 = 336,000
    // GST 18% = 60,480
    // Grand Total = 396,480
    expect(result.effectiveHourlyRate).toBe(35);
    expect(result.baseTrainingCost).toBe(336000);
    expect(result.taxableAmount).toBe(336000);
    expect(result.gstAmount).toBe(60480);
    expect(result.grandTotal).toBe(396480);
  });

  test('Custom Plan with Modular Programs Catalogue + 18% GST', async () => {
    const customPrograms = [
      { name: 'Soft Skills & Corporate Readiness', hours: 15, pricingType: 'PER_HOUR' as const, rate: 40 },
      { name: 'Technical Training', hours: 25, pricingType: 'PER_HOUR' as const, rate: 50 },
      { name: 'Resume & Portfolio Development', hours: 8, pricingType: 'PER_STUDENT' as const, rate: 100 },
    ];

    const result = await calculateProposalPricing({
      planId: 'CUSTOM',
      studentCount: 100,
      customPrograms,
    });

    // Hours = 15 + 25 + 8 = 48 hours
    // Prog 1: 15 * 100 * 40 = 60,000
    // Prog 2: 25 * 100 * 50 = 125,000
    // Prog 3: 100 * 100 = 10,000
    // Base Training Cost = 195,000
    // Subtotal = 195,000
    // Taxable = 195,000
    // GST @ 18% = 35,100
    // Grand Total = 230,100
    // Cost per student before GST = 1,950
    // Final Cost per student = 2,301
    expect(result.totalHours).toBe(48);
    expect(result.baseTrainingCost).toBe(195000);
    expect(result.subtotal).toBe(195000);
    expect(result.taxableAmount).toBe(195000);
    expect(result.gstAmount).toBe(35100);
    expect(result.grandTotal).toBe(230100);
    expect(result.costPerStudentBeforeGst).toBe(1950);
    expect(result.finalCostPerStudent).toBe(2301);
  });

  test('Section 48 Test Case: 150 students with Custom Plan (Tech Skill-Up 30h @ ₹200/std + Interview 10h @ ₹40/hr + Resume 8h @ ₹40/hr) = ₹1,38,000 / 48 hrs', async () => {
    const customPrograms = [
      { name: 'Technical Skill-Up Program', hours: 30, pricingType: 'PER_STUDENT' as const, rate: 200 },
      { name: 'Interview Preparation', hours: 10, pricingType: 'PER_HOUR' as const, rate: 40 },
      { name: 'Resume & Portfolio Development', hours: 8, pricingType: 'PER_HOUR' as const, rate: 40 },
    ];

    const result = await calculateProposalPricing({
      planId: 'CUSTOM',
      studentCount: 150,
      customProgramsData: customPrograms,
    });

    // Tech Skill-Up: 200 * 150 = 30,000
    // Interview: 10 * 40 * 150 = 60,000
    // Resume: 8 * 40 * 150 = 48,000
    // Total Hours = 30 + 10 + 8 = 48
    // Base Training Total = 138,000
    // Taxable Amount = 138,000
    // Cost Per Student Before GST = 138,000 / 150 = 920
    // GST @ 18% = 24,840
    // Grand Total = 162,840
    expect(result.totalHours).toBe(48);
    expect(result.baseTrainingCost).toBe(138000);
    expect(result.subtotal).toBe(138000);
    expect(result.taxableAmount).toBe(138000);
    expect(result.costPerStudentBeforeGst).toBe(920);
    expect(result.gstAmount).toBe(24840);
    expect(result.grandTotal).toBe(162840);
  });

  test('Custom Items (e.g. Industry Visit 400 × ₹250) + Step 5 Per-Student Metrics', async () => {
    // 400 students on Premium Plan (60h @ ₹40 = 960,000)
    // Custom item: Industry Visit 400 × ₹250 = 100,000
    // Discount: 260,000
    // Subtotal: 1,060,000
    // Taxable Amount: 800,000
    // Cost Per Student Before GST: ₹2,000
    // GST @ 18%: ₹1,44,000
    // GST Per Student: ₹360
    // Grand Total: ₹9,44,000
    // Final Cost Per Student: ₹2,360
    const result = await calculateProposalPricing({
      planId: premiumPlanId,
      studentCount: 400,
      hourlyRate: 40,
      customItems: [
        {
          name: 'Industry Visit & Practical Lab Tour',
          quantity: 400,
          pricingType: 'PER_STUDENT',
          unitPrice: 250,
        },
      ],
      discountType: 'FIXED',
      discountValue: 260000,
    });

    expect(result.baseTrainingCost).toBe(960000);
    expect(result.customItemsTotalCost).toBe(100000);
    expect(result.subtotal).toBe(1060000);
    expect(result.taxableAmount).toBe(800000);
    expect(result.costPerStudentBeforeGst).toBe(2000);
    expect(result.gstAmount).toBe(144000);
    expect(result.gstPerStudent).toBe(360);
    expect(result.grandTotal).toBe(944000);
    expect(result.finalCostPerStudent).toBe(2360);
  });

  test('Invalid student count throws Error', async () => {
    await expect(
      calculateProposalPricing({
        planId: basePlanId,
        studentCount: 0,
      })
    ).rejects.toThrow('Student count must be greater than 0');
  });
});
