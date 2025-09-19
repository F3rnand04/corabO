
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Search, MessageSquare, Upload, Settings, QrCode, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState } from 'react';
import { UploadDialog } from './UploadDialog';
 
export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const isProvider = currentUser.type === 'provider';
  // Check if the current path is the user's own profile page
  const isSelfProfilePage = pathname === `/profile` || pathname === `/companies/${currentUser.id}`;

  const CentralButtonIcon = isProvider && isSelfProfilePage ? Upload : ScanLine;

  const handleCentralButtonClick = () => {
    if (isProvider && isSelfProfilePage) {
      setIsUploadOpen(true);
    } else {
      router.push(isProvider ? '/show-qr' : '/scan-qr');
    }
  };
  
  const renderRightmostButton = () => {
    // If it's the user's own profile page, show the settings gear
    if (isSelfProfilePage) {
        const setupPath = currentUser.profileSetupData?.providerType === 'company' 
            ? '/profile-setup/company' 
            : '/profile-setup/personal';
      return (
        <Link href={setupPath} passHref>
          <Button variant="ghost" className="flex-col h-auto p-1 text-primary">
            <Settings className="w-6 h-6" />
          </Button>
        </Link>
      );
    }
    
    // Otherwise, show the avatar linking to their profile
    return (
      <Link href="/profile" passHref>
        <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary")}>
          <Avatar className={cn("w-7 h-7")}>
            <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </Link>
    );
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="container h-16 flex justify-around items-center px-2">
            <Link href="/" passHref>
                <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary", pathname === '/' && "text-primary")}>
                    <Home className="w-6 h-6" />
                </Button>
            </Link>
             <Link href="/videos" passHref>
                <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary", pathname === '/videos' && "text-primary")}>
                    <PlaySquare className="w-6 h-6" />
                </Button>
            </Link>

            <Button
                key="central-action"
                onClick={handleCentralButtonClick}
                size="icon"
                className="relative -top-4 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
                <CentralButtonIcon className="w-8 h-8" />
            </Button>
            
            <Link href="/messages" passHref>
                <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary", pathname.startsWith('/messages') && "text-primary")}>
                    <MessageSquare className="w-6 h-6" />
                </Button>
            </Link>

            {renderRightmostButton()}
            
        </div>
      </footer>
      <UploadDialog isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </>
  );
}
