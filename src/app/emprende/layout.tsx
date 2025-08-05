
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emprende por Hoy - Corabo',
  description: 'Lanza tu idea de negocio por 24 horas.',
};

export default function EmprendeLayout({
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
