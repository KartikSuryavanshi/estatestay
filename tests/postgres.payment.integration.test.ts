import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createBookingWithInventory } from '../lib/booking-service';
import { POST as simulatePayment } from '../app/api/payments/simulate/route';
const enabled = Boolean(process.env.DATABASE_URL);
describe.skipIf(!enabled)('PostgreSQL payment lifecycle', () => {
  const prisma = new PrismaClient();
  it('confirms successful payments and ignores duplicate callbacks', async () => {
    const room = await prisma.roomCategory.findUniqueOrThrow({ where: { name: 'Estate Classic Room' } });
    const booking = await createBookingWithInventory({ roomCategoryId: room.id, checkIn: '2026-12-10', checkOut: '2026-12-11', guestCount: 2, idempotencyKey: 'TEST-PAYMENT-SUCCESS-123456' });
    const body = { bookingReference: booking.bookingReference, outcome: 'success', callbackKey: 'TEST-CALLBACK-123456' };
    const first = await simulatePayment(new Request('http://localhost/api/payments/simulate', { method: 'POST', body: JSON.stringify(body) }));
    const second = await simulatePayment(new Request('http://localhost/api/payments/simulate', { method: 'POST', body: JSON.stringify(body) }));
    expect(first.status).toBe(200); expect(second.status).toBe(200); expect((await second.json()).idempotent).toBe(true);
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe('CONFIRMED');
    expect(await prisma.payment.count({ where: { bookingId: booking.id } })).toBe(1);
    await prisma.booking.delete({ where: { id: booking.id } }); await prisma.$disconnect();
  });
  it('releases inventory after a failed payment', async () => {
    const room = await prisma.roomCategory.findUniqueOrThrow({ where: { name: 'Estate Classic Room' } });
    const booking = await createBookingWithInventory({ roomCategoryId: room.id, checkIn: '2026-12-12', checkOut: '2026-12-13', guestCount: 2, idempotencyKey: 'TEST-PAYMENT-FAILED-123456' });
    const response = await simulatePayment(new Request('http://localhost/api/payments/simulate', { method: 'POST', body: JSON.stringify({ bookingReference: booking.bookingReference, outcome: 'failed', callbackKey: 'TEST-CALLBACK-FAILED-123456' }) }));
    expect(response.status).toBe(200);
    const persisted = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { hold: true } });
    expect(persisted.status).toBe('CANCELLED');
    expect(persisted.hold?.status).toBe('RELEASED');
    await prisma.booking.delete({ where: { id: booking.id } }); await prisma.$disconnect();
  });
  it('validates and applies a seeded promo before GST', async () => {
    const room = await prisma.roomCategory.findUniqueOrThrow({ where: { name: 'Estate Classic Room' } });
    const booking = await createBookingWithInventory({ roomCategoryId: room.id, checkIn: '2026-12-14', checkOut: '2026-12-15', guestCount: 2, promoCode: 'estate10', idempotencyKey: 'TEST-PROMO-123456789' });
    expect(booking.baseAmount).toBe(7650);
    expect(booking.taxAmount).toBe(918);
    expect(booking.totalAmount).toBe(8568);
    await prisma.booking.delete({ where: { id: booking.id } }); await prisma.$disconnect();
  });
});
