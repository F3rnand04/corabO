import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuración Inicial - Corabo',
  description: 'Completa tu registro en Corabo.',
};

export default function InitialSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/30 min-h-screen flex items-center justify-center p-4">
      {children}
    </div>
  );
}
