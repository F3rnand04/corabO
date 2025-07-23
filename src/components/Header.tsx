"use client";

import Link from "next/link";
import { UserSwitcher } from "./UserSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Wallet, Menu, Search, MessageSquare } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import { useRouter } from "next/navigation";

export function Header() {
  const { currentUser } = useCorabo();
  const router = useRouter();

  return (
    <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-primary">C</span>
            </div>
            <span className="font-bold text-lg">corabO</span>
          </Link>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="ghost" size="icon" className="flex-col h-auto p-1 text-xs">
              <MapPin className="h-5 w-5" />
              <span className="text-muted-foreground">Ubicación</span>
            </Button>
            <Button variant="ghost" size="icon" className="flex-col h-auto p-1 text-xs">
              <FileText className="h-5 w-5" />
              <span className="text-muted-foreground">Cotizar</span>
            </Button>
            <Button variant="ghost" size="icon" className="flex-col h-auto p-1 text-xs" onClick={() => router.push('/transactions')}>
              <Wallet className="h-5 w-5" />
              <span className="text-muted-foreground">Registros</span>
            </Button>
            <UserSwitcher />
          </div>
        </div>

        <div className="py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Button className="rounded-full flex-1" variant="secondary">Servicios</Button>
              <Button className="rounded-full flex-1" variant="ghost">Empresas</Button>
            </div>
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Busca un servicio o producto..."
                className="w-full rounded-full pl-4 pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}