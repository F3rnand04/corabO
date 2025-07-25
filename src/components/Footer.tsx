
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Upload, MessageSquare, CircleUser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorabo } from '@/contexts/CoraboContext';
import { useState } from 'react';
import { UploadDialog } from './UploadDialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function Footer() {
  const pathname = usePathname();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { currentUser } = useCorabo();

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/videos', icon: PlaySquare, label: 'Videos' },
    { href: '#upload', icon: Upload, label: 'Añadir', isCentral: true },
    { href: '/messages', icon: MessageSquare, label: 'Mensajes' },
    { href: '/profile', icon: CircleUser, label: 'Perfil' },
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
                  onClick={() => setIsUploadOpen(true)}
                  size="icon"
                  className={cn(
                    "relative -top-4 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                    <item.icon className="w-8 h-8" />
                </Button>
              );
            }

            if (item.href === '/profile') {
              return (
                 <Link key={item.href} href={item.href} passHref>
                    <Button
                    variant="ghost"
                    className={cn(
                        "flex-col h-auto p-0 rounded-full text-muted-foreground hover:text-primary w-8 h-8",
                        isActive && "ring-2 ring-primary"
                    )}
                    >
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </Link>
              )
            }
            
            return (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant="ghost"
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
