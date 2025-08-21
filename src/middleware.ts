// El middleware se ha desactivado.
// La lógica de protección de rutas y redirección ahora es manejada exclusivamente
// por el componente /src/app/AppLayout.tsx, que tiene acceso al estado de
// autenticación del cliente y es más fiable para este caso de uso.

import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Al no especificar un 'matcher', el middleware no se ejecutará en ninguna ruta.
export const config = {
  matcher: [],
};
