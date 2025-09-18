import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notificaciones - Corabo',
  description: 'Revisa tus últimas notificaciones.',
};

export default function NotificationsLayout({
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
