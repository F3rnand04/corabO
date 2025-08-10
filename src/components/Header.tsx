
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Menu, Search, LogOut, User, Wallet, History as HistoryIcon, Shield, HelpCircle, Contact } from "lucide-react";
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
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
  const { searchQuery, setSearchQuery, feedView, setFeedView, currentUser, toggleGps, logout, searchHistory } = useCorabo();
  const router = useRouter();

  if (!currentUser) {
    return null;
  }
  
  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Logic to perform search can be triggered here if needed,
      // but it's already happening live in the context.
      console.log("Searching for:", searchQuery);
  }

  const handleSearchHistoryClick = (query: string) => {
    setSearchQuery(query);
  }

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/contacts" passHref>
             <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" width={40} height={40} className="h-10 w-auto cursor-pointer" />
          </Link>

          <div className="flex-1 flex items-center justify-center gap-2">
            <Button 
                variant={feedView === 'servicios' ? 'default' : 'ghost'} 
                className="rounded-full text-sm h-8"
                onClick={() => setFeedView('servicios')}
            >
                Servicios
            </Button>
            <Button 
                variant={feedView === 'empresas' ? 'default' : 'ghost'} 
                className="rounded-full text-sm h-8"
                onClick={() => setFeedView('empresas')}
            >
                Empresas
            </Button>
          </div>

          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" onClick={() => toggleGps(currentUser.id)} onDoubleClick={() => router.push('/map')}>
                <MapPin className={cn("h-5 w-5", currentUser.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/transactions')}>
                <Wallet className="h-5 w-5 text-muted-foreground"/>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
                <FileText className="h-5 w-5 text-muted-foreground"/>
            </Button>
            
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6 text-muted-foreground"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => router.push('/transactions')}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Mi Billetera</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/search-history')}>
                    <HistoryIcon className="mr-2 h-4 w-4" />
                    <span>Historial de Búsqueda</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ThemeSwitcher />
                   <DropdownMenuItem onClick={() => router.push('/policies')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Políticas y Legal</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/contacts')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Ayuda y Soporte</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="pb-2">
           <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Busca un servicio o producto..."
                        className="pl-10 rounded-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
           </form>
           {searchHistory.length > 0 && searchQuery === '' && (
            <div className="py-2 text-xs flex items-center gap-2 overflow-x-auto">
                <span className="text-muted-foreground font-semibold">Recientes:</span>
                {searchHistory.map(query => (
                    <Button key={query} size="sm" variant="outline" className="h-6 rounded-full px-2" onClick={() => handleSearchHistoryClick(query)}>
                        {query}
                    </Button>
                ))}
            </div>
           )}
        </div>
      </div>
    </header>
  );
}
