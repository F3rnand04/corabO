import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getFirebaseAdmin } from './lib/firebase-server';

async function verifySessionCookie(cookie: string) {
  const { auth } = getFirebaseAdmin();
  try {
    await auth.verifySessionCookie(cookie, true);
    return true;
  } catch (error) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  const { pathname } = request.nextUrl;
  const isPublicPath = pathname === '/login';

  if (!sessionCookie) {
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const isValidSession = await verifySessionCookie(sessionCookie);

  if (!isValidSession) {
    if (!isPublicPath) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
    const response = NextResponse.next();
    response.cookies.delete('session');
    return response;
  }
  
  if (isPublicPath) {
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
