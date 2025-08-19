import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuración de Proveedor - Corabo',
  description: 'Completa los detalles de tu perfil de proveedor para empezar.',
};

export default function ProfileSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/30 min-h-screen p-4">
      {children}
    </div>
  );
}
