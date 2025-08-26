
// This layout file is no longer needed as the profile pages are being unified.
// It will be deleted in a future step if confirmed.
// For now, it will just pass children through.
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
