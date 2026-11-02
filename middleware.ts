import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request:NextRequest){if(request.nextUrl.pathname.startsWith('/api/admin')&&!request.cookies.has('estate_staff'))return NextResponse.json({error:'Staff access required'},{status:401});return NextResponse.next();}
export const config={matcher:['/api/admin/:path*']};
