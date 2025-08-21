
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

  // Define las rutas públicas que no requieren autenticación
  const isPublicPath = 
    pathname === '/login' ||
    pathname === '/cashier-login' ||
    pathname.startsWith('/policies') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/community-guidelines');

  // Permite el acceso a los archivos estáticos y de la API sin verificar la sesión
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Si el usuario no está autenticado y no está en una ruta pública, redirige a login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si el usuario está autenticado y trata de acceder a login, redirige a la página principal
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
