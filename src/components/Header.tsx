
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Menu, Search, LogOut, User, ShoppingCart, Plus, Minus, X, Wallet } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

export function Header() {
  const { searchQuery, setSearchQuery, feedView, setFeedView, currentUser, toggleGps, cart, updateCartQuantity, getCartTotal } = useCorabo();
  const router = useRouter();
  
  const hasCompletedProfileSetup = !!currentUser?.profileSetupData;
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm sticky top-0 z-40">
      <div className="container px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          
          <Link href="/contacts" passHref>
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary">C</span>
              </div>
              <span className="font-bold text-xl">corabO</span>
            </div>
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-2">
            
            <Button variant="ghost" size="icon" onClick={() => toggleGps(currentUser.id)} onDoubleClick={() => router.push('/map')}>
              <MapPin className={cn("h-5 w-5", currentUser.isGpsActive && "text-green-500")} />
            </Button>
            <Link href="/quotes" passHref>
              <Button variant="ghost" size="icon">
                <FileText className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/transactions" passHref>
              <Button variant="ghost" size="icon">
                <Wallet className="h-5 w-5" />
              </Button>
            </Link>
             <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                  {totalCartItems > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">{totalCartItems}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Carrito de Compras</h4>
                    <p className="text-sm text-muted-foreground">
                      Resumen de tu pedido global.
                    </p>
                  </div>
                    {cart.length > 0 ? (
                      <>
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {cart.map(item => (
                          <div key={item.product.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                            <div>
                              <p className="font-medium text-sm truncate">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-1 border rounded-md">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => updateCartQuantity(item.product.id, 0)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                      ))}
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-sm">
                          <span>Total:</span>
                          <span>${getCartTotal().toFixed(2)}</span>
                      </div>
                      <Button className="w-full">Ver Pre-factura</Button>
                      </>
                    ) : (
                      <p className="text-sm text-center text-muted-foreground py-4">Tu carrito está vacío.</p>
                    )}
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasCompletedProfileSetup && (
                    <Link href="/profile-setup" passHref>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Revisión de Perfil</span>
                      </DropdownMenuItem>
                    </Link>
                )}
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
