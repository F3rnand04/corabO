
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '¿Qué es Credicora? - Corabo',
  description: 'Descubre cómo Credicora potencia tus compras y ventas de forma segura y flexible.',
};

export default function CredicoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40">
      {children}
    </div>
  );
}
