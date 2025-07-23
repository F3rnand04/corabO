"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Bot, Home, Wrench, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCorabo } from "@/contexts/CoraboContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserSwitcher } from "./UserSwitcher";

export function Header() {
  const { cart, currentUser } = useCorabo();
  const pathname = usePathname();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Productos', icon: Bot },
    { href: '/services', label: 'Servicios', icon: Wrench },
    { href: '/transactions', label: 'Transacciones', icon: Wrench },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold">Corabo</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === href ? "text-foreground" : "text-foreground/60"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserSwitcher />
          {currentUser.type === 'client' && (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center" variant="destructive">
                    {cartItemCount}
                  </Badge>
                )}
                <span className="sr-only">Carrito de compras</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
