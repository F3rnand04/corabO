
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Corabo',
  description: 'Inicia sesión para acceder a tu cuenta de Corabo.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
