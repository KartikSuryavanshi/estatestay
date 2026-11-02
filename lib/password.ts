import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
export function hashPassword(password: string) { const salt = randomBytes(16).toString('hex'); const key = scryptSync(password, salt, 64).toString('hex'); return `${salt}:${key}`; }
export function verifyPassword(password: string, encoded: string) { const [salt, key] = encoded.split(':'); if (!salt || !key) return false; const actual = scryptSync(password, salt, 64); const expected = Buffer.from(key, 'hex'); return expected.length === actual.length && timingSafeEqual(actual, expected); }
