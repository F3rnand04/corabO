import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // This middleware is no longer needed for session management, as the client-side
  // AuthProvider now handles routing and authentication state.
  // This can be used in the future for other purposes like A/B testing, etc.
  return NextResponse.next();
}

export const config = {
  // We apply this middleware to all routes except for API routes, static files, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
