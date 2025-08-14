
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verificar Identidad - Corabo',
  description: 'Verifica tu documento de identidad para activar todas las funciones.',
};

export default function VerifyIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
