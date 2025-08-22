
'use client';

import { FeedClientComponent } from "@/components/FeedClientComponent";
import { useCorabo } from "@/contexts/CoraboContext";
import { Loader2 } from "lucide-react";

// Este componente ahora actúa como el punto de entrada principal de la aplicación.
// Renderiza un loader mientras el estado del usuario se resuelve, y luego
// delega el renderizado del feed al FeedClientComponent.
export default function HomePage() {
  const { isLoadingUser, currentUser } = useCorabo();

  // Muestra un loader mientras se carga la información del usuario en el contexto.
  // Esto es crucial para evitar mostrar contenido incorrecto brevemente.
  // También se asegura de que no se intente renderizar el feed si el usuario es nulo.
  if (isLoadingUser || !currentUser) {
      return (
           <div className="flex items-center justify-center pt-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <main className="flex-1">
      <FeedClientComponent />
    </main>
  );
}
