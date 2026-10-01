import { PDFService } from '../pdf/pdfService.js';

describe('Genesis PDFService Generator', () => {
  it('should generate a 2-page PDF buffer for custom plan with itemized program rates', async () => {
    const pdfBuffer = await PDFService.generateProposalPdf({
      proposalId: 'GEN-PROP-2026-TEST01',
      publicToken: 'test-token-custom-01',
      version: 1,
      status: 'APPROVED',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 15 * 86400000),
      company: {
        name: 'GENESIS-UNIT OF GENPLUS TRAINING & CONSULTING PVT. LTD.',
        tagline: 'Premier Campus Recruitment Training & Placement Solutions',
        email: 'partnerships@genesis.com',
        phone: '+91 98765 43210',
        website: 'https://genesis-placement.com',
        address: 'Genesis Tower, Bengaluru, Karnataka 560001',
      },
      college: {
        name: 'Sapthagiri College of Engineering, Bengaluru',
        placementOfficerName: 'Dr. Ramesh Babu',
        placementOfficerEmail: 'placement@sapthagiri.edu.in',
        placementOfficerPhone: '+91 91234 56789',
        address: 'Hesaraghatta Main Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560057',
      },
      plan: {
        name: 'Custom Modular Training Plan',
        code: 'CUSTOM',
        description: 'Customized modular training architecture',
        totalHours: 33,
        modules: [
          { name: 'Quantitative Aptitude & Reasoning', hours: 15 },
          { name: 'Technical Training & Coding', hours: 18 },
        ],
      },
      studentCount: 500,
      hourlyRate: 45,
      baseTrainingCost: 750000,
      customPrograms: [
        {
          name: 'Quantitative Aptitude & Reasoning',
          hours: 15,
          pricingType: 'PER_HOUR',
          rate: 40,
          unitRate: 40,
          calculatedCost: 300000,
        },
        {
          name: 'Technical Training & Coding',
          hours: 18,
          pricingType: 'PER_HOUR',
          rate: 50,
          unitRate: 50,
          calculatedCost: 450000,
        },
      ],
      addons: [],
      addonsTotalCost: 0,
      customItems: [],
      customItemsTotalCost: 0,
      subtotal: 750000,
      discountValue: 0,
      discountType: 'FIXED',
      discountAmount: 0,
      taxableAmount: 750000,
      gstRate: 18.0,
      gstAmount: 135000,
      grandTotal: 885000,
      finalTotal: 885000,
      createdBy: {
        fullName: 'Ananya Deshmukh',
        email: 'ananya.d@genesis.com',
        phone: '+91 98450 11223',
      },
      approvedBy: {
        fullName: 'Vikramaditya Rao',
        email: 'vikram.rao@genesis.com',
      },
      digitalApproval: {
        approvalId: 'GEN-APPR-2026-0089',
        approvedAt: new Date().toISOString(),
        proposalVersion: 1,
        approvedByName: 'Vikramaditya Rao',
        approvedByRole: 'BD_MANAGER',
      },
      digitalAcceptance: {
        acceptanceId: 'GEN-ACCP-2026-0045',
        acceptedAt: new Date().toISOString(),
        proposalVersion: 1,
        acceptedByName: 'Dr. Ramesh Babu',
      },
    });

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF Magic number: %PDF-
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  it('should generate standard plan PDF correctly', async () => {
    const pdfBuffer = await PDFService.generateProposalPdf({
      proposalId: 'GEN-PROP-2026-TEST02',
      publicToken: 'test-token-standard-02',
      version: 2,
      status: 'SHARED',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 86400000),
      college: {
        name: 'BMS College of Engineering',
        placementOfficerName: 'Prof. Suresh K',
        placementOfficerEmail: 'placement@bmsce.ac.in',
        placementOfficerPhone: '+91 99887 76655',
        address: 'Bull Temple Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560019',
      },
      plan: {
        name: 'Standard Placement Readiness',
        code: 'STANDARD',
        description: 'Comprehensive 48-hour program',
        totalHours: 48,
        modules: [
          { name: 'Quantitative Aptitude', hours: 16 },
          { name: 'Verbal Ability', hours: 12 },
          { name: 'Logical Reasoning', hours: 10 },
          { name: 'Soft Skills', hours: 10 },
        ],
      },
      studentCount: 700,
      hourlyRate: 40,
      baseTrainingCost: 1344000,
      addons: [
        {
          name: 'AI Mock Interviews Pro',
          pricingType: 'PER_STUDENT',
          price: 150,
          calculatedCost: 105000,
        },
      ],
      addonsTotalCost: 105000,
      subtotal: 1449000,
      discountValue: 49000,
      discountType: 'FIXED',
      discountAmount: 49000,
      taxableAmount: 1400000,
      gstRate: 18.0,
      gstAmount: 252000,
      grandTotal: 1652000,
      finalTotal: 1652000,
      createdBy: {
        fullName: 'Kiran Kumar',
        email: 'kiran.k@genesis.com',
      },
    });

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });
});
