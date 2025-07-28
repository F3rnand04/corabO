export default function ProfileSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/30 min-h-screen">
        {children}
    </div>
  );
}
