
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-4xl font-bold mb-2">Error 404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
            Página No Encontrada
        </h2>
        <p className="text-muted-foreground max-w-md mb-8">
            Lo sentimos, la página que buscas no existe o ha sido movida. Por favor, verifica la URL o vuelve al inicio.
        </p>
        <Button asChild>
            <Link href="/">Volver al Inicio</Link>
        </Button>
    </div>
  );
}
