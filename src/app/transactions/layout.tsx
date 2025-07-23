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
    <div className="bg-background min-h-screen">
      <div className="container py-4">
        <div className="flex items-center mb-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Volver al Inicio</span>
            </Link>
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
