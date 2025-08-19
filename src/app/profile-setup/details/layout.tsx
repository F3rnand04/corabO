// This layout file ensures that the /profile/details route
// does not inherit the main application header or footer,
// creating a focused editing experience.
export default function DetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
