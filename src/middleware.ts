// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // This middleware is essential for routing decisions.
  // It checks for a session cookie and redirects if necessary.
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;
  
  // Allow access to API routes for auth
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // If trying to access a protected route without a session, redirect to login
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user has a session and is trying to access the login page, redirect to home
  if (session && pathname === '/login') {
     return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
      // Match all routes except for static assets, and Next.js internals
      '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
