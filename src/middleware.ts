
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // This middleware is now a placeholder.
  // The server-side auth flow handles session management via secure cookies.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
