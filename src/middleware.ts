
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  let session = undefined;
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('__session')) {
      session = cookie;
      break;
    }
  }
  
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
