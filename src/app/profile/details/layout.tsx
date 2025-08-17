'use client';

// Este layout asegura que la página de detalles no herede la cabecera/pie de página principal.
export default function DetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
