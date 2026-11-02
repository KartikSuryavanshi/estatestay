import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createBookingWithInventory } from '../lib/booking-service';

const enabled = Boolean(process.env.DATABASE_URL);
describe.skipIf(!enabled)('PostgreSQL booking concurrency', () => {
  const prisma = new PrismaClient();
  it('allows exactly one booking for a last villa', async () => {
    const room = await prisma.roomCategory.findUniqueOrThrow({ where: { name: 'Private Estate Villa' } });
    const dates = ['2026-12-01', '2026-12-02'];
    await prisma.bookingNight.deleteMany({ where: { roomCategoryId: room.id, date: { in: dates.map(d => new Date(`${d}T00:00:00Z`)) } } });
    await prisma.booking.deleteMany({ where: { bookingReference: { startsWith: 'TEST-CONCURRENCY' } } });
    for (const date of dates) await prisma.websiteAllotment.update({ where: { roomCategoryId_date: { roomCategoryId: room.id, date: new Date(`${date}T00:00:00Z`) } }, data: { allotment: 1, blackout: false } });
    const results = await Promise.allSettled([
      createBookingWithInventory({ roomCategoryId: room.id, checkIn: '2026-12-01', checkOut: '2026-12-03', guestCount: 2, idempotencyKey: 'TEST-CONCURRENCY-A-123456' }),
      createBookingWithInventory({ roomCategoryId: room.id, checkIn: '2026-12-01', checkOut: '2026-12-03', guestCount: 2, idempotencyKey: 'TEST-CONCURRENCY-B-123456' })
    ]);
    const successful = results.filter(r => r.status === 'fulfilled');
    const active = await prisma.booking.count({ where: { roomCategoryId: room.id, status: { in: ['HOLD', 'CONFIRMED'] }, bookingNights: { some: { date: new Date('2026-12-01T00:00:00Z') } } } });
    expect(successful).toHaveLength(1);
    expect(active).toBe(1);
    await prisma.booking.deleteMany({ where: { bookingReference: { startsWith: 'ES-' }, bookingNights: { some: { date: new Date('2026-12-01T00:00:00Z') } } } });
    await prisma.$disconnect();
  });
});
