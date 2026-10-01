import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Genesis Business Card Database Seeding (Phase 2)...');

  // 1. Clean existing records in sequence (for fresh reproducible seed)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.proposalVersion.deleteMany();
  await prisma.proposalCustomItem.deleteMany();
  await prisma.proposalAddon.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.college.deleteMany();
  await prisma.planModule.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.trainingProgram.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users with strict Phase 2 Roles
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
  const managerPasswordHash = await bcrypt.hash('Manager@123456', salt);
  const bdPasswordHash = await bcrypt.hash('Bd@123456', salt);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@genesistraining.in',
      passwordHash: adminPasswordHash,
      fullName: 'Vikramaditya Sharma (System Admin)',
      phone: '+91 98765 00001',
      role: 'SYSTEM_ADMIN',
      status: 'ACTIVE',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@genesistraining.in',
      passwordHash: managerPasswordHash,
      fullName: 'Ananya Deshmukh (BD Manager)',
      phone: '+91 98765 00002',
      role: 'BD_MANAGER',
      status: 'ACTIVE',
    },
  });

  const bdUser = await prisma.user.create({
    data: {
      email: 'bd@genesistraining.in',
      passwordHash: bdPasswordHash,
      fullName: 'Rahul Verma (BD Executive)',
      phone: '+91 98765 00003',
      role: 'BD_EXECUTIVE',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seeded Users: System Admin, BD Manager, BD Executive');

  // 3. Seed System Settings
  const defaultSettings = [
    {
      key: 'DEFAULT_HOURLY_RATE',
      value: '40',
      description: 'Default training hourly rate per student in INR',
      valueType: 'NUMBER',
    },
    {
      key: 'DEFAULT_GST_RATE',
      value: '18',
      description: 'Default Goods & Services Tax (GST) percentage',
      valueType: 'NUMBER',
    },
    {
      key: 'CURRENCY',
      value: 'INR',
      description: 'Base platform currency code',
      valueType: 'STRING',
    },
    {
      key: 'PROPOSAL_VALIDITY_DAYS',
      value: '30',
      description: 'Standard validity period for generated proposals in days',
      valueType: 'NUMBER',
    },
    {
      key: 'MIN_STUDENTS_DEFAULT',
      value: '50',
      description: 'Default minimum student enrollment limit per proposal',
      valueType: 'NUMBER',
    },
    {
      key: 'MAX_STUDENTS_DEFAULT',
      value: '2000',
      description: 'Default maximum student enrollment limit per proposal',
      valueType: 'NUMBER',
    },
    {
      key: 'COMPANY_NAME',
      value: 'Genesis Training & Placement Solutions',
      description: 'Registered business brand name',
      valueType: 'STRING',
    },
    {
      key: 'COMPANY_EMAIL',
      value: 'partnerships@genesistraining.in',
      description: 'Corporate partnerships email',
      valueType: 'STRING',
    },
    {
      key: 'COMPANY_PHONE',
      value: '+91 98765 43210',
      description: 'Corporate telephone contact',
      valueType: 'STRING',
    },
    {
      key: 'COMPANY_ADDRESS',
      value: 'Genesis Tower, Level 4, Tech Park Boulevard, Bengaluru, Karnataka - 560100',
      description: 'Corporate registered address',
      valueType: 'STRING',
    },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.create({ data: s });
  }
  console.log('✅ Seeded System Settings');

  // 4. Seed Training Program Catalogue
  const defaultPrograms = [
    {
      name: 'Soft Skills & Corporate Readiness',
      code: 'SOFT_SKILLS',
      description: 'Professional etiquette, workplace communication, presentation skills, and corporate interview readiness.',
      category: 'SOFT_SKILLS',
      hours: 15,
      defaultHours: 15,
      pricingType: 'PER_HOUR',
      rate: 40,
      defaultPrice: 40,
      displayOrder: 1,
      status: 'ACTIVE',
    },
    {
      name: 'Verbal Ability & Comprehension',
      code: 'VERBAL_ABILITY',
      description: 'Critical reading, grammar foundations, vocabulary enhancement, and corporate email drafting.',
      category: 'APTITUDE',
      hours: 15,
      defaultHours: 15,
      pricingType: 'PER_HOUR',
      rate: 40,
      defaultPrice: 40,
      displayOrder: 2,
      status: 'ACTIVE',
    },
    {
      name: 'Quantitative Aptitude',
      code: 'QUANTITATIVE_APTITUDE',
      description: 'Speed math, arithmetic, logical reasoning, data interpretation, and problem solving masterclasses.',
      category: 'APTITUDE',
      hours: 15,
      defaultHours: 15,
      pricingType: 'PER_HOUR',
      rate: 40,
      defaultPrice: 40,
      displayOrder: 3,
      status: 'ACTIVE',
    },
    {
      name: 'Technical Training',
      code: 'TECHNICAL_TRAINING',
      description: 'Core programming logic in C++/Java/Python, Data Structures algorithms, and SQL database design.',
      category: 'TECHNICAL',
      hours: 20,
      defaultHours: 20,
      pricingType: 'PER_HOUR',
      rate: 40,
      defaultPrice: 40,
      displayOrder: 4,
      status: 'ACTIVE',
    },
    {
      name: 'Technical Skill-Up Program',
      code: 'TECH_SKILL_UP',
      description: 'Advanced full-stack web, cloud fundamentals, hands-on microservices, and capstone project execution.',
      category: 'TECHNICAL',
      hours: 30,
      defaultHours: 30,
      pricingType: 'PER_STUDENT',
      rate: 200,
      defaultPrice: 200,
      displayOrder: 5,
      status: 'ACTIVE',
    },
    {
      name: 'Interview Preparation',
      code: 'INTERVIEW_PREP',
      description: 'HR interview simulation, behavioral questions, technical mock interviews, and body language feedback.',
      category: 'VOCATIONAL',
      hours: 10,
      defaultHours: 10,
      pricingType: 'PER_HOUR',
      rate: 40,
      defaultPrice: 40,
      displayOrder: 6,
      status: 'ACTIVE',
    },
    {
      name: 'Resume & Portfolio Development',
      code: 'RESUME_PORTFOLIO',
      description: 'ATS resume optimization, GitHub project showcase curation, and LinkedIn profile engineering.',
      category: 'VOCATIONAL',
      hours: 8,
      defaultHours: 8,
      pricingType: 'PER_HOUR',
      rate: 40,
      defaultPrice: 40,
      displayOrder: 7,
      status: 'ACTIVE',
    },
    {
      name: 'Communication Skills',
      code: 'COMMUNICATION',
      description: 'Spoken English fluency, accent neutralization, group discussion leadership, and active listening.',
      category: 'SOFT_SKILLS',
      hours: 12,
      defaultHours: 12,
      pricingType: 'PER_HOUR',
      rate: 40,
      defaultPrice: 40,
      displayOrder: 8,
      status: 'ACTIVE',
    },
  ];

  for (const prog of defaultPrograms) {
    await prisma.trainingProgram.create({ data: prog });
  }
  console.log('✅ Seeded Training Program Catalogue (8 default programs)');

  // 5. Seed Training Plans & Modules
  const basePlan = await prisma.plan.create({
    data: {
      name: 'Base',
      code: 'BASE',
      description: 'Essential placement foundation curriculum covering communicative soft skills, quantitative aptitude, and verbal reasoning.',
      totalHours: 30,
      pricingModel: 'HOURLY',
      displayOrder: 1,
      status: 'ACTIVE',
      modules: {
        create: [
          { name: 'Soft Skills & Corporate Readiness', hours: 6, displayOrder: 1 },
          { name: 'Quantitative Aptitude', hours: 12, displayOrder: 2 },
          { name: 'Verbal Ability & Comprehension', hours: 12, displayOrder: 3 },
          { name: 'Technical & Domain Coding', hours: 0, displayOrder: 4 },
        ],
      },
    },
  });

  const standardPlan = await prisma.plan.create({
    data: {
      name: 'Standard',
      code: 'STANDARD',
      description: 'Comprehensive campus readiness program with reinforced aptitude analytics, advanced verbal reasoning, and behavioral coaching.',
      totalHours: 48,
      pricingModel: 'HOURLY',
      displayOrder: 2,
      status: 'ACTIVE',
      modules: {
        create: [
          { name: 'Soft Skills & Corporate Readiness', hours: 12, displayOrder: 1 },
          { name: 'Quantitative Aptitude', hours: 24, displayOrder: 2 },
          { name: 'Verbal Ability & Comprehension', hours: 12, displayOrder: 3 },
          { name: 'Technical & Domain Coding', hours: 0, displayOrder: 4 },
        ],
      },
    },
  });

  const premiumPlan = await prisma.plan.create({
    data: {
      name: 'Premium',
      code: 'PREMIUM',
      description: 'Flagship full-stack placement program featuring intensive technical coding masterclasses alongside soft skills and aptitude training.',
      totalHours: 60,
      pricingModel: 'HOURLY',
      displayOrder: 3,
      status: 'ACTIVE',
      modules: {
        create: [
          { name: 'Soft Skills & Corporate Readiness', hours: 6, displayOrder: 1 },
          { name: 'Quantitative Aptitude', hours: 12, displayOrder: 2 },
          { name: 'Verbal Ability & Comprehension', hours: 12, displayOrder: 3 },
          { name: 'Technical & Domain Coding', hours: 30, displayOrder: 4 },
        ],
      },
    },
  });

  const customPlan = await prisma.plan.create({
    data: {
      name: 'Custom Plan',
      code: 'CUSTOM',
      description: 'Dynamic customized curriculum built from selected training catalogue programs with bespoke hour allocations.',
      totalHours: 0,
      pricingModel: 'CUSTOM',
      displayOrder: 4,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seeded Plans: Base (30h), Standard (48h), Premium (60h), Custom Plan');

  // 6. Seed Add-ons
  const mockInterviewAddon = await prisma.addon.create({
    data: {
      name: '1-on-1 Mock Technical & HR Interviews',
      code: 'MOCK_INTERVIEWS',
      description: 'Comprehensive 45-minute simulation with industry tech leads, complete with live grading rubric and feedback.',
      pricingType: 'PER_STUDENT',
      price: 500,
      status: 'ACTIVE',
    },
  });

  const resumeWorkshopAddon = await prisma.addon.create({
    data: {
      name: 'ATS Resume Review & Portfolio Workshop',
      code: 'RESUME_WORKSHOP',
      description: 'Individual ATS scoring and resume tailoring session for tier-1 IT and product engineering recruiters.',
      pricingType: 'PER_STUDENT',
      price: 150,
      status: 'ACTIVE',
    },
  });

  const technicalSkillUpAddon = await prisma.addon.create({
    data: {
      name: 'Technical Skill-Up Program',
      code: 'TECHNICAL_SKILL_UP',
      description: 'Advanced full-stack and cloud specialization track with hands-on capstone project review.',
      pricingType: 'PER_STUDENT',
      price: 600,
      status: 'ACTIVE',
    },
  });

  const companySpecificAddon = await prisma.addon.create({
    data: {
      name: 'Company-Specific Crunch Bootcamp (TCS / Infosys / Accenture)',
      code: 'COMPANY_BOOTCAMP',
      description: 'Targeted past-pattern assessment training tailored for immediate upcoming Day-1 recruitment drives.',
      pricingType: 'PER_STUDENT',
      price: 750,
      status: 'ACTIVE',
    },
  });

  const advancedCodingAddon = await prisma.addon.create({
    data: {
      name: 'Competitive Programming Masterclass',
      code: 'ADV_CODING',
      description: 'Data Structures & Algorithms deep dive covering dynamic programming, graphs, and system design basics.',
      pricingType: 'PER_HOUR',
      price: 400,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seeded Commercial Add-ons including Technical Skill-Up Program');

  // 6. Seed Sample Colleges
  const college1 = await prisma.college.create({
    data: {
      collegeId: 'GEN-COL-2026-00001',
      name: 'BMS Institute of Technology & Management',
      placementOfficerName: 'Dr. S. K. Ramesh',
      placementOfficerEmail: 'placements@bmsit.ac.in',
      placementOfficerPhone: '+91 94480 12345',
      address: 'Doddaballapur Main Road, Avalahalli, Yelahanka',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560064',
      studentCount: 250,
      notes: 'Premier Tier-2 institute seeking intensive product training for 2026 graduating batch.',
      createdById: bdUser.id,
    },
  });

  const college2 = await prisma.college.create({
    data: {
      collegeId: 'GEN-COL-2026-00002',
      name: 'PSG College of Technology',
      placementOfficerName: 'Prof. K. Venkatesh',
      placementOfficerEmail: 'placement@psgtech.edu',
      placementOfficerPhone: '+91 98420 54321',
      address: 'Avinashi Road, Peelamedu',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      studentCount: 300,
      notes: 'Interested in Standard or Premium plan for CSE and IT departments.',
      createdById: bdUser.id,
    },
  });

  const college3 = await prisma.college.create({
    data: {
      collegeId: 'GEN-COL-2026-00003',
      name: 'Vellore Institute of Technology (VIT)',
      placementOfficerName: 'Dr. Samuel Johnson',
      placementOfficerEmail: 'director.pat@vit.ac.in',
      placementOfficerPhone: '+91 91760 99887',
      address: 'Katpadi',
      city: 'Vellore',
      state: 'Tamil Nadu',
      pincode: '632014',
      studentCount: 450,
      notes: 'Large campus batch proposal under negotiation.',
      createdById: managerUser.id,
    },
  });

  console.log('✅ Seeded Colleges');

  // 7. Seed Sample Proposals
  const token1 = crypto.randomBytes(32).toString('hex');
  const expiry1 = new Date();
  expiry1.setDate(expiry1.getDate() + 30);

  const proposal1 = await prisma.proposal.create({
    data: {
      proposalId: 'GEN-PROP-2026-00001',
      publicToken: token1,
      tokenExpiresAt: expiry1,
      collegeId: college1.id,
      planId: premiumPlan.id,
      createdById: bdUser.id,
      studentCount: 250,
      minStudents: 100,
      maxStudents: 500,
      totalHours: 60,
      hourlyRateSnapshot: 40,
      pricingModelSnapshot: 'HOURLY',
      baseTrainingCost: 600000,
      addonsTotalCost: 125000,
      customItemsTotalCost: 0,
      subtotal: 725000,
      discountValue: 0,
      discountType: 'FIXED',
      taxableAmount: 725000,
      gstRate: 18.0,
      gstAmount: 130500,
      grandTotal: 855500,
      finalTotal: 855500,
      status: 'SHARED',
      currentVersion: 1,
      notes: 'Proposal sent to Placement Director via QR and Web Link.',
      addons: {
        create: [
          {
            addonId: mockInterviewAddon.id,
            nameSnapshot: mockInterviewAddon.name,
            pricingTypeSnapshot: 'PER_STUDENT',
            priceSnapshot: 500,
            calculatedCost: 125000,
          },
        ],
      },
    },
  });

  await prisma.proposalVersion.create({
    data: {
      proposalId: proposal1.id,
      versionNumber: 1,
      snapshotData: JSON.stringify(proposal1),
      changedByRole: 'BD_EXECUTIVE',
      changeSummary: 'Initial proposal drafted and shared (250 students, Premium Plan, ₹8,55,500)',
      calculatedTotal: 855500,
    },
  });

  const token2 = crypto.randomBytes(32).toString('hex');
  const expiry2 = new Date();
  expiry2.setDate(expiry2.getDate() + 30);

  const proposal2 = await prisma.proposal.create({
    data: {
      proposalId: 'GEN-PROP-2026-00002',
      publicToken: token2,
      tokenExpiresAt: expiry2,
      collegeId: college2.id,
      planId: standardPlan.id,
      createdById: bdUser.id,
      approvedById: managerUser.id,
      approvedAt: new Date(),
      studentCount: 300,
      minStudents: 150,
      maxStudents: 600,
      totalHours: 48,
      hourlyRateSnapshot: 40,
      pricingModelSnapshot: 'HOURLY',
      baseTrainingCost: 576000,
      addonsTotalCost: 45000,
      customItemsTotalCost: 0,
      subtotal: 621000,
      discountValue: 0,
      discountType: 'FIXED',
      taxableAmount: 621000,
      gstRate: 18.0,
      gstAmount: 111780,
      grandTotal: 732780,
      finalTotal: 732780,
      status: 'APPROVED',
      currentVersion: 2,
      notes: 'Approved after college Dean confirmed student list.',
      addons: {
        create: [
          {
            addonId: resumeWorkshopAddon.id,
            nameSnapshot: resumeWorkshopAddon.name,
            pricingTypeSnapshot: 'PER_STUDENT',
            priceSnapshot: 150,
            calculatedCost: 45000,
          },
        ],
      },
    },
  });

  await prisma.proposalVersion.create({
    data: {
      proposalId: proposal2.id,
      versionNumber: 1,
      snapshotData: JSON.stringify(proposal2),
      changedByRole: 'BD_EXECUTIVE',
      changeSummary: 'Initial draft for PSG Tech (300 students, Standard Plan)',
      calculatedTotal: 732780,
    },
  });

  await prisma.proposalVersion.create({
    data: {
      proposalId: proposal2.id,
      versionNumber: 2,
      snapshotData: JSON.stringify(proposal2),
      changedByRole: 'BD_MANAGER',
      changeSummary: 'Final approval and sign-off granted by BD Manager Ananya Deshmukh',
      calculatedTotal: 732780,
    },
  });

  // Proposal 3: PENDING_MANAGER_APPROVAL
  const token3 = crypto.randomBytes(32).toString('hex');
  const expiry3 = new Date();
  expiry3.setDate(expiry3.getDate() + 30);

  const proposal3 = await prisma.proposal.create({
    data: {
      proposalId: 'GEN-PROP-2026-00003',
      publicToken: token3,
      tokenExpiresAt: expiry3,
      collegeId: college3.id,
      planId: basePlan.id,
      createdById: bdUser.id,
      studentCount: 450,
      minStudents: 200,
      maxStudents: 600,
      totalHours: 30,
      hourlyRateSnapshot: 40,
      pricingModelSnapshot: 'HOURLY',
      baseTrainingCost: 540000,
      addonsTotalCost: 270000,
      customItemsTotalCost: 90000,
      subtotal: 900000,
      discountValue: 0,
      discountType: 'FIXED',
      taxableAmount: 900000,
      gstRate: 18.0,
      gstAmount: 162000,
      grandTotal: 1062000,
      finalTotal: 1062000,
      status: 'PENDING_MANAGER_APPROVAL',
      submittedAt: new Date(),
      currentVersion: 1,
      notes: 'College placement office confirmed batch size and requested technical skill-up add-on.',
      collegeNotes: 'Please expedite approval for semester schedule integration.',
      addons: {
        create: [
          {
            addonId: technicalSkillUpAddon.id,
            nameSnapshot: technicalSkillUpAddon.name,
            pricingTypeSnapshot: 'PER_STUDENT',
            priceSnapshot: 600,
            calculatedCost: 270000,
          },
        ],
      },
      customItems: {
        create: [
          {
            name: 'Industry Certification & Cloud Labs',
            description: 'Hands-on cloud sandbox environment for AWS certification preparation.',
            quantity: 450,
            pricingType: 'PER_STUDENT',
            unitPrice: 200,
            calculatedCost: 90000,
          },
        ],
      },
    },
  });

  await prisma.proposalVersion.create({
    data: {
      proposalId: proposal3.id,
      versionNumber: 1,
      snapshotData: JSON.stringify(proposal3),
      changedByRole: 'COLLEGE',
      changeSummary: 'College confirmed sizing for 450 students with Technical Skill-Up & Cloud Labs (Grand Total: ₹10,62,000). Awaiting Manager sign-off.',
      calculatedTotal: 1062000,
    },
  });

  // Seed Notifications
  await prisma.notification.create({
    data: {
      userId: managerUser.id,
      title: 'New Proposal Awaiting Approval',
      message: 'Vellore Institute of Technology (VIT) submitted proposal GEN-PROP-2026-00003 (450 students, Base Plan, Grand Total ₹10,62,000)',
      link: `/proposals/${proposal3.id}`,
      type: 'PROPOSAL_SUBMITTED',
      isRead: false,
    },
  });

  console.log('✅ Seeded Sample Proposals (SHARED, APPROVED, PENDING_MANAGER_APPROVAL) and Notifications');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
