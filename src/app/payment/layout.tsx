
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrar Pago - Corabo',
  description: 'Confirma el pago de tu suscripción o servicio.',
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 min-h-screen">
        {children}
    </div>
  );
}
