
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, Search, MessageSquare, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CompanyProfileFooter() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/videos', icon: PlaySquare, label: 'Videos' },
    { href: '#', icon: Search, label: 'Buscar', isCentral: true },
    { href: '/messages', icon: MessageSquare, label: 'Mensajes' },
    { href: '/profile', icon: UserCircle, label: 'Perfil' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="container h-16 flex justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isCentral) {
            return (
              <div key={item.href} className="relative">
                <Link href={item.href} passHref>
                  <Button
                    size="icon"
                    className={cn(
                      "relative -top-6 w-16 h-16 rounded-full shadow-lg",
                      isActive 
                        ? "bg-primary/10 text-primary border-4 border-background"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <item.icon className="w-8 h-8" />
                  </Button>
                </Link>
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
  );
}
