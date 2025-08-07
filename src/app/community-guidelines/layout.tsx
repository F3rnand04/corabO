
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Normas de la Comunidad - Corabo',
  description: 'Nuestras directrices para un entorno seguro y respetuoso.',
};

export default function CommunityGuidelinesLayout({
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
