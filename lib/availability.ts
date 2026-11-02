import { prisma } from './prisma';
import { rooms as fallbackRooms } from './data';
import { stayDates } from './inventory';
import type { Room } from './types';

export async function getLiveRooms(checkIn: string, checkOut: string): Promise<Room[]> {
  const dates = stayDates(checkIn, checkOut);
  if (!dates.length) throw new Error('INVALID_STAY');

  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  const categories = await prisma.roomCategory.findMany({
    where: { active: true },
    include: {
      dailyRates: { where: { date: { gte: start, lt: end } }, orderBy: { date: 'asc' } },
      allotments: { where: { date: { gte: start, lt: end } }, orderBy: { date: 'asc' } }
    }
  });
  const nights = await prisma.bookingNight.findMany({
    where: {
      date: { gte: start, lt: end },
      booking: {
        status: { in: ['HOLD', 'CONFIRMED'] },
        OR: [
          { status: 'CONFIRMED' },
          { status: 'HOLD', hold: { is: { status: 'ACTIVE', expiresAt: { gt: new Date() } } } }
        ]
      }
    },
    select: { roomCategoryId: true, date: true }
  });

  return categories.map(category => {
    const staticRoom = fallbackRooms.find(room => room.name === category.name);
    const booked = nights.filter(night => night.roomCategoryId === category.id);
    const available = Math.min(...dates.map(date => {
      const allotment = category.allotments.find(item => item.date.toISOString().slice(0, 10) === date);
      if (!allotment || allotment.blackout) return 0;
      const used = booked.filter(night => night.date.toISOString().slice(0, 10) === date).length;
      return Math.max(0, allotment.allotment - used);
    }));
    const rate = category.dailyRates[0];
    return {
      id: category.id,
      slug: staticRoom?.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: category.name,
      description: category.description,
      capacity: category.capacity,
      price: rate?.basePrice ?? category.basePrice,
      gstRate: rate?.gstRate ?? 0,
      bed: staticRoom?.bed || 'King bed',
      images: Array.isArray(category.images) ? category.images as string[] : staticRoom?.images || [],
      amenities: Array.isArray(category.amenities) ? category.amenities as string[] : staticRoom?.amenities || [],
      available: Number.isFinite(available) ? available : 0
    };
  });
}
