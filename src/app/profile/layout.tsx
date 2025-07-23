export default function ProviderProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is specific to the provider's profile management screen
  // and does not render the default Header. The adapted Footer is handled in the page itself.
  return <div className="bg-background">{children}</div>;
}
