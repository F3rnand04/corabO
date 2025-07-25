
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, PlaySquare, MessageSquare, UserCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsFooter() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/videos', icon: PlaySquare, label: 'Videos' },
    { href: '/messages', icon: MessageSquare, label: 'Mensajes' },
    { href: '#', icon: UserCircle, label: 'Perfil' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="container h-16 flex justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant="ghost"
                className={cn(
                  "flex-col h-auto p-1 text-muted-foreground hover:text-primary",
                   // The settings icon itself should be active on the settings page
                  (isActive || (item.label === 'Perfil' && pathname.startsWith('/settings'))) && "text-primary"
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
