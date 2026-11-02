import { describe, expect, it } from 'vitest';
import { POST as login, DELETE as logout } from '../app/api/auth/staff/route';
import { GET as dashboard } from '../app/api/admin/dashboard/route';
const enabled = Boolean(process.env.DATABASE_URL);
describe.skipIf(!enabled)('staff authentication', () => {
  it('accepts seeded staff credentials and rejects unauthorized admin access', async () => {
    const invalid = await login(new Request('http://localhost/api/auth/staff', { method: 'POST', body: JSON.stringify({ email: 'stay@estatestay.example', password: 'wrong' }) }));
    expect(invalid.status).toBe(401);
    const valid = await login(new Request('http://localhost/api/auth/staff', { method: 'POST', body: JSON.stringify({ email: 'stay@estatestay.example', password: 'estate2026' }) }));
    expect(valid.status).toBe(200); const cookie = valid.headers.get('set-cookie'); expect(cookie).toContain('estate_staff=');
    const authorized = await dashboard(new Request('http://localhost/api/admin/dashboard', { headers: { cookie: cookie || '' } })); expect(authorized.status).toBe(200);
    const denied = await dashboard(new Request('http://localhost/api/admin/dashboard')); expect(denied.status).toBe(401);
    const cleared = await logout(); expect(cleared.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
