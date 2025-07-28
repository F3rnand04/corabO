
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Wallet, Menu, Search, FileHeart, X, LogOut } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

export function Header() {
  const { currentUser, searchQuery, setSearchQuery, contacts, removeContact, feedView, setFeedView } = useCorabo();
  const router = useRouter();

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm sticky top-0 z-40">
      <div className="container px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          
          <Link href="/settings" passHref>
             <div className="flex items-center space-x-2 cursor-pointer">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary">C</span>
              </div>
              <span className="font-bold text-xl">corabO</span>
            </div>
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-2">
            
            <Button variant="ghost" size="icon" onClick={() => router.push('/map')}>
              <MapPin className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <FileText className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/transactions')}>
              <Wallet className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Historial de Búsquedas</DropdownMenuItem>
                <DropdownMenuItem>Modo Oscuro</DropdownMenuItem>
                <DropdownMenuItem>Políticas de la Empresa</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="py-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <Button 
                    className={cn(
                        "rounded-full flex-1",
                        feedView === 'servicios' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    )}
                    variant={feedView === 'servicios' ? 'default' : 'secondary'}
                    onClick={() => setFeedView('servicios')}
                >
                    Servicios
                </Button>
                <Button 
                    className={cn(
                        "rounded-full flex-1",
                        feedView === 'empresas' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    )}
                    variant={feedView === 'empresas' ? 'default' : 'secondary'}
                    onClick={() => setFeedView('empresas')}
                >
                    Empresas
                </Button>
            </div>
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Busca un servicio o producto..."
                className="w-full rounded-full pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
        </div>
      </div>
    </header>
  );
}
