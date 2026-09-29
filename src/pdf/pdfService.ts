import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { formatINR, numberToWordsINR } from '../utils/currency.js';
import { QRService } from '../qr/qrService.js';
import { config } from '../config/index.js';

interface ProposalPdfData {
  proposalId: string;
  publicToken: string;
  version: number;
  status: string;
  createdAt: Date;
  validUntil: Date;
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
}

export class PDFService {
  /**
   * Generates an executive branded 2-page proposal PDF buffer with 18% GST, per-student metrics, custom items, and Genesis emblem
   */
  public static async generateProposalPdf(data: ProposalPdfData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36,
          bufferPages: true,
          autoFirstPage: true,
          info: {
            Title: `Genesis Proposal - ${data.college.name} (${data.proposalId})`,
            Author: 'Genesis Training & Placement Solutions',
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
          .text(`Placement Officer: ${data.college.placementOfficerName}`, 44, colY + 34)
          .text(`Email: ${data.college.placementOfficerEmail}`, 44, colY + 45)
          .text(`Phone: ${data.college.placementOfficerPhone}`, 44, colY + 56)
          .text(`Location: ${data.college.city}, ${data.college.state}`, 44, colY + 67);

        // Right: Genesis Rep & Validity
        doc.rect(304, colY, boxWidth, boxHeight).fill(lightBg).stroke(accentBorder);
        doc.rect(304, colY, boxWidth, 16).fill(primaryGold);
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text('GENESIS EXECUTIVE & VALIDITY', 312, colY + 4);

        doc.fillColor(slateDark).fontSize(8.5).font('Helvetica-Bold').text(data.createdBy.fullName, 312, colY + 20);
        doc.fillColor(slateMuted).fontSize(7).font('Helvetica')
          .text(`BD Executive: ${data.createdBy.email}`, 312, colY + 34)
          .text(`Official Portal: ${config.frontendUrl}`, 312, colY + 45)
          .text(`Validity: Valid until ${data.validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 312, colY + 56)
          .text(`Approved By: ${data.approvedBy ? data.approvedBy.fullName : 'Pending Executive Approval'}`, 312, colY + 67);

        // Section 1: Curriculum Breakdown
        let currentY = 182;
        doc.rect(36, currentY, 523.28, 16).fill(slateDark);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('1. SELECTED TRAINING PROGRAM & CURRICULUM ARCHITECTURE', 44, currentY + 4);

        currentY += 20;
        doc.fillColor(darkGold).fontSize(9.5).font('Helvetica-Bold').text(`${data.plan.name.toUpperCase()} PLAN (${data.plan.totalHours} TOTAL TRAINING HOURS)`, 36, currentY);
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

        const displayModules = data.plan.modules.length > 0 ? data.plan.modules : defaultModules;

        displayModules.slice(0, 5).forEach((mod, idx) => {
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#FAFAF7';
          doc.rect(tableX, currentY, tableWidth, 13).fill(rowBg).stroke(accentBorder);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica')
            .text(mod.name, tableX + 8, currentY + 3)
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

        // Section 2: Commercial Pricing & 18% GST Schedule
        doc.rect(36, currentY, 523.28, 16).fill(slateDark);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('2. COMMERCIAL INVESTMENT & STATUTORY GST SCHEDULE', 44, currentY + 4);

        currentY += 20;

        // Commercial Table Header
        doc.rect(tableX, currentY, tableWidth, 14).fill('#FFFDF5').stroke(accentBorder);
        doc.fillColor(darkGold).fontSize(7).font('Helvetica-Bold')
          .text('Item Description', tableX + 8, currentY + 3.5)
          .text('Basis', tableX + 240, currentY + 3.5)
          .text('Unit Rate', tableX + 350, currentY + 3.5)
          .text('Amount (INR)', tableX + 430, currentY + 3.5, { width: 85, align: 'right' });

        currentY += 14;

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

        // Custom Items Line Items (if any)
        customItems.forEach((ci, idx) => {
          const rowBg = idx % 2 === 0 ? '#FAFAF7' : '#FFFFFF';
          doc.rect(tableX, currentY, tableWidth, 14).fill(rowBg).stroke(accentBorder);
          doc.fillColor(slateDark).fontSize(7).font('Helvetica')
            .text(`Custom: ${ci.name}`, tableX + 8, currentY + 3);

          let basisText = ci.pricingType === 'PER_STUDENT' ? `${ci.quantity || data.studentCount} Students` : 'Fixed Custom';
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

        if (resolvedLogo) {
          doc.image(resolvedLogo, 36, 22, { width: 24, height: 24 });
          doc.fillColor(darkGold).fontSize(11).font('Helvetica-Bold').text('GENESIS TRAINING & PLACEMENT SOLUTIONS', 68, 24);
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica').text(`Proposal Ref: ${data.proposalId} | Institution: ${data.college.name}`, 68, 36);
        } else {
          doc.fillColor(darkGold).fontSize(11).font('Helvetica-Bold').text('GENESIS TRAINING & PLACEMENT SOLUTIONS', 36, 24);
          doc.fillColor(slateMuted).fontSize(7).font('Helvetica').text(`Proposal Ref: ${data.proposalId} | Institution: ${data.college.name}`, 36, 36);
        }

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
          'Statutory Taxes: GST @ 18% is included in the Grand Total as per Government of India taxation schedules (ITC eligible).',
          'Commercial Validity: This commercial proposal is valid for 30 calendar days from the date of issuance.',
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

        // ================= FOOTER ON EXACTLY ALL 2 PAGES =================
        const pageRange = doc.bufferedPageRange();
        const totalPageCount = pageRange.count;

        for (let i = 0; i < totalPageCount; i++) {
          doc.switchToPage(i);
          doc.save();
          // Fixed safe Y = 768 to prevent any page overflow
          doc.rect(36, 768, 523.28, 0.8).fill(accentBorder);
          doc.fillColor(slateMuted).fontSize(6.5).font('Helvetica')
            .text(`${config.company.name} | ${config.company.address} | Support: ${config.company.email}`, 36, 774, { width: 380, lineBreak: false })
            .text(`Page ${i + 1} of ${totalPageCount}`, 420, 774, { align: 'right', width: 139.28, lineBreak: false });
          doc.restore();
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
