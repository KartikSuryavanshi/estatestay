import { NextResponse } from 'next/server';
import { classifyEnquiry } from '@/lib/ai';
import { enquirySchema } from '@/lib/validation';
export async function POST(req: Request) { const parsed=enquirySchema.safeParse(await req.json()); if(!parsed.success)return NextResponse.json({error:'Invalid enquiry details'},{status:400}); const ai=await classifyEnquiry(parsed.data.message); return NextResponse.json({ enquiry:{ ref:`ENQ-${Math.floor(4500+Math.random()*400)}`, ...parsed.data, ...ai, status:'OPEN', created:'Just now' }, mode:ai.mode },{status:201}); }
