import { NextResponse } from 'next/server';
import { rooms } from '@/lib/data';
import { stayDates } from '@/lib/inventory';
import { getLiveRooms } from '@/lib/availability';

export async function GET(request: Request) {
  const url = new URL(request.url); const checkIn = url.searchParams.get('checkIn'); const checkOut = url.searchParams.get('checkOut');
  if (!process.env.DATABASE_URL || !checkIn || !checkOut) return NextResponse.json({ rooms, source: 'seed-fallback', note: 'Connect DATABASE_URL and provide checkIn/checkOut to use live inventory.' });
  const dates = stayDates(checkIn, checkOut); if (!dates.length) return NextResponse.json({ error: 'Invalid stay dates.' }, { status: 400 });
  try {
    return NextResponse.json({ rooms: await getLiveRooms(checkIn, checkOut), source: 'database', checkIn, checkOut });
  } catch { return NextResponse.json({ error: 'Availability service unavailable.' }, { status: 503 }); }
}
