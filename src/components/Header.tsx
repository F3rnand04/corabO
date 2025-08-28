
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Menu, Search, LogOut, User, Wallet, History as HistoryIcon, Shield, HelpCircle, Contact, ShoppingCart, ChevronDown, KeyRound, LogInIcon } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import { useAuth } from "@/components/auth/AuthProvider";
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
import { AlertDialog, AlertDialogTrigger } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { CartPopoverContent } from "./CartPopoverContent";
import { CheckoutAlertDialogContent } from "./CheckoutAlertDialogContent";
import { toggleGps } from "@/lib/actions/user.actions";


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
  const { cart, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, currentUser } = useCorabo();
  const { logout } = useAuth();
  const router = useRouter();

  const [isCheckoutAlertOpen, setIsCheckoutAlertOpen] = useState(false);
  
  if (!currentUser) {
    // The header for unauthenticated users is removed to create a cleaner landing page experience.
    return null;
  }
  
  const isCompany = currentUser.profileSetupData?.providerType === 'company';
  const isTransactionsActive = currentUser.isTransactionsActive === true;
  
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const selectedCategoryName = serviceGroups.find(g => g.id === categoryFilter)?.name || "Todos";

  const cashierBoxes = currentUser.profileSetupData?.cashierBoxes || [];
  const activeCashierBoxes = cashierBoxes.filter(box => box.isActive).length;
  const totalCashierBoxes = cashierBoxes.length;

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        {/* Top Row: Logo, Actions, Menu */}
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/contacts" passHref>
             <Image src="https://i.postimg.cc/8zWvkhxS/Sin-t-tulo-3.png" alt="Corabo Logo" width={120} height={40} className="h-10 w-auto cursor-pointer" />
          </Link>

          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" onClick={() => toggleGps(currentUser.id)} onDoubleClick={() => router.push('/map')}>
                <MapPin className={cn("h-5 w-5", currentUser.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => router.push('/transactions')}>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            {isCompany && isTransactionsActive && (
              <Button asChild variant="ghost" size="icon" className="relative">
                <Link href="/transactions/settings/cashier">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    {totalCashierBoxes > 0 && (
                        <Badge variant="secondary" className="absolute -bottom-1 -right-1 text-xs px-1 h-4 scale-75">
                            {activeCashierBoxes}/{totalCashierBoxes}
                        </Badge>
                    )}
                </Link>
              </Button>
            )}
            
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6 text-muted-foreground"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {currentUser.role === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Panel de Admin</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
                   <DropdownMenuItem onClick={() => router.push('/contacts')}>
                    <Contact className="mr-2 h-4 w-4" />
                    <span>Contactos</span>
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
                      <CartPopoverContent onCheckoutClick={() => setIsCheckoutAlertOpen(true)} />
                    </PopoverContent>
                </Popover>
                <CheckoutAlertDialogContent onOpenChange={setIsCheckoutAlertOpen} />
            </AlertDialog>
        </div>
      </div>
    </header>
  );
}
