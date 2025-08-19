
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalles de Caja - Corabo',
  description: 'Revisa el historial y rendimiento de tu punto de venta.',
};

export default function CashierDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/30 min-h-screen">
      {children}
    </div>
  );
}
