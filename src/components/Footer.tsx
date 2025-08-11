

"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Search, MessageSquare, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState } from 'react';
import { UploadDialog } from './UploadDialog';
 
export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useCorabo();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const isProvider = currentUser.type === 'provider';
  const isProfilePage = pathname === '/profile';

  const handleCentralButtonClick = () => {
    if (isProfilePage) {
        if (isProvider) {
          setIsUploadOpen(true);
        } else {
          router.push('/emprende');
        }
    } else {
      router.push('/search');
    }
  };

  const CentralButtonIcon = isProfilePage ? Upload : Search;
  const RightButtonIcon = isProfilePage ? Settings : Avatar;

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

            <Link href={isProfilePage ? "/profile-setup" : "/profile"} passHref>
                <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary")}>
                    {isProfilePage ? (
                        <Settings className="w-6 h-6" />
                    ) : (
                        <Avatar className={cn("w-7 h-7")}>
                            <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                </Button>
            </Link>

        </div>
      </footer>
      <UploadDialog isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </>
  );
}
