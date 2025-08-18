
'use client';

import { useCorabo } from "@/contexts/CoraboContext";
import { Loader2 } from "lucide-react";
import { ProfileHeader } from "@/components/ProfileHeader";
import { usePathname } from "next/navigation";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { currentUser } = useCorabo();
    const pathname = usePathname();

    if (!currentUser) {
        return (
          <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }
    
    // Do not show the profile header on the dedicated details edit page
    const showHeader = pathname !== '/profile/details';

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <div className="container mx-auto px-0 md:px-2 max-w-2xl pb-24">
          {showHeader && <ProfileHeader />}
          <main className="flex-grow py-4 px-2">
            {children}
          </main>
        </div>
      {/* Footer is now handled by the root AppLayout, this keeps it consistent */}
    </div>
  );
}
