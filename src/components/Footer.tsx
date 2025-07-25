
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Plus, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorabo } from '@/contexts/CoraboContext';
import { UploadDialog } from './UploadDialog';
import { useState } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/videos', icon: PlaySquare, label: 'Videos' },
    { href: '#', icon: Plus, label: 'Añadir', isCentral: true },
    { href: '/messages', icon: MessageSquare, label: 'Mensajes' },
    { href: '/settings', icon: Settings, label: 'Ajustes' },
  ];

  const handleCentralButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsUploadDialogOpen(true);
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="container h-16 flex justify-around items-center px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            if (item.isCentral) {
              return (
                <div key={item.href} className="relative">
                  <Button
                    size="icon"
                    onClick={handleCentralButtonClick}
                    className={cn(
                      "relative -top-6 w-16 h-16 rounded-full shadow-lg bg-gradient-to-tr from-primary to-accent text-primary-foreground hover:scale-110 transition-transform",
                    )}
                  >
                      <item.icon className="w-8 h-8" />
                  </Button>
                </div>
              );
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
      <UploadDialog isOpen={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
    </>
  );
}

    