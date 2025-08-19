
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceso de Caja - Corabo',
  description: 'Inicia tu turno en una caja de Corabo.',
};

export default function CashierLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
