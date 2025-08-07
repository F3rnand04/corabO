
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Historial de Búsquedas - Corabo',
  description: 'Revisa tus búsquedas recientes.',
};

export default function SearchHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 dark:bg-black min-h-screen">
      {children}
    </div>
  );
}
