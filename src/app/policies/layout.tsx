
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Políticas de la Empresa - Corabo',
  description: 'Conoce nuestras políticas y términos de servicio.',
};

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 dark:bg-black">
      {children}
    </div>
  );
}
