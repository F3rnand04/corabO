
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Cajas - Corabo',
  description: 'Crea y administra tus puntos de venta.',
};

export default function CashierSettingsLayout({
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
