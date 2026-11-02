import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStaffRequest, staffUserId } from '@/lib/auth';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isStaffRequest(request)) return NextResponse.json({ error: 'Staff access required' }, { status: 401 }); try { const { id } = await params; const alert = await prisma.complaintAlert.update({ where: { id }, data: { acknowledgedAt: new Date(), acknowledgedBy: staffUserId(request) || undefined } }); return NextResponse.json(alert); } catch { return NextResponse.json({ error: 'Alert not found' }, { status: 404 }); } }
