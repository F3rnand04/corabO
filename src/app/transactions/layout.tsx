import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

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
    <div className="bg-slate-50 min-h-screen font-sans">
      {children}
    </div>
  );
}
