
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// El middleware ya no es necesario. La lógica de protección de rutas
// ahora es manejada exclusivamente por AppLayout.tsx, que tiene acceso
// al estado de autenticación del cliente y es más fiable.
// Dejar este archivo vacío desactiva el middleware de Next.js.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Al no especificar un 'matcher', el middleware no se ejecutará en ninguna ruta.
export const config = {
  matcher: [],
};
