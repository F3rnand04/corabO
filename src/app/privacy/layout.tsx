
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Corabo',
  description: 'Conoce cómo manejamos y protegemos tus datos.',
};

export default function PrivacyLayout({
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
