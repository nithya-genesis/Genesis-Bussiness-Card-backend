import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { formatINR, numberToWordsINR } from '../utils/currency.js';
import { QRService } from '../qr/qrService.js';
import { config } from '../config/index.js';
<<<<<<< HEAD
import { SettingService, CompanySettings } from '../services/settingService.js';
=======
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)

interface ProposalPdfData {
  proposalId: string;
  publicToken: string;
  version: number;
  status: string;
  createdAt: Date;
  validUntil: Date;
<<<<<<< HEAD
  company?: CompanySettings;
=======
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
  college: {
    name: string;
    placementOfficerName: string;
    placementOfficerEmail: string;
    placementOfficerPhone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  plan: {
    name: string;
    code: string;
    description: string;
    totalHours: number;
    modules: Array<{
      name: string;
      hours: number;
    }>;
  };
  studentCount: number;
  hourlyRate: number;
  baseTrainingCost: number;
<<<<<<< HEAD
  customPrograms?: Array<{
    programId?: string;
    name?: string;
    programName?: string;
    code?: string;
    hours: number;
    pricingType?: string;
    rate?: number;
    unitRate?: number;
    calculatedCost?: number;
  }>;
=======
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
  addons: Array<{
    name: string;
    pricingType: string;
    price: number;
    calculatedCost: number;
  }>;
  addonsTotalCost: number;
  customItems?: Array<{
    name: string;
    description?: string;
    quantity: number;
    pricingType: string;
    unitPrice: number;
    calculatedCost: number;
  }>;
  customItemsTotalCost?: number;
  subtotal: number;
  discountValue: number;
  discountType: string;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  finalTotal: number;
  createdBy: {
    fullName: string;
    email: string;
    phone?: string | null;
  };
  approvedBy?: {
    fullName: string;
    email: string;
  } | null;
  termsAndConditions?: string[];
<<<<<<< HEAD
  digitalAcceptance?: {
    acceptanceId: string;
    acceptedAt: Date | string;
    proposalVersion: number;
    acceptedByName?: string | null;
    documentHash?: string | null;
  } | null;
  digitalApproval?: {
    approvalId: string;
    approvedAt: Date | string;
    proposalVersion: number;
    approvedByName?: string | null;
    approvedByRole?: string | null;
    documentHash?: string | null;
  } | null;
=======
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
}

export class PDFService {
  /**
   * Generates an executive branded 2-page proposal PDF buffer with 18% GST, per-student metrics, custom items, and Genesis emblem
   */
  public static async generateProposalPdf(data: ProposalPdfData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
<<<<<<< HEAD
        const company = data.company || (await SettingService.getCompanySettings());

=======
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36,
          bufferPages: true,
          autoFirstPage: true,
          info: {
            Title: `Genesis Proposal - ${data.college.name} (${data.proposalId})`,
<<<<<<< HEAD
            Author: company.name,
=======
            Author: 'Genesis Training & Placement Solutions',
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
            Subject: 'Institutional Campus Recruitment Training Proposal',
            Keywords: 'Genesis, Proposal, Training, Campus, Placement, GST',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        const primaryGold = '#D4A72C'; // Genesis Warm Gold
        const darkGold = '#B5891E';
        const slateDark = '#171717'; // Rich Charcoal
        const slateMuted = '#525252';
        const lightBg = '#FAFAF7'; // Warm white surface
        const accentBorder = '#E8E4D8'; // Subtle warm border

        // Resolve official uploaded Genesis logo
        const possibleLogoPaths = [
          path.resolve(process.cwd(), 'assets/genesis-logo.jpg'),
          path.resolve(process.cwd(), 'src/assets/genesis-logo.jpg'),
          path.resolve(process.cwd(), '../backend/assets/genesis-logo.jpg'),
          path.resolve(process.cwd(), '../frontend/public/brand/genesis-logo.jpg'),
        ];
        const resolvedLogo = possibleLogoPaths.find((p) => fs.existsSync(p)) || null;

        // Subtle Genesis Watermark (Page Center)
        const drawWatermark = () => {
          doc.save();
          doc.opacity(0.035);
          if (resolvedLogo) {
            const logoSize = 250;
            doc.image(resolvedLogo, (595.28 - logoSize) / 2, (841.89 - logoSize) / 2, {
              width: logoSize,
              height: logoSize,
            });
          } else {
            doc.fillColor('#171717');
            doc.fontSize(68);
            doc.font('Helvetica-Bold');
            doc.rotate(-30, { origin: [297.64, 420.94] });
            doc.text('GENESIS', 120, 380, { align: 'center', width: 360 });
          }
          doc.restore();
        };

        // Calculations for per-student metrics
        const costPerStudentBeforeGst = data.studentCount > 0 ? Math.round((data.taxableAmount / data.studentCount) * 100) / 100 : 0;
        const customItems = data.customItems || [];
        const customItemsTotal = data.customItemsTotalCost || customItems.reduce((sum, item) => sum + item.calculatedCost, 0);

        // ================= PAGE 1: EXECUTIVE PROPOSAL & COMMERCIAL SCHEDULE =================
        drawWatermark();

        // Top Gold Accent Bar
        doc.rect(0, 0, 595.28, 6).fill(primaryGold);

        // Header Section Box
<<<<<<< HEAD
        const headerBoxY = 18;
        const headerBoxHeight = 72;
        doc.rect(36, headerBoxY, 523.28, headerBoxHeight).fill(lightBg).stroke(accentBorder);

        const compName = company.name.toUpperCase();
        // Dynamic font size: 10.5pt for long names (e.g. > 30 chars), 12pt for medium, 14pt for short
        const compFontSize = compName.length > 30 ? 10.5 : compName.length > 20 ? 12 : 14;

        if (resolvedLogo) {
          // 1. Logo container (Left)
          doc.image(resolvedLogo, 44, 25, { width: 38, height: 38 });

          // 2. Company Name & Tagline Container (Middle - Width 240)
          const compX = 90;
          const compWidth = 240;
          doc.fontSize(compFontSize).font('Helvetica-Bold');
          const measuredNameHeight = doc.heightOfString(compName, { width: compWidth, lineGap: 1.5 });
          const compNameY = compName.length > 30 ? 22 : 25;

          doc.fillColor(darkGold).fontSize(compFontSize).font('Helvetica-Bold')
            .text(compName, compX, compNameY, { width: compWidth, lineGap: 1.5 });

          const subY = compNameY + measuredNameHeight + 2;
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica-Bold')
            .text('TRAINING & PLACEMENT SOLUTIONS', compX, subY, { width: compWidth });
          doc.fillColor(slateDark).fontSize(6.5).font('Helvetica-Oblique')
            .text(company.tagline, compX, subY + 9, { width: compWidth, lineBreak: false });
        } else {
          // Fallback if no logo file exists
          const compX = 44;
          const compWidth = 286;
          doc.fontSize(compFontSize).font('Helvetica-Bold');
          const measuredNameHeight = doc.heightOfString(compName, { width: compWidth, lineGap: 1.5 });
          const compNameY = compName.length > 30 ? 22 : 25;

          doc.fillColor(darkGold).fontSize(compFontSize).font('Helvetica-Bold')
            .text(compName, compX, compNameY, { width: compWidth, lineGap: 1.5 });

          const subY = compNameY + measuredNameHeight + 2;
          doc.fillColor(slateMuted).fontSize(7.5).font('Helvetica')
            .text('TRAINING & PLACEMENT SOLUTIONS', compX, subY, { width: compWidth });
          doc.fillColor(slateDark).fontSize(6.5).font('Helvetica-Oblique')
            .text(company.tagline, compX, subY + 9, { width: compWidth, lineBreak: false });
        }

        // 3. Proposal Header Metadata (Right container - Width 214, Right aligned)
        const metaX = 338;
        const metaWidth = 212;
        doc.fillColor(slateDark).fontSize(10).font('Helvetica-Bold')
          .text('CAMPUS TRAINING PROPOSAL', metaX, 23, { align: 'right', width: metaWidth });
        doc.fillColor(darkGold).fontSize(8.5).font('Helvetica-Bold')
          .text(`REF: ${data.proposalId}`, metaX, 36, { align: 'right', width: metaWidth });
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
          .text(`Version: v${data.version} | Status: ${data.status}`, metaX, 48, { align: 'right', width: metaWidth });
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
          .text(`Date: ${data.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, metaX, 59, { align: 'right', width: metaWidth });
=======
        doc.rect(36, 20, 523.28, 68).fill(lightBg).stroke(accentBorder);

        if (resolvedLogo) {
          doc.image(resolvedLogo, 46, 26, { width: 36, height: 36 });
          doc.fillColor(darkGold).fontSize(17).font('Helvetica-Bold').text('GENESIS', 92, 28);
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica-Bold').text('TRAINING & PLACEMENT SOLUTIONS', 92, 47);
          doc.fillColor(slateDark).fontSize(6.5).font('Helvetica-Oblique').text(config.company.tagline, 92, 58);
        } else {
          doc.fillColor(darkGold).fontSize(18).font('Helvetica-Bold').text('GENESIS', 48, 28);
          doc.fillColor(slateMuted).fontSize(7.5).font('Helvetica').text('TRAINING & PLACEMENT SOLUTIONS', 48, 48);
          doc.fillColor(slateDark).fontSize(6.5).font('Helvetica-Oblique').text(config.company.tagline, 48, 59);
        }

        // Proposal Header Metadata (Right side)
        doc.fillColor(slateDark).fontSize(11).font('Helvetica-Bold').text('CAMPUS TRAINING PROPOSAL', 320, 27, { align: 'right', width: 228 });
        doc.fillColor(darkGold).fontSize(8.5).font('Helvetica-Bold').text(`REF: ${data.proposalId}`, 320, 42, { align: 'right', width: 228 });
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica').text(`Version: v${data.version} | Status: ${data.status}`, 320, 53, { align: 'right', width: 228 });
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica').text(`Date: ${data.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 320, 64, { align: 'right', width: 228 });
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)

        // Metadata Matrix Box (College vs BD Executive)
        const colY = 94;
        const boxWidth = 255;
        const boxHeight = 82;

        // Left: College Info
        doc.rect(36, colY, boxWidth, boxHeight).fill(lightBg).stroke(accentBorder);
        doc.rect(36, colY, boxWidth, 16).fill(slateDark);
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('PROPOSAL PREPARED FOR', 44, colY + 4);

        doc.fillColor(slateDark).fontSize(8.5).font('Helvetica-Bold').text(data.college.name, 44, colY + 20, { width: 240 });
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
<<<<<<< HEAD
          .text(`Placement Officer: ${data.college.placementOfficerName || 'Placement Cell'}`, 44, colY + 34)
          .text(`Email: ${data.college.placementOfficerEmail || 'Not Specified'}`, 44, colY + 45)
          .text(`Phone: ${data.college.placementOfficerPhone || 'Not Specified'}`, 44, colY + 56)
          .text(`Location: ${data.college.city || 'Campus'}, ${data.college.state || 'India'}`, 44, colY + 67);
=======
          .text(`Placement Officer: ${data.college.placementOfficerName}`, 44, colY + 34)
          .text(`Email: ${data.college.placementOfficerEmail}`, 44, colY + 45)
          .text(`Phone: ${data.college.placementOfficerPhone}`, 44, colY + 56)
          .text(`Location: ${data.college.city}, ${data.college.state}`, 44, colY + 67);
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)

        // Right: Genesis Rep & Validity
        doc.rect(304, colY, boxWidth, boxHeight).fill(lightBg).stroke(accentBorder);
        doc.rect(304, colY, boxWidth, 16).fill(primaryGold);
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text('GENESIS EXECUTIVE & VALIDITY', 312, colY + 4);

<<<<<<< HEAD
        doc.fillColor(slateDark).fontSize(8.5).font('Helvetica-Bold').text(data.createdBy?.fullName || 'Genesis BD Representative', 312, colY + 20);
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
          .text(`BD Executive: ${data.createdBy?.email || company.email}`, 312, colY + 34)
          .text(`Official Portal: ${company.website || config.frontendUrl}`, 312, colY + 45)
          .text(`Validity: Valid until ${data.validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 312, colY + 56)
          .text(`Approved By: ${data.digitalApproval ? (data.digitalApproval.approvedByName || 'BD Manager') : (data.approvedBy ? data.approvedBy.fullName : 'Pending Executive Approval')}`, 312, colY + 67);
=======
        doc.fillColor(slateDark).fontSize(8.5).font('Helvetica-Bold').text(data.createdBy.fullName, 312, colY + 20);
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
          .text(`BD Executive: ${data.createdBy.email}`, 312, colY + 34)
          .text(`Official Portal: ${config.frontendUrl}`, 312, colY + 45)
          .text(`Validity: Valid until ${data.validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 312, colY + 56)
          .text(`Approved By: ${data.approvedBy ? data.approvedBy.fullName : 'Pending Executive Approval'}`, 312, colY + 67);
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)

        // Section 1: Curriculum Breakdown
        let currentY = 182;
        doc.rect(36, currentY, 523.28, 16).fill(slateDark);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('1. SELECTED TRAINING PROGRAM & CURRICULUM ARCHITECTURE', 44, currentY + 4);

        currentY += 20;
<<<<<<< HEAD
        const planHeaderTitle = data.plan.name.toUpperCase().includes('PLAN')
          ? `${data.plan.name.toUpperCase()} (${data.plan.totalHours} TOTAL TRAINING HOURS)`
          : `${data.plan.name.toUpperCase()} PLAN (${data.plan.totalHours} TOTAL TRAINING HOURS)`;
        doc.fillColor(darkGold).fontSize(9.5).font('Helvetica-Bold').text(planHeaderTitle, 36, currentY);
=======
        doc.fillColor(darkGold).fontSize(9.5).font('Helvetica-Bold').text(`${data.plan.name.toUpperCase()} PLAN (${data.plan.totalHours} TOTAL TRAINING HOURS)`, 36, currentY);
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
        currentY += 13;

        // Modules Table
        const tableX = 36;
        const tableWidth = 523.28;
        const col1 = 320;
        const col2 = 100;

        doc.rect(tableX, currentY, tableWidth, 14).fill('#FFFDF5').stroke(accentBorder);
        doc.fillColor(darkGold).fontSize(7).font('Helvetica-Bold')
          .text('Curriculum Training Module', tableX + 8, currentY + 3.5)
          .text('Duration', tableX + col1, currentY + 3.5)
          .text('Batch Distribution', tableX + col1 + col2, currentY + 3.5);

        currentY += 14;

        const defaultModules = [
          { name: 'Soft Skills & Corporate Communication', hours: 0 },
          { name: 'Quantitative Aptitude & Logical Reasoning', hours: 0 },
          { name: 'Verbal Ability & Communicative English', hours: 0 },
          { name: 'Technical Coding & Full-Stack Problem Solving', hours: 0 },
        ];

<<<<<<< HEAD
        const displayModules = data.plan.modules && data.plan.modules.length > 0 ? data.plan.modules : defaultModules;

        displayModules.slice(0, 6).forEach((mod, idx) => {
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#FAFAF7';
          doc.rect(tableX, currentY, tableWidth, 13).fill(rowBg).stroke(accentBorder);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica')
            .text(mod.name, tableX + 8, currentY + 3, { width: 300, lineBreak: false })
=======
        const displayModules = data.plan.modules.length > 0 ? data.plan.modules : defaultModules;

        displayModules.slice(0, 5).forEach((mod, idx) => {
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#FAFAF7';
          doc.rect(tableX, currentY, tableWidth, 13).fill(rowBg).stroke(accentBorder);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica')
            .text(mod.name, tableX + 8, currentY + 3)
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
            .text(`${mod.hours} Hours`, tableX + col1, currentY + 3)
            .text('All Batches', tableX + col1 + col2, currentY + 3);
          currentY += 13;
        });

        // Total Hours Row
        doc.rect(tableX, currentY, tableWidth, 13).fill('#F5F4EE').stroke(accentBorder);
        doc.fillColor(slateDark).fontSize(7).font('Helvetica-Bold')
          .text('Total Training Hours (per student)', tableX + 8, currentY + 3)
          .text(`${data.plan.totalHours} Hours`, tableX + col1, currentY + 3)
          .text(`${data.studentCount} Students`, tableX + col1 + col2, currentY + 3);

        currentY += 18;

<<<<<<< HEAD
        // Section 2: Commercial Pricing & GST Schedule
        doc.rect(36, currentY, 523.28, 16).fill(slateDark);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text(`2. COMMERCIAL INVESTMENT & STATUTORY GST SCHEDULE (${data.gstRate}% GST)`, 44, currentY + 4);
=======
        // Section 2: Commercial Pricing & 18% GST Schedule
        doc.rect(36, currentY, 523.28, 16).fill(slateDark);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('2. COMMERCIAL INVESTMENT & STATUTORY GST SCHEDULE', 44, currentY + 4);
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)

        currentY += 20;

        // Commercial Table Header
        doc.rect(tableX, currentY, tableWidth, 14).fill('#FFFDF5').stroke(accentBorder);
        doc.fillColor(darkGold).fontSize(7).font('Helvetica-Bold')
          .text('Item Description', tableX + 8, currentY + 3.5)
          .text('Basis', tableX + 240, currentY + 3.5)
          .text('Unit Rate', tableX + 350, currentY + 3.5)
          .text('Amount (INR)', tableX + 430, currentY + 3.5, { width: 85, align: 'right' });

        currentY += 14;

<<<<<<< HEAD
        // Commercial Table Rows
        const customPrograms = data.customPrograms || [];
        if (customPrograms.length > 0) {
          // Render each custom program as an individual line item with its actual duration and rate
          customPrograms.forEach((prog, idx) => {
            const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#FAFAF7';
            const pType = prog.pricingType || 'PER_HOUR';
            const pRate = prog.unitRate !== undefined ? prog.unitRate : (prog.rate || 0);
            const pHours = prog.hours || 0;
            let pCost = prog.calculatedCost !== undefined ? prog.calculatedCost : 0;
            if (!pCost && pCost !== 0) {
              if (pType === 'PER_STUDENT') pCost = pRate * data.studentCount;
              else if (pType === 'FIXED') pCost = pRate;
              else pCost = pHours * data.studentCount * pRate;
            }

            let basisText = `${pHours} hrs × ${data.studentCount} students`;
            let unitRateText = `₹${formatINR(pRate, false)}/hr/student`;
            if (pType === 'PER_STUDENT') {
              basisText = `${data.studentCount} Students`;
              unitRateText = `₹${formatINR(pRate, false)}/student`;
            } else if (pType === 'FIXED') {
              basisText = 'Fixed Fee';
              unitRateText = `₹${formatINR(pRate, false)} fixed`;
            }

            doc.rect(tableX, currentY, tableWidth, 15).fill(rowBg).stroke(accentBorder);
            doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold')
              .text(prog.name || prog.programName || 'Training Program', tableX + 8, currentY + 3.5, { width: 225, lineBreak: false });
            doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
              .text(basisText, tableX + 240, currentY + 3.5, { width: 105 })
              .text(unitRateText, tableX + 350, currentY + 3.5, { width: 75 });
            doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold')
              .text(formatINR(pCost, false), tableX + 430, currentY + 3.5, { width: 85, align: 'right' });

            currentY += 15;
          });
        } else {
          // Base Plan Line Item for Standard Plans
          doc.rect(tableX, currentY, tableWidth, 15).fill('#FFFFFF').stroke(accentBorder);
          doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold')
            .text(`${data.plan.name} Training Plan`, tableX + 8, currentY + 3.5, { width: 225, lineBreak: false });
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
            .text(`${data.plan.totalHours} hrs × ${data.studentCount} students`, tableX + 240, currentY + 3.5, { width: 105 })
            .text(`₹${data.hourlyRate}/hr/student`, tableX + 350, currentY + 3.5, { width: 75 });
          doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold')
            .text(formatINR(data.baseTrainingCost, false), tableX + 430, currentY + 3.5, { width: 85, align: 'right' });

          currentY += 15;
        }

        // Add-ons Line Items
        if (data.addons && data.addons.length > 0) {
          data.addons.forEach((addon, idx) => {
            const rowBg = idx % 2 === 0 ? '#FAFAF7' : '#FFFFFF';
            doc.rect(tableX, currentY, tableWidth, 14).fill(rowBg).stroke(accentBorder);
            doc.fillColor(slateDark).fontSize(7).font('Helvetica')
              .text(`Add-on: ${addon.name}`, tableX + 8, currentY + 3);

            let basisText = 'Flat Fee';
            if (addon.pricingType === 'PER_STUDENT') basisText = `${data.studentCount} Students`;
            if (addon.pricingType === 'PER_HOUR') basisText = `${data.plan.totalHours} Hours`;

            doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
              .text(basisText, tableX + 240, currentY + 3)
              .text(`₹${addon.price}`, tableX + 350, currentY + 3);
            doc.fillColor(slateDark).fontSize(7).font('Helvetica-Bold')
              .text(formatINR(addon.calculatedCost, false), tableX + 430, currentY + 3, { width: 85, align: 'right' });

            currentY += 14;
          });
        } else {
          doc.rect(tableX, currentY, tableWidth, 14).fill('#FAFAF7').stroke(accentBorder);
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica-Oblique')
            .text('Selected Add-ons: None', tableX + 8, currentY + 3);
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
            .text('—', tableX + 240, currentY + 3)
            .text('₹0', tableX + 350, currentY + 3);
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
            .text('0.00', tableX + 430, currentY + 3, { width: 85, align: 'right' });
          currentY += 14;
        }
=======
        // Base Plan Line Item
        doc.rect(tableX, currentY, tableWidth, 15).fill('#FFFFFF').stroke(accentBorder);
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold')
          .text(`${data.plan.name} Training Plan`, tableX + 8, currentY + 3.5);
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
          .text(`${data.plan.totalHours} hrs × ${data.studentCount} students`, tableX + 240, currentY + 3.5)
          .text(`₹${data.hourlyRate}/hr/student`, tableX + 350, currentY + 3.5);
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold')
          .text(formatINR(data.baseTrainingCost, false), tableX + 430, currentY + 3.5, { width: 85, align: 'right' });

        currentY += 15;

        // Add-ons Line Items
        data.addons.forEach((addon, idx) => {
          const rowBg = idx % 2 === 0 ? '#FAFAF7' : '#FFFFFF';
          doc.rect(tableX, currentY, tableWidth, 14).fill(rowBg).stroke(accentBorder);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica')
            .text(`Add-on: ${addon.name}`, tableX + 8, currentY + 3);

          let basisText = 'Flat Fee';
          if (addon.pricingType === 'PER_STUDENT') basisText = `${data.studentCount} Students`;
          if (addon.pricingType === 'PER_HOUR') basisText = `${data.plan.totalHours} Hours`;

          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
            .text(basisText, tableX + 240, currentY + 3)
            .text(`₹${addon.price}`, tableX + 350, currentY + 3);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica-Bold')
            .text(formatINR(addon.calculatedCost, false), tableX + 430, currentY + 3, { width: 85, align: 'right' });

          currentY += 14;
        });
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)

        // Custom Items Line Items (if any)
        customItems.forEach((ci, idx) => {
          const rowBg = idx % 2 === 0 ? '#FAFAF7' : '#FFFFFF';
          doc.rect(tableX, currentY, tableWidth, 14).fill(rowBg).stroke(accentBorder);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica')
            .text(`Custom: ${ci.name}`, tableX + 8, currentY + 3);

<<<<<<< HEAD
          let basisText = ci.pricingType === 'PER_STUDENT'
            ? `${ci.quantity || data.studentCount} Students`
            : ci.pricingType === 'PER_HOUR'
            ? `${data.plan.totalHours} Hours`
            : 'Fixed Custom';
=======
          let basisText = ci.pricingType === 'PER_STUDENT' ? `${ci.quantity || data.studentCount} Students` : 'Fixed Custom';
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
            .text(basisText, tableX + 240, currentY + 3)
            .text(`₹${ci.unitPrice}`, tableX + 350, currentY + 3);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica-Bold')
            .text(formatINR(ci.calculatedCost, false), tableX + 430, currentY + 3, { width: 85, align: 'right' });

          currentY += 14;
        });

        // Financial Totals Summary Box (Right) and QR Verification Box (Left)
        const totalBoxY = currentY + 6;
        const totalBoxWidth = 265;
        const totalBoxX = 559.28 - totalBoxWidth;

        doc.rect(totalBoxX, totalBoxY, totalBoxWidth, 120).fill(lightBg).stroke(accentBorder);
        
        let subY = totalBoxY + 5;
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
          .text('Base Training Subtotal:', totalBoxX + 10, subY)
          .text(`₹${formatINR(data.baseTrainingCost, false)}`, totalBoxX + 10, subY, { align: 'right', width: totalBoxWidth - 20 });
        
        if (data.addonsTotalCost > 0) {
          subY += 11;
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
            .text('Add-ons Investment:', totalBoxX + 10, subY)
            .text(`₹${formatINR(data.addonsTotalCost, false)}`, totalBoxX + 10, subY, { align: 'right', width: totalBoxWidth - 20 });
        }

        if (customItemsTotal > 0) {
          subY += 11;
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
            .text('Custom Specialized Items:', totalBoxX + 10, subY)
            .text(`₹${formatINR(customItemsTotal, false)}`, totalBoxX + 10, subY, { align: 'right', width: totalBoxWidth - 20 });
        }

        subY += 11;
        doc.fillColor(slateDark).fontSize(7).font('Helvetica-Bold')
          .text('Subtotal:', totalBoxX + 10, subY)
          .text(`₹${formatINR(data.subtotal, false)}`, totalBoxX + 10, subY, { align: 'right', width: totalBoxWidth - 20 });

        if (data.discountAmount > 0) {
          subY += 11;
          doc.fillColor('#059669').fontSize(7).font('Helvetica-Bold')
            .text(`Discount (${data.discountType === 'PERCENTAGE' ? `${data.discountValue}%` : 'Special'}):`, totalBoxX + 10, subY)
            .text(`- ₹${formatINR(data.discountAmount, false)}`, totalBoxX + 10, subY, { align: 'right', width: totalBoxWidth - 20 });
        }

        subY += 11;
        doc.fillColor(slateDark).fontSize(7).font('Helvetica-Bold')
          .text('Taxable Amount (Pre-GST):', totalBoxX + 10, subY)
          .text(`₹${formatINR(data.taxableAmount, false)}`, totalBoxX + 10, subY, { align: 'right', width: totalBoxWidth - 20 });

        subY += 11;
        doc.fillColor(darkGold).fontSize(6.5).font('Helvetica-Bold')
          .text(`Cost Per Student — Before GST:`, totalBoxX + 10, subY)
          .text(`₹${formatINR(costPerStudentBeforeGst, false)}`, totalBoxX + 10, subY, { align: 'right', width: totalBoxWidth - 20 });

        subY += 11;
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
          .text(`GST @ ${data.gstRate}%:`, totalBoxX + 10, subY)
          .text(`₹${formatINR(data.gstAmount, false)}`, totalBoxX + 10, subY, { align: 'right', width: totalBoxWidth - 20 });

        // Grand Total Banner
        subY += 13;
        doc.rect(totalBoxX, subY, totalBoxWidth, 22).fill(primaryGold);
        doc.fillColor(slateDark).fontSize(8.5).font('Helvetica-Bold')
          .text('GRAND TOTAL (INCL. GST):', totalBoxX + 10, subY + 6)
          .text(`₹${formatINR(data.grandTotal, false)}`, totalBoxX + 10, subY + 6, { align: 'right', width: totalBoxWidth - 20 });

        // Left Side: Amount in words & QR Verification Box
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text('Grand Total in Words:', 36, totalBoxY + 4);
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica-Oblique').text(numberToWordsINR(data.grandTotal), 36, totalBoxY + 15, { width: 245 });

        // QR Code Box for Live Verification
        try {
          const qrPngBuffer = await QRService.generateBuffer(data.publicToken);
          doc.rect(36, totalBoxY + 44, 250, 66).fill('#FAFAF7').stroke(accentBorder);
          doc.image(qrPngBuffer, 44, totalBoxY + 50, { width: 52, height: 52 });
          doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold')
            .text('Cryptographic Verification QR', 104, totalBoxY + 54);
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
            .text('Scan with mobile or barcode reader to open official live portal, inspect student cohort details, and verify pricing signatures.', 104, totalBoxY + 66, { width: 175 });
        } catch {
          // Non-blocking
        }

        // ================= PAGE 2: COMMERCIAL TERMS, MILESTONES & SIGN-OFF =================
        doc.addPage();
        drawWatermark();

        // Top Gold Accent Bar
        doc.rect(0, 0, 595.28, 6).fill(primaryGold);

<<<<<<< HEAD
        // Page 2 Header (Responsive 2-column layout matching Page 1)
        const p2CompFontSize = compName.length > 30 ? 9 : 10.5;

        if (resolvedLogo) {
          doc.image(resolvedLogo, 36, 16, { width: 24, height: 24 });
          const p2CompX = 66;
          const p2CompWidth = 270;
          doc.fillColor(darkGold).fontSize(p2CompFontSize).font('Helvetica-Bold')
            .text(compName, p2CompX, 16, { width: p2CompWidth, lineGap: 1 });
          const p2NameHeight = doc.heightOfString(compName, { width: p2CompWidth, lineGap: 1 });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica-Bold')
            .text('TRAINING & PLACEMENT SOLUTIONS', p2CompX, 16 + p2NameHeight + 1, { width: p2CompWidth });
        } else {
          const p2CompX = 36;
          const p2CompWidth = 300;
          doc.fillColor(darkGold).fontSize(p2CompFontSize).font('Helvetica-Bold')
            .text(compName, p2CompX, 16, { width: p2CompWidth, lineGap: 1 });
          const p2NameHeight = doc.heightOfString(compName, { width: p2CompWidth, lineGap: 1 });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica-Bold')
            .text('TRAINING & PLACEMENT SOLUTIONS', p2CompX, 16 + p2NameHeight + 1, { width: p2CompWidth });
        }

        // Page 2 Right Metadata block
        const p2MetaX = 345;
        const p2MetaWidth = 214;
        doc.fillColor(darkGold).fontSize(8.5).font('Helvetica-Bold')
          .text(`REF: ${data.proposalId}`, p2MetaX, 16, { align: 'right', width: p2MetaWidth });
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold')
          .text(data.college.name, p2MetaX, 27, { align: 'right', width: p2MetaWidth, lineBreak: false });
        doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
          .text(`Version: v${data.version} | Status: ${data.status}`, p2MetaX, 38, { align: 'right', width: p2MetaWidth });

=======
        if (resolvedLogo) {
          doc.image(resolvedLogo, 36, 22, { width: 24, height: 24 });
          doc.fillColor(darkGold).fontSize(11).font('Helvetica-Bold').text('GENESIS TRAINING & PLACEMENT SOLUTIONS', 68, 24);
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica').text(`Proposal Ref: ${data.proposalId} | Institution: ${data.college.name}`, 68, 36);
        } else {
          doc.fillColor(darkGold).fontSize(11).font('Helvetica-Bold').text('GENESIS TRAINING & PLACEMENT SOLUTIONS', 36, 24);
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica').text(`Proposal Ref: ${data.proposalId} | Institution: ${data.college.name}`, 36, 36);
        }

>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
        let p2Y = 56;

        // Section 3: Standard Commercial Terms & Payment Milestones
        doc.rect(36, p2Y, 523.28, 16).fill(slateDark);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('3. STANDARD COMMERCIAL TERMS & PAYMENT MILESTONES', 44, p2Y + 4);

        p2Y += 22;

        const defaultTerms = [
          'Payment Milestone: 40% advance mobilization fee upon MoU execution and training calendar finalization.',
          'Payment Milestone: 40% interim milestone upon completion of 50% scheduled curriculum delivery hours.',
          'Payment Milestone: 20% final settlement upon delivery of capstone mock drives and candidate performance dossier.',
          'Trainer Logistics & Infrastructure: Dedicated air-conditioned smart hall with high-speed internet, projector, and audio provided by the institution.',
          'Attendance Mandate: Minimum 85% student attendance required to maintain eligibility for Genesis corporate recruitment drives.',
<<<<<<< HEAD
          `Statutory Taxes: GST @ ${data.gstRate}% is included in the Grand Total as per Government of India taxation schedules (ITC eligible).`,
          `Commercial Validity: This commercial proposal is valid until ${data.validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
=======
          'Statutory Taxes: GST @ 18% is included in the Grand Total as per Government of India taxation schedules (ITC eligible).',
          'Commercial Validity: This commercial proposal is valid for 30 calendar days from the date of issuance.',
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
        ];

        const termsToPrint = data.termsAndConditions && data.termsAndConditions.length > 0 ? data.termsAndConditions : defaultTerms;

        termsToPrint.forEach((term, index) => {
          doc.fillColor(darkGold).fontSize(7).font('Helvetica-Bold').text(`${index + 1}.`, 36, p2Y);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica').text(term, 50, p2Y, { width: 505 });
          p2Y += 16;
        });

        p2Y += 12;

        // Section 4: Quality Assurance & Corporate Placement Connect
        doc.rect(36, p2Y, 523.28, 16).fill(slateDark);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('4. QUALITY ASSURANCE & CORPORATE RECRUITMENT SUPPORT', 44, p2Y + 4);

        p2Y += 22;
        doc.fillColor(slateDark).fontSize(7).font('Helvetica')
          .text('• Certified Master Corporate Trainers with 8+ years domain industry experience across tier-1 product and consulting firms.', 36, p2Y);
        p2Y += 14;
        doc.fillColor(slateDark).fontSize(7).font('Helvetica')
          .text('• Genesis AI-powered student diagnostic engine offering individual placement readiness index, mock interview analytics, and skill benchmarking.', 36, p2Y);
        p2Y += 14;
        doc.fillColor(slateDark).fontSize(7).font('Helvetica')
          .text('• Dedicated Institutional Account Manager providing weekly attendance telemetry, assessment dashboards, and corporate drive alignment.', 36, p2Y);

        p2Y += 28;

        // Signatures Section Box
<<<<<<< HEAD
        doc.rect(36, p2Y, 523.28, 115).fill(lightBg).stroke(accentBorder);

        const sigWidth = 230;
        // Left Box: Genesis Signatures (BD Executive Creator + BD Manager Digital Approval)
        if (data.digitalApproval) {
          doc.fillColor('#B5891E').fontSize(8).font('Helvetica-Bold').text('GENESIS DIGITAL APPROVAL', 56, p2Y + 10, { width: sigWidth });
          doc.fillColor(slateDark).fontSize(6.8).font('Helvetica-Bold').text(`Approval Ref: ${data.digitalApproval.approvalId}`, 56, p2Y + 22, { width: sigWidth });
          const approvedDateStr = new Date(data.digitalApproval.approvedAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text(`Approved On: ${approvedDateStr} (v${data.digitalApproval.proposalVersion || data.version})`, 56, p2Y + 32, { width: sigWidth });
          doc.fillColor(slateDark).fontSize(6.8).font('Helvetica')
            .text(`Created By: ${data.createdBy?.fullName || 'BD Executive'} (BD Executive)`, 56, p2Y + 44, { width: sigWidth });
          doc.fillColor('#059669').fontSize(6.5).font('Helvetica-Bold').text('Integrity Check: Verified & Digitally Signed', 56, p2Y + 56, { width: sigWidth });
          doc.moveTo(56, p2Y + 68).lineTo(56 + sigWidth, p2Y + 68).stroke('#B5891E');
          doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text(data.digitalApproval.approvedByName || data.approvedBy?.fullName || 'BD Manager', 56, p2Y + 74, { width: sigWidth });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text('Digitally Approved by BD Manager', 56, p2Y + 86, { width: sigWidth });
        } else {
          doc.fillColor(slateDark).fontSize(8).font('Helvetica-Bold').text(`FOR ${company.name.toUpperCase()}`, 56, p2Y + 10, { width: sigWidth });
          doc.fillColor(slateDark).fontSize(6.8).font('Helvetica')
            .text(`Prepared By: ${data.createdBy?.fullName || 'Authorized BD Executive'}`, 56, p2Y + 24, { width: sigWidth });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
            .text('Role: Business Development Executive', 56, p2Y + 35, { width: sigWidth });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica-Oblique')
            .text('Status: Pending BD Manager Digital Sign-off', 56, p2Y + 48, { width: sigWidth });
          doc.moveTo(56, p2Y + 68).lineTo(56 + sigWidth, p2Y + 68).stroke(slateMuted);
          doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text(data.createdBy?.fullName || 'Authorized Genesis Signatory', 56, p2Y + 74, { width: sigWidth });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text('Genesis BD Representative', 56, p2Y + 86, { width: sigWidth });
        }

        // Right Box: College Signature / Digital Acceptance
        if (data.digitalAcceptance) {
          doc.fillColor('#065F46').fontSize(8).font('Helvetica-Bold').text('COLLEGE DIGITAL ACCEPTANCE', 315, p2Y + 10, { width: sigWidth });
          doc.fillColor(slateDark).fontSize(6.8).font('Helvetica-Bold').text(`Acceptance Ref: ${data.digitalAcceptance.acceptanceId}`, 315, p2Y + 22, { width: sigWidth });
          const acceptedDateStr = new Date(data.digitalAcceptance.acceptedAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text(`Accepted On: ${acceptedDateStr} (v${data.digitalAcceptance.proposalVersion})`, 315, p2Y + 32, { width: sigWidth });
          doc.fillColor(slateDark).fontSize(6.8).font('Helvetica')
            .text(`Signatory: ${data.digitalAcceptance.acceptedByName || data.college.placementOfficerName}`, 315, p2Y + 44, { width: sigWidth });
          doc.fillColor('#047857').fontSize(6.5).font('Helvetica-Bold').text('Document Integrity: Verified', 315, p2Y + 56, { width: sigWidth });
          doc.moveTo(315, p2Y + 68).lineTo(315 + sigWidth, p2Y + 68).stroke('#10B981');
          doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text(data.digitalAcceptance.acceptedByName || data.college.placementOfficerName, 315, p2Y + 74, { width: sigWidth });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text('Authorized College Placement Officer / Principal', 315, p2Y + 86, { width: sigWidth });
        } else {
          doc.fillColor(slateDark).fontSize(8).font('Helvetica-Bold').text(`FOR ${data.college.name.toUpperCase()}`, 315, p2Y + 10, { width: sigWidth });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text(`Placement Cell / Principal Office`, 315, p2Y + 24, { width: sigWidth });
          doc.moveTo(315, p2Y + 68).lineTo(315 + sigWidth, p2Y + 68).stroke(slateMuted);
          doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text(data.college.placementOfficerName || 'Authorized Signatory', 315, p2Y + 74, { width: sigWidth });
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text('Dean / Training & Placement Officer / Principal', 315, p2Y + 86, { width: sigWidth });
        }
=======
        doc.rect(36, p2Y, 523.28, 105).fill(lightBg).stroke(accentBorder);

        const sigWidth = 225;
        // Genesis Signature
        doc.fillColor(slateDark).fontSize(8).font('Helvetica-Bold').text('FOR GENESIS TRAINING SOLUTIONS', 56, p2Y + 12);
        doc.moveTo(56, p2Y + 70).lineTo(56 + sigWidth, p2Y + 70).stroke(slateMuted);
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text(data.approvedBy ? data.approvedBy.fullName : data.createdBy.fullName, 56, p2Y + 76);
        doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text('Authorized Business Development Lead', 56, p2Y + 87);

        // College Signature
        doc.fillColor(slateDark).fontSize(8).font('Helvetica-Bold').text(`FOR ${data.college.name.toUpperCase()}`, 315, p2Y + 12, { width: sigWidth });
        doc.moveTo(315, p2Y + 70).lineTo(315 + sigWidth, p2Y + 70).stroke(slateMuted);
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text(data.college.placementOfficerName, 315, p2Y + 76);
        doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica').text('Dean / Training & Placement Officer / Principal', 315, p2Y + 87);
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)

        // ================= FOOTER ON EXACTLY ALL 2 PAGES =================
        const pageRange = doc.bufferedPageRange();
        const totalPageCount = pageRange.count;

        for (let i = 0; i < totalPageCount; i++) {
          doc.switchToPage(i);
          doc.save();
          // Fixed safe Y = 768 to prevent any page overflow
          doc.rect(36, 768, 523.28, 0.8).fill(accentBorder);
<<<<<<< HEAD
          doc.fillColor(slateMuted).fontSize(6.2).font('Helvetica')
            .text(`${company.name} | ${company.address} | Support: ${company.email} | Phone: ${company.phone}`, 36, 774, { width: 410, lineBreak: false })
            .text(`Page ${i + 1} of ${totalPageCount}`, 450, 774, { align: 'right', width: 109.28, lineBreak: false });
=======
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
            .text(`${config.company.name} | ${config.company.address} | Support: ${config.company.email}`, 36, 774, { width: 380, lineBreak: false })
            .text(`Page ${i + 1} of ${totalPageCount}`, 420, 774, { align: 'right', width: 139.28, lineBreak: false });
>>>>>>> 02b8974 (Initial Draft for Genesis Business Card)
          doc.restore();
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
