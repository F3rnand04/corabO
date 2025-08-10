
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Upload, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { UploadDialog } from './UploadDialog';
import { useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';

export default function ProfileFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useCorabo();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const isProvider = currentUser.type === 'provider';

  const handleCentralButtonClick = () => {
    if (isProvider) {
      setIsUploadOpen(true);
    } else {
      router.push('/emprende');
    }
  };

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/videos', icon: PlaySquare, label: 'Videos' },
    { href: '#upload', icon: Upload, label: 'Añadir', isCentral: true, action: handleCentralButtonClick },
    { href: '/messages', icon: MessageSquare, label: 'Mensajes' },
    { href: '/profile-setup', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="container h-16 flex justify-around items-center px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            if (item.isCentral) {
              return (
                <Button
                  key={item.href}
                  onClick={item.action}
                  size="icon"
                  className={cn(
                    "relative -top-4 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                    <item.icon className="w-8 h-8" />
                </Button>
              );
            }

            return (
              <Link key={item.href} href={item.href !== '#upload' ? item.href : '#'} passHref>
                <Button
                  variant="ghost"
                  onClick={item.action}
                  className={cn(
                    "flex-col h-auto p-1 text-muted-foreground hover:text-primary",
                    isActive && "text-primary"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                </Button>
              </Link>
            );
          })}
        </div>
      </footer>
       <UploadDialog isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </>
  );
}
