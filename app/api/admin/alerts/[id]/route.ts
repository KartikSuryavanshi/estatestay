import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStaffRequest } from '@/lib/auth';
export async function PATCH(request: Request, { params }: { params: { id: string } }) { if (!isStaffRequest(request)) return NextResponse.json({ error: 'Staff access required' }, { status: 401 }); const userId = request.headers.get('x-staff-user-id'); try { const alert = await prisma.complaintAlert.update({ where: { id: params.id }, data: { acknowledgedAt: new Date(), acknowledgedBy: userId || undefined } }); return NextResponse.json(alert); } catch { return NextResponse.json({ error: 'Alert not found' }, { status: 404 }); } }
