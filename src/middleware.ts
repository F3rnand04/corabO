
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the session cookie
  // The default cookie name for Firebase Authentication is '__session'.
  // In App Hosting, it's prefixed, so we look for a cookie that starts with that name.
  const sessionCookie = Object.keys(request.cookies.getStore()).find(name => 
    name.startsWith('__session')
  );
  const session = sessionCookie ? request.cookies.get(sessionCookie) : undefined;
  
  // 2. Define public and protected paths
  const { pathname } = request.nextUrl;
  const isPublicPath = 
    pathname === '/login' ||
    pathname === '/cashier-login' ||
    pathname === '/policies' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/community-guidelines' ||
    pathname.startsWith('/_next/') || // Next.js internal files
    pathname.startsWith('/static/') || // Static assets
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icons/'); // PWA icons

  // 3. Redirect logic
  if (!session && !isPublicPath) {
    // If no session cookie and the path is not public, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && (pathname === '/login' || pathname === '/cashier-login')) {
    // If there is a session and user tries to access login page, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. If all checks pass, continue to the requested path
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - genkit (Genkit internal routes)
     * - images, icons (static assets)
     * This ensures the middleware runs on page navigations.
     */
    '/((?!api|genkit|images|icons|_next/static|favicon.ico).*)',
  ],
};
