// This component is now a simple structural layout without client-side logic.
// The client-side logic has been moved to ClientLayout.tsx.
export function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col min-h-screen">{children}</div>;
}
