"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Wallet, Menu, Search, ChevronDown, User, FileHeart, X } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import { useRouter } from "next/navigation";
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
import { UserSwitcher } from "./UserSwitcher";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function Header() {
  const { currentUser, cart, searchQuery, setSearchQuery, contacts, removeContact } = useCorabo();
  const router = useRouter();

  return (
    <header className="fixed top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          
          <Sheet>
            <SheetTrigger asChild>
               <div className="flex items-center space-x-2 cursor-pointer">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">C</span>
                </div>
                <span className="font-bold text-xl">corabO</span>
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle>Información de Usuario</SheetTitle>
              </SheetHeader>
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium text-muted-foreground">ID de Usuario</p>
                    <p className="text-lg font-mono font-semibold">{currentUser.id}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileHeart className="h-5 w-5" />
                    Contactos Guardados
                  </h3>
                  <div className="space-y-3">
                    {contacts.length > 0 ? (
                      contacts.map(contact => (
                         <div key={contact.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                           <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={`https://i.pravatar.cc/150?u=${contact.id}`} alt={contact.name} />
                              <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                               <p className="font-semibold">{contact.name}</p>
                               <p className="text-sm text-muted-foreground capitalize">{contact.type}</p>
                            </div>
                           </div>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeContact(contact.id)}>
                              <X className="h-4 w-4" />
                           </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No tienes contactos guardados.</p>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

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
                <div className="p-2">
                  <UserSwitcher />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="py-2 flex flex-col gap-2">
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
          <div className="flex items-center gap-2">
            <Button className="rounded-full flex-1" variant="secondary" onClick={() => router.push('/services')}>Servicios</Button>
            <Button className="rounded-full flex-1" variant="ghost" onClick={() => router.push('/companies')}>Empresas</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
