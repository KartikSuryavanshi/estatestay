import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST as login } from '../app/api/auth/staff/route';
import { POST as saveRate } from '../app/api/admin/rates/route';
import { createBookingWithInventory } from '../lib/booking-service';
const enabled = Boolean(process.env.DATABASE_URL);
describe.skipIf(!enabled)('database-backed rate management', () => {
  const prisma = new PrismaClient();
  it('persists rates, GST, allotments and rejects committed inventory reductions', async () => {
    const auth = await login(new Request('http://localhost/api/auth/staff', { method: 'POST', body: JSON.stringify({ email: 'stay@estatestay.example', password: 'estate2026' }) })); const cookie = auth.headers.get('set-cookie') || '';
    const room = await prisma.roomCategory.findUniqueOrThrow({ where: { name: 'Plantation View Room' } }); const date = '2026-12-20';
    const booking = await createBookingWithInventory({ roomCategoryId: room.id, checkIn: date, checkOut: '2026-12-21', guestCount: 2, idempotencyKey: 'TEST-RATE-COMMIT-123456' }); await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED', paymentStatus: 'SUCCESS' } });
    const rejected = await saveRate(new Request('http://localhost/api/admin/rates', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ roomCategoryId: room.id, date, basePrice: 11111, gstRate: 18, allotment: 0, blackout: true }) })); expect(rejected.status).toBe(409);
    const saved = await saveRate(new Request('http://localhost/api/admin/rates', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ roomCategoryId: room.id, date, basePrice: 11111, gstRate: 18, allotment: 2, blackout: false }) })); expect(saved.status).toBe(200);
    const rate = await prisma.dailyRate.findUniqueOrThrow({ where: { roomCategoryId_date: { roomCategoryId: room.id, date: new Date(`${date}T00:00:00Z`) } } }); expect(rate.basePrice).toBe(11111); expect(rate.gstRate).toBe(18);
    await prisma.booking.delete({ where: { id: booking.id } }); await prisma.$disconnect();
  });
});
