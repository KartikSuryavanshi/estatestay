import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffToken } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
const secureCookie = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;
export async function POST(request: Request) { const body = await request.json(); try { const user = await prisma.user.findUnique({ where: { email: String(body.email || '').toLowerCase() } }); if (!user || user.role !== 'STAFF' || !user.passwordHash || !verifyPassword(String(body.password || ''), user.passwordHash)) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }); const response = NextResponse.json({ ok: true }); response.cookies.set('estate_staff', createStaffToken(user.id), { httpOnly: true, sameSite: 'lax', secure: secureCookie, path: '/', maxAge: 8 * 60 * 60 }); return response; } catch { return NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 }); } }
export async function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.set('estate_staff', '', { httpOnly: true, sameSite: 'lax', secure: secureCookie, path: '/', maxAge: 0 }); return response; }
