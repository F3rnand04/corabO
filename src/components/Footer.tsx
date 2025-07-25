
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const { currentUser } = useCorabo();

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/videos', icon: PlaySquare, label: 'Videos' },
    { href: '/profile', icon: Plus, label: 'Añadir', isCentral: true },
    { href: '/messages', icon: MessageSquare, label: 'Mensajes' },
    { href: '/profile', icon: 'User', label: 'Perfil' },
  ];

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="container h-16 flex justify-around items-center px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            if (item.isCentral) {
              return (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    size="icon"
                    className={cn(
                      "relative -top-4 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                      <item.icon className="w-8 h-8" />
                  </Button>
                </Link>
              );
            }

            if (item.icon === 'User') {
                 return (
                    <Link key={item.href} href={item.href} passHref>
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex-col h-auto p-0 rounded-full",
                                isActive && "ring-2 ring-primary"
                            )}
                        >
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                                <AvatarFallback>
                                    <User className="w-5 h-5" />
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </Link>
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
    </>
  );
}
