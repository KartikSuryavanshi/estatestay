import { createHmac, timingSafeEqual } from 'crypto';
const secret = () => {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error('NEXTAUTH_SECRET is not configured');
  return value;
};
export function createStaffToken(userId: string) { const payload = Buffer.from(JSON.stringify({ userId, role: 'STAFF', exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url'); const sig = createHmac('sha256', secret()).update(payload).digest('base64url'); return `${payload}.${sig}`; }
export function isStaffToken(token?: string) { if (!token || !process.env.NEXTAUTH_SECRET) return false; const [payload, sig] = token.split('.'); if (!payload || !sig) return false; try { const expected = createHmac('sha256', secret()).update(payload).digest('base64url'); if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false; const data = JSON.parse(Buffer.from(payload, 'base64url').toString()); return data.role === 'STAFF' && data.exp > Date.now(); } catch { return false; } }
export function isStaffRequest(request: Request) { const cookie = request.headers.get('cookie') || ''; const match = cookie.match(/estate_staff=([^;]+)/); return isStaffToken(match?.[1]); }
export function staffUserId(request: Request) { const cookie = request.headers.get('cookie') || ''; const match = cookie.match(/estate_staff=([^;]+)/); const token = match?.[1]; if (!isStaffToken(token)) return null; try { return JSON.parse(Buffer.from(token!.split('.')[0], 'base64url').toString()).userId as string; } catch { return null; } }
