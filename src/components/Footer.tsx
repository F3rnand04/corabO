
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Search, MessageSquare, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState } from 'react';
import { UploadDialog } from './UploadDialog';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useCorabo();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const isProvider = currentUser.type === 'provider';

  const handleCentralButtonClick = () => {
    if (pathname === '/profile' && isProvider) {
      setIsUploadOpen(true);
    } else if (pathname === '/profile' && !isProvider) {
       router.push('/emprende');
    }
     else {
      router.push('/search');
    }
  };

  const getCentralButton = () => {
      let Icon = Search;
      if (pathname === '/profile') {
          Icon = Upload;
      }
      return (
        <Button
            key="central-action"
            onClick={handleCentralButtonClick}
            size="icon"
            className="relative -top-4 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
            <Icon className="w-8 h-8" />
        </Button>
      )
  }

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

            {getCentralButton()}
            
            <Link href="/messages" passHref>
                <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary", pathname.startsWith('/messages') && "text-primary")}>
                    <MessageSquare className="w-6 h-6" />
                </Button>
            </Link>

            <Link href="/profile-setup" passHref>
                <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary", pathname === '/profile-setup' && "text-primary")}>
                    <Settings className="w-6 h-6" />
                </Button>
            </Link>
        </div>
      </footer>
      <UploadDialog isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </>
  );
}
