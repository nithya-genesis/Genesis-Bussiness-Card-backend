import crypto from 'crypto';

/**
 * Generates a cryptographically secure 64-character random hexadecimal public token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
