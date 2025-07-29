
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ajustes de Transacciones - Corabo',
  description: 'Configura tu módulo de transacciones.',
};

export default function TransactionsSettingsLayout({
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
