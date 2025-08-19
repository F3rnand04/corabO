
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Search, MessageSquare, Upload, Settings, QrCode, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState } from 'react';
import { UploadDialog } from './UploadDialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
 
export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useCorabo();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const isProvider = currentUser.type === 'provider';
  const isCompany = isProvider && currentUser.profileSetupData?.providerType === 'company';
  const isProfilePage = pathname.startsWith('/profile');

  const handleCentralButtonClick = () => {
    if (isProvider && isProfilePage) {
       setIsUploadOpen(true);
    } else {
       // For companies, this button should scan, not show QR.
       // For clients/professionals, this is handled by the popover.
       router.push('/scan-qr');
    }
  };
  
  const CentralButtonIcon = isProvider && isProfilePage ? Upload : ScanLine;

  const renderCentralButton = () => {
    if (isCompany) {
      // Companies only have a button to scan, not to show their own QR.
      return (
         <Button
            key="scan-action"
            onClick={() => router.push('/scan-qr')}
            size="icon"
            className="relative -top-4 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
            <ScanLine className="w-8 h-8" />
        </Button>
      );
    }

    // Professionals and Clients get a Popover with two options.
    return (
       <Popover>
            <PopoverTrigger asChild>
                <Button
                    key="central-popover"
                    size="icon"
                    className="relative -top-4 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <CentralButtonIcon className="w-8 h-8" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-auto p-2 mb-2 space-y-1">
                 <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/scan-qr')}>
                    <ScanLine className="mr-2 h-5 w-5"/>
                    Escanear para Pagar
                </Button>
                 <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/show-qr')}>
                    <QrCode className="mr-2 h-5 w-5"/>
                    Mostrar mi QR para Cobrar
                </Button>
            </PopoverContent>
        </Popover>
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

            {isProvider && isProfilePage ? (
               <Button
                    key="central-action"
                    onClick={handleCentralButtonClick}
                    size="icon"
                    className="relative -top-4 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <Upload className="w-8 h-8" />
                </Button>
            ) : (
                renderCentralButton()
            )}
            
            <Link href="/messages" passHref>
                <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary", pathname.startsWith('/messages') && "text-primary")}>
                    <MessageSquare className="w-6 h-6" />
                </Button>
            </Link>

            <Link href="/profile" passHref>
                <Button variant="ghost" className={cn("flex-col h-auto p-1 text-muted-foreground hover:text-primary", pathname.startsWith('/profile') && "text-primary")}>
                    <Avatar className={cn("w-7 h-7", pathname.startsWith('/profile') && "border-2 border-primary")}>
                        <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                        <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Button>
            </Link>

        </div>
      </footer>
      <UploadDialog isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </>
  );
}
