
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones - Corabo',
  description: 'Lee nuestros términos y condiciones de uso.',
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background dark:bg-black">
      {children}
    </div>
  );
}
