export default function CompanyProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este layout específico para el perfil de la empresa no renderiza el Header ni el Footer.
  return <div className="bg-background">{children}</div>;
}
