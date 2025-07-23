import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro de Transacciones - Corabo',
  description: 'Tu centro de control financiero.',
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 text-white min-h-screen">
      {children}
    </div>
  );
}
