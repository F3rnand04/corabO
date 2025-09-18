
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Repartidor - Corabo',
  description: 'Gestiona tus entregas y ganancias.',
};

export default function DeliveryDashboardLayout({
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
