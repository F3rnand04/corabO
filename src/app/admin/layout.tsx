
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Administración - Corabo',
  description: 'Gestión interna de la plataforma Corabo.',
};

export default function AdminLayout({
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
