import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { stayDates } from './inventory';
import { calculatePrice } from './utils';

async function createBookingWithInventoryAttempt(input: { roomCategoryId: string; checkIn: string; checkOut: string; guestCount: number; promoCode?: string; userId?: string; idempotencyKey?: string }) {
  const dates = stayDates(input.checkIn, input.checkOut);
  if (!dates.length) throw new Error('INVALID_STAY');
  return prisma.$transaction(async tx => {
    if (input.idempotencyKey) { const existing = await tx.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey } }); if (existing) return existing; }
    await tx.booking.updateMany({ where: { status: 'HOLD', hold: { is: { status: 'ACTIVE', expiresAt: { lt: new Date() } } } }, data: { status: 'EXPIRED', paymentStatus: 'CANCELLED' } });
    await tx.bookingHold.updateMany({ where: { status: 'ACTIVE', expiresAt: { lt: new Date() } }, data: { status: 'EXPIRED' } });
    const room = await tx.roomCategory.findUniqueOrThrow({ where: { id: input.roomCategoryId } });
    if (input.guestCount > room.capacity) throw new Error('CAPACITY_EXCEEDED');
    const rates = await tx.dailyRate.findMany({ where: { roomCategoryId: room.id, date: { gte: new Date(`${input.checkIn}T00:00:00Z`), lt: new Date(`${input.checkOut}T00:00:00Z`) } } });
    const allotments = await tx.websiteAllotment.findMany({ where: { roomCategoryId: room.id, date: { gte: new Date(`${input.checkIn}T00:00:00Z`), lt: new Date(`${input.checkOut}T00:00:00Z`) } } });
    if (rates.length !== dates.length || allotments.length !== dates.length) throw new Error('INVENTORY_NOT_CONFIGURED');
    // Lock the allotment rows before checking counts. Serializable isolation
    // protects the read/insert sequence; the row locks make the contention
    // explicit and avoid two requests racing on the same stay dates.
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "WebsiteAllotment" WHERE "roomCategoryId" = ${room.id} AND "date" >= ${new Date(`${input.checkIn}T00:00:00Z`)} AND "date" < ${new Date(`${input.checkOut}T00:00:00Z`)} FOR UPDATE`);
    const booked = await tx.bookingNight.findMany({ where: { roomCategoryId: room.id, date: { in: dates.map(d => new Date(`${d}T00:00:00Z`)) }, booking: { status: { in: ['HOLD', 'CONFIRMED'] } } }, select: { date: true } });
    for (const date of dates) { const allotment = allotments.find(a => a.date.toISOString().slice(0,10) === date)?.allotment ?? 0; const count = booked.filter(b => b.date.toISOString().slice(0,10) === date).length; if (count >= allotment) throw new Error('SOLD_OUT'); }
    const price = rates.reduce((totals, rate) => {
      const nightly = calculatePrice(rate.basePrice, rate.gstRate, 1);
      return { base: totals.base + nightly.base, tax: totals.tax + nightly.tax, total: totals.total + nightly.total };
    }, { base: 0, tax: 0, total: 0 });
    let discount = 0;
    if (input.promoCode) {
      const promo = await tx.promoCode.findUnique({ where: { code: input.promoCode.trim().toUpperCase() } });
      if (!promo || !promo.active || promo.validFrom > new Date(`${input.checkIn}T00:00:00Z`) || promo.validUntil < new Date(`${input.checkOut}T00:00:00Z`)) throw new Error('INVALID_PROMO');
      discount = promo.discountType === 'PERCENT' ? Math.round(price.base * promo.discountValue / 100) : promo.discountValue;
      discount = Math.min(price.base, Math.max(0, discount));
    }
    const finalBase = price.base - discount;
    const finalTax = rates.reduce((tax, rate) => {
      const nightlyDiscount = discount ? Math.round(discount * rate.basePrice / price.base) : 0;
      return tax + Math.round((rate.basePrice - nightlyDiscount) * rate.gstRate / 100);
    }, 0);
    const finalPrice = { base: finalBase, tax: finalTax, total: finalBase + finalTax };
    const booking = await tx.booking.create({ data: { bookingReference: `ES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`, idempotencyKey: input.idempotencyKey, userId: input.userId, roomCategoryId: room.id, checkIn: new Date(`${input.checkIn}T00:00:00Z`), checkOut: new Date(`${input.checkOut}T00:00:00Z`), guestCount: input.guestCount, baseAmount: finalPrice.base, taxAmount: finalPrice.tax, totalAmount: finalPrice.total, status: 'HOLD', paymentStatus: 'PENDING', bookingNights: { create: dates.map(date => ({ roomCategoryId: room.id, date: new Date(`${date}T00:00:00Z`) })) }, hold: { create: { expiresAt: new Date(Date.now() + 15 * 60 * 1000) } } }, include: { bookingNights: true, hold: true } });
    return booking;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createBookingWithInventory(input: { roomCategoryId: string; checkIn: string; checkOut: string; guestCount: number; promoCode?: string; userId?: string; idempotencyKey?: string }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await createBookingWithInventoryAttempt(input); }
    catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
      if (!retryable || attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 20 * (attempt + 1)));
    }
  }
  throw new Error('BOOKING_FAILED');
}
