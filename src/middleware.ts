import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth } from './lib/firebase-admin';
import { Auth } from 'firebase-admin/auth';

async function verifySessionCookie(cookie: string | undefined, auth: Auth) {
  if (!cookie) return null;
  try {
    return await auth.verifySessionCookie(cookie, true);
  } catch (err) {
    console.warn("Middleware: Invalid session cookie");
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const decodedToken = await verifySessionCookie(sessionCookie, getFirebaseAuth());
  
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/login';
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  
  // Allow API auth routes to proceed
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // If user is not authenticated and is not on the login page, redirect to login
  if (!decodedToken && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // If user is authenticated and tries to access the login page, redirect to home
  if (decodedToken && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // We apply this middleware to all routes except for static files, etc.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
