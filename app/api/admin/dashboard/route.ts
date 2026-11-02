import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStaffRequest } from '@/lib/auth';
export async function GET(request: Request) {
  if (!isStaffRequest(request)) return NextResponse.json({ error: 'Staff access required' }, { status: 401 });
  try {
    const start = new Date(); start.setUTCHours(0, 0, 0, 0); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1); const now = new Date();
    const [confirmed, arrivals, departures, upcoming, pending, unsorted, recent, alerts, inventory] = await Promise.all([
      prisma.booking.findMany({ where: { status: 'CONFIRMED' }, select: { totalAmount: true } }),
      prisma.booking.findMany({ where: { status: 'CONFIRMED', checkIn: { gte: start, lt: end } }, include: { roomCategory: true } }),
      prisma.booking.findMany({ where: { status: 'CONFIRMED', checkOut: { gte: start, lt: end } }, include: { roomCategory: true } }),
      prisma.booking.findMany({ where: { status: 'CONFIRMED', checkIn: { gte: now } }, orderBy: { checkIn: 'asc' }, take: 10, include: { roomCategory: true } }),
      prisma.enquiry.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.enquiry.count({ where: { category: 'UNSORTED', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { roomCategory: true } }),
      prisma.complaintAlert.findMany({ where: { acknowledgedAt: null }, orderBy: { createdAt: 'desc' }, include: { enquiry: true } }),
      prisma.websiteAllotment.aggregate({ _sum: { allotment: true } })
    ]);
    const occupied = await prisma.bookingNight.count({ where: { booking: { status: 'CONFIRMED' }, date: { gte: start, lt: end } } });
    const allotment = inventory._sum.allotment || 0;
    return NextResponse.json({ totalBookings: confirmed.length, arrivalsToday: arrivals, departuresToday: departures, upcoming, directRevenue: confirmed.reduce((sum, b) => sum + b.totalAmount, 0), pendingEnquiries: pending, unsortedEnquiries: unsorted, recentReservations: recent, occupancy: allotment ? Math.round((occupied / allotment) * 100) : 0, complaintAlerts: alerts });
  } catch { return NextResponse.json({ error: 'Dashboard unavailable' }, { status: 503 }); }
}
