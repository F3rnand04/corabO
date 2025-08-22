// El middleware se ha desactivado.
// La lógica de protección de rutas y redirección ahora es manejada exclusivamente
// por el componente /src/app/AppLayout.tsx, que tiene acceso al estado de
// autenticación del cliente y es más fiable para este caso de uso.

import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Simplemente dejamos pasar todas las peticiones.
  // La lógica se maneja en el cliente dentro de AppLayout.
  return NextResponse.next();
}

// Al establecer un matcher vacío, el middleware nunca se ejecutará.
// Esto lo desactiva de forma segura sin eliminar el archivo.
export const config = {
  matcher: [],
};
