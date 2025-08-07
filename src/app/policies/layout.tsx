
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Políticas y Documentos Legales - Corabo',
  description: 'Conoce nuestras políticas, términos de servicio y normas de la comunidad.',
};

export default function PoliciesLayout({
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
