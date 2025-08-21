
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookieName = Object.keys(request.cookies.getStore()).find(name => 
    name.startsWith('__session')
  );
  const session = sessionCookieName ? request.cookies.get(sessionCookieName) : undefined;
  
  const { pathname } = request.nextUrl;
  const isPublicPath = 
    pathname === '/login' ||
    pathname === '/cashier-login' ||
    pathname.startsWith('/policies') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/community-guidelines');

  // Allow access to static files and internal Next.js assets
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.') || // A simple way to catch file requests like favicon.ico
      pathname.startsWith('/api/') || // Exclude API routes
      pathname.startsWith('/genkit/')) {
    return NextResponse.next();
  }

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && (pathname === '/login' || pathname === '/cashier-login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
