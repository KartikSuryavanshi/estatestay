import { NextResponse } from 'next/server';
import { bookingSchema } from '@/lib/validation';
import { rooms } from '@/lib/data';
import { calculatePrice, nightsBetween } from '@/lib/utils';
import { createBookingWithInventory } from '@/lib/booking-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please check the booking details.' }, { status: 400 });
  const data = parsed.data; const room = rooms.find(r => r.id === data.roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  const nights = nightsBetween(data.checkIn, data.checkOut);
  if (nights < 1) return NextResponse.json({ error: 'Checkout must be after check-in.' }, { status: 400 });
  if (process.env.DATABASE_URL) {
    try {
      const dbRoom = await prisma.roomCategory.findFirst({ where: { OR: [{ id: data.roomId }, { name: room.name }] } });
      if (!dbRoom) return NextResponse.json({ error: 'Room inventory is not configured.' }, { status: 409 });
      const persisted = await createBookingWithInventory({ roomCategoryId: dbRoom.id, checkIn: data.checkIn, checkOut: data.checkOut, guestCount: Number(data.adults) + Number(data.children), promoCode: data.promoCode, idempotencyKey: data.idempotencyKey });
      return NextResponse.json({ reference: persisted.bookingReference, room: room.name, checkIn: data.checkIn, checkOut: data.checkOut, base: persisted.baseAmount, tax: persisted.taxAmount, total: persisted.totalAmount, paymentStatus: persisted.paymentStatus }, { status: 201 });
    } catch (error) { const reason = error instanceof Error ? error.message : 'BOOKING_FAILED'; return NextResponse.json({ error: reason === 'SOLD_OUT' ? 'This room is no longer available for all nights.' : reason === 'INVALID_PROMO' ? 'That promo code is invalid or expired.' : reason === 'CAPACITY_EXCEEDED' ? 'This room cannot accommodate that many guests.' : 'We could not hold this stay.' }, { status: 409 }); }
  }
  const price = calculatePrice(room.price, room.gstRate, nights); const reference = `ES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return NextResponse.json({ reference, room: room.name, checkIn: data.checkIn, checkOut: data.checkOut, ...price, paymentStatus: 'PENDING', mode: 'preview-fallback' }, { status: 201 });
}
