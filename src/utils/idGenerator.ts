import { prisma } from '../models/prisma.js';

/**
 * Generates sequential, year-coded unique IDs for Colleges (e.g. GEN-COL-2026-00001)
 */
export async function generateCollegeId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GEN-COL-${year}`;

  const count = await prisma.college.count();
  const nextNumber = count + 1;
  const padded = String(nextNumber).padStart(5, '0');

  let candidate = `${prefix}-${padded}`;
  // Ensure uniqueness in case of race/deletion
  let exists = await prisma.college.findUnique({ where: { collegeId: candidate } });
  let offset = 1;
  while (exists) {
    const nextOffsetPadded = String(nextNumber + offset).padStart(5, '0');
    candidate = `${prefix}-${nextOffsetPadded}`;
    exists = await prisma.college.findUnique({ where: { collegeId: candidate } });
    offset++;
  }

  return candidate;
}

/**
 * Generates sequential, year-coded unique IDs for Proposals (e.g. GEN-PROP-2026-00001)
 */
export async function generateProposalId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GEN-PROP-${year}`;

  const count = await prisma.proposal.count();
  const nextNumber = count + 1;
  const padded = String(nextNumber).padStart(5, '0');

  let candidate = `${prefix}-${padded}`;
  let exists = await prisma.proposal.findUnique({ where: { proposalId: candidate } });
  let offset = 1;
  while (exists) {
    const nextOffsetPadded = String(nextNumber + offset).padStart(5, '0');
    candidate = `${prefix}-${nextOffsetPadded}`;
    exists = await prisma.proposal.findUnique({ where: { proposalId: candidate } });
    offset++;
  }

  return candidate;
}
