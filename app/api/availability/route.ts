import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rooms } from '@/lib/data';
import { stayDates } from '@/lib/inventory';

export async function GET(request: Request) {
  const url = new URL(request.url); const checkIn = url.searchParams.get('checkIn'); const checkOut = url.searchParams.get('checkOut');
  if (!process.env.DATABASE_URL || !checkIn || !checkOut) return NextResponse.json({ rooms, source: 'seed-fallback', note: 'Connect DATABASE_URL and provide checkIn/checkOut to use live inventory.' });
  const dates = stayDates(checkIn, checkOut); if (!dates.length) return NextResponse.json({ error: 'Invalid stay dates.' }, { status: 400 });
  try {
    const start = new Date(`${checkIn}T00:00:00Z`); const end = new Date(`${checkOut}T00:00:00Z`);
    const categories = await prisma.roomCategory.findMany({ where: { active: true }, include: { dailyRates: { where: { date: { gte: start, lt: end } } }, allotments: { where: { date: { gte: start, lt: end } } } } });
    const nights = await prisma.bookingNight.findMany({ where: { date: { gte: start, lt: end }, booking: { status: { in: ['HOLD', 'CONFIRMED'] }, OR: [{ status: 'CONFIRMED' }, { status: 'HOLD', hold: { is: { status: 'ACTIVE', expiresAt: { gt: new Date() } } } }] } }, select: { roomCategoryId: true, date: true } });
    const result = categories.map(category => { const booked = nights.filter(n => n.roomCategoryId === category.id); const available = Math.min(...dates.map(date => { const allotment = category.allotments.find(a => a.date.toISOString().slice(0,10) === date)?.allotment ?? 0; const used = booked.filter(n => n.date.toISOString().slice(0,10) === date).length; return Math.max(0, allotment - used); })); const rate = category.dailyRates[0]; return { id: category.id, name: category.name, description: category.description, capacity: category.capacity, price: rate?.basePrice ?? category.basePrice, gstRate: rate?.gstRate ?? 0, images: category.images, amenities: category.amenities, available: Number.isFinite(available) ? available : 0 }; });
    return NextResponse.json({ rooms: result, source: 'database', checkIn, checkOut });
  } catch { return NextResponse.json({ error: 'Availability service unavailable.' }, { status: 503 }); }
}
