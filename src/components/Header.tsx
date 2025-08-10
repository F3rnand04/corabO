
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Menu, Search, LogOut, User, Wallet, History as HistoryIcon, Shield, HelpCircle, Contact, ShoppingCart, Plus, Minus, X, Truck, Star } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { credicoraLevels } from "@/lib/types";

export function Header() {
  const { searchQuery, setSearchQuery, feedView, setFeedView, currentUser, toggleGps, logout, searchHistory, cart, updateCartQuantity, getCartTotal, getDeliveryCost, checkout, users } = useCorabo();
  const router = useRouter();

  const [isCheckoutAlertOpen, setIsCheckoutAlertOpen] = useState(false);
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [useCredicora, setUseCredicora] = useState(false);


  if (!currentUser) {
    return null;
  }
  
  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Searching for:", searchQuery);
  }

  const handleSearchHistoryClick = (query: string) => {
    setSearchQuery(query);
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTransaction = cart.length > 0 ? currentUser.transactions?.find(tx => tx.status === 'Carrito Activo' && tx.clientId === currentUser.id) : undefined;

  const handleCheckout = () => {
    if (cartTransaction) {
        checkout(cartTransaction.id, includeDelivery, useCredicora);
        setIsCheckoutAlertOpen(false);
        setUseCredicora(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        {/* Top Row */}
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/contacts" passHref>
             <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" width={40} height={40} className="h-10 w-auto cursor-pointer" />
          </Link>

          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" onClick={() => toggleGps(currentUser.id)} onDoubleClick={() => router.push('/map')}>
                <MapPin className={cn("h-5 w-5", currentUser.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
                <FileText className="h-5 w-5 text-muted-foreground"/>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/transactions')}>
                <Wallet className="h-5 w-5 text-muted-foreground"/>
            </Button>
            
            <AlertDialog open={isCheckoutAlertOpen} onOpenChange={setIsCheckoutAlertOpen}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                        <ShoppingCart className="w-5 w-5 text-muted-foreground" />
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
                                    <Link href={`/companies/${item.product.providerId}`} className="cursor-pointer hover:underline">
                                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                                        <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)}</p>
                                    </Link>
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
                            <AlertDialogTrigger asChild>
                              <Button className="w-full">Ver Pre-factura</Button>
                            </AlertDialogTrigger>
                            </>
                            ) : (
                            <p className="text-sm text-center text-muted-foreground py-4">Tu carrito está vacío.</p>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Compra</AlertDialogTitle>
                        <AlertDialogDescription>
                            Revisa tu pedido. Puedes incluir el costo de envío y pagar con Credicora si está disponible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-4">
                        {(() => {
                            const provider = users.find(u => u.id === cartTransaction?.providerId);
                            const isOnlyDelivery = provider?.profileSetupData?.isOnlyDelivery || false;
                            const providerAcceptsCredicora = provider?.profileSetupData?.acceptsCredicora || false;

                            const subtotal = getCartTotal();
                            const deliveryCost = getDeliveryCost();
                            const totalWithDelivery = subtotal + ((includeDelivery || isOnlyDelivery) ? deliveryCost : 0);
                            
                            const userCredicoraLevel = currentUser.credicoraLevel || 1;
                            const credicoraDetails = credicoraLevels[userCredicoraLevel.toString()];
                            const creditLimit = currentUser.credicoraLimit || 0;
                            
                            const financingPercentage = 1 - credicoraDetails.initialPaymentPercentage;
                            const potentialFinancing = subtotal * financingPercentage;
                            const financedAmount = useCredicora ? Math.min(potentialFinancing, creditLimit) : 0;
                            const productInitialPayment = subtotal - financedAmount;
                            const totalToPayToday = productInitialPayment + ((includeDelivery || isOnlyDelivery) ? deliveryCost : 0);
                            const installmentAmount = financedAmount > 0 ? financedAmount / credicoraDetails.installments : 0;

                            return (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal:</span>
                                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="delivery-switch" className="flex items-center gap-2">
                                            <Truck className="h-4 w-4" />
                                            Incluir Delivery
                                        </Label>
                                        <Switch
                                            id="delivery-switch"
                                            checked={includeDelivery || isOnlyDelivery}
                                            onCheckedChange={setIncludeDelivery}
                                            disabled={isOnlyDelivery}
                                        />
                                    </div>
                                    {isOnlyDelivery && <p className="text-xs text-muted-foreground -mt-2">Este proveedor solo trabaja con delivery.</p>}
                                    <div className="flex justify-between text-sm">
                                        <span>Costo de envío (aprox):</span>
                                        <span className="font-semibold">${(includeDelivery || isOnlyDelivery) ? deliveryCost.toFixed(2) : '0.00'}</span>
                                    </div>

                                    {providerAcceptsCredicora && (
                                        <div className="flex items-center justify-between pt-2 border-t mt-2">
                                            <Label htmlFor="credicora-switch" className="flex items-center gap-2 text-blue-600 font-semibold">
                                                <Star className="w-4 h-4 fill-current"/>
                                                Pagar con Credicora
                                            </Label>
                                            <Switch
                                                id="credicora-switch"
                                                checked={useCredicora}
                                                onCheckedChange={setUseCredicora}
                                            />
                                        </div>
                                    )}
                                    
                                    <Separator />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total a Pagar Hoy:</span>
                                        <span>${useCredicora ? totalToPayToday.toFixed(2) : totalWithDelivery.toFixed(2)}</span>
                                    </div>
                                    {useCredicora && financedAmount > 0 && (
                                        <p className="text-xs text-muted-foreground -mt-2 text-right">
                                            y {credicoraDetails.installments} cuotas de ${installmentAmount.toFixed(2)}
                                        </p>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCheckout}>Pagar Ahora</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
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

        {/* Middle Row */}
        <div className="flex-1 flex items-center justify-center gap-2 py-2">
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

        {/* Bottom Row */}
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

    