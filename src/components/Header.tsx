

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Menu, Search, LogOut, User, Wallet, History as HistoryIcon, Shield, HelpCircle, Contact, ShoppingCart, Plus, Minus, X, Truck, Star, ChevronDown } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel
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
import { getFirestoreDb } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Transaction, User as UserType } from '@/lib/types';
import { haversineDistance } from "@/lib/utils";

// Punto de referencia fijo en Caracas
const FIXED_REFERENCE_POINT = { lat: 10.4806, lon: -66.9036 };

const serviceGroups = [
    { name: 'Todos los Grupos', id: 'all' },
    { name: 'Hogar y Reparaciones', id: 'Hogar y Reparaciones' },
    { name: 'Tecnología y Soporte', id: 'Tecnología y Soporte' },
    { name: 'Automotriz y Repuestos', id: 'Automotriz y Repuestos' },
    { name: 'Alimentos y Restaurantes', id: 'Alimentos y Restaurantes' },
    { name: 'Salud y Bienestar', id: 'Salud y Bienestar' },
    { name: 'Educación', id: 'Educación' },
    { name: 'Eventos', id: 'Eventos' },
    { name: 'Belleza', id: 'Belleza' },
    { name: 'Fletes y Delivery', id: 'Fletes y Delivery' },
];


export function Header() {
  const { currentUser, toggleGps, logout, cart, updateCartQuantity, getCartTotal, getDeliveryCost, checkout, users, transactions, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter } = useCorabo();
  const router = useRouter();

  const [isCheckoutAlertOpen, setIsCheckoutAlertOpen] = useState(false);
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [useCredicora, setUseCredicora] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser?.isGpsActive && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const dist = haversineDistance(
                    latitude,
                    longitude,
                    FIXED_REFERENCE_POINT.lat,
                    FIXED_REFERENCE_POINT.lon
                );
                setDistance(dist);
            },
            (error) => {
                console.error("Error getting location: ", error);
                setDistance(null);
            }
        );
    } else {
        setDistance(null);
    }
  }, [currentUser?.isGpsActive]);


  if (!currentUser) {
    return null;
  }
  
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTransaction = cart.length > 0 ? transactions.find(tx => tx.status === 'Carrito Activo') : undefined;

  const handleCheckout = () => {
    if (cartTransaction) {
        checkout(cartTransaction.id, includeDelivery, useCredicora);
        setIsCheckoutAlertOpen(false);
        setUseCredicora(false);
    }
  };

  const selectedCategoryName = serviceGroups.find(g => g.id === categoryFilter)?.name || "Todos";

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        {/* Top Row: Logo, Actions, Menu */}
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" passHref>
             <Image src="https://i.postimg.cc/8zWvkhxS/Sin-t-tulo-3.png" alt="Corabo Logo" width={120} height={40} className="h-10 w-auto cursor-pointer" />
          </Link>

          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" onClick={() => toggleGps(currentUser.id)} onDoubleClick={() => router.push('/map')}>
                <div className="flex items-center">
                   <MapPin className={cn("h-5 w-5", currentUser.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
                   {distance !== null && (
                     <span className="text-xs text-green-600 font-semibold ml-1">({distance.toFixed(1)}km)</span>
                   )}
                </div>
            </Button>

            <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => router.push('/transactions')}>
              <Wallet className="h-5 w-5 text-muted-foreground" />
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
                    <span>Registro de Transacciones</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/search-history')}>
                    <HistoryIcon className="mr-2 h-4 w-4" />
                    <span>Historial de Búsqueda</span>
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => router.push('/quotes')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Cotizar</span>
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
        
        {/* Bottom Row: Search Bar */}
        <div className="flex items-center gap-2 pb-3">
             <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por servicio, producto..." 
                    className="pl-10 pr-28 rounded-full bg-muted border-none focus-visible:ring-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 rounded-full text-xs px-2">
                          {selectedCategoryName.split(' ')[0]}
                          <ChevronDown className="h-4 w-4 ml-1"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filtrar por Grupo</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}>
                          {serviceGroups.map(group => (
                               <DropdownMenuRadioItem key={group.id} value={group.id}>{group.name}</DropdownMenuRadioItem>
                          ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
            </div>
            {/* Cart Popover */}
            <AlertDialog open={isCheckoutAlertOpen} onOpenChange={setIsCheckoutAlertOpen}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="secondary" size="icon" className="relative rounded-full">
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
                            const provider = users.find(u => u.id === cart[0]?.product.providerId);
                            if (!provider) return <p>Cargando...</p>;
                            const isOnlyDelivery = provider.profileSetupData?.isOnlyDelivery || false;
                            const providerAcceptsCredicora = provider.profileSetupData?.acceptsCredicora || false;

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
                        <AlertDialogAction onClick={handleCheckout} disabled={!cartTransaction}>Pagar Ahora</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </header>
  );
}
