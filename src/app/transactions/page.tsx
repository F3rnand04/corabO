
"use client";

import { useState, useEffect } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction, TransactionStatus } from '@/lib/types';
import { TransactionDetailsDialog } from '@/components/TransactionDetailsDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Handshake, MessageSquare, ShieldAlert, Truck, Minus, Plus, Trash2, Check, ShoppingCart as ShoppingCartIcon, FileDown, LineChart, List, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import TransactionsChart from '@/components/charts/TransactionsChart';

type FilterStatus = 'all' | TransactionStatus;

export default function TransactionsPage() {
  const { transactions, currentUser, cart, updateCartQuantity, removeFromCart, getCartTotal, checkout } = useCorabo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [withDelivery, setWithDelivery] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'summary');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const userTransactions = transactions
    .filter(tx => tx.clientId === currentUser.id || tx.providerId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = filter === 'all'
    ? userTransactions
    : userTransactions.filter(tx => tx.status === filter);

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };
  
  const statusInfo: Record<TransactionStatus, { color: string, icon: React.ElementType }> = {
    'Carrito Activo': { color: 'bg-gray-500', icon: AlertTriangle },
    'Pre-factura Pendiente': { color: 'bg-gray-500', icon: AlertTriangle },
    'Pagado': { color: 'bg-green-500', icon: CheckCircle },
    'Solicitud Pendiente': { color: 'bg-yellow-500', icon: MessageSquare },
    'Cotización Recibida': { color: 'bg-blue-500', icon: MessageSquare },
    'Acuerdo Aceptado - Pendiente de Ejecución': { color: 'bg-green-500', icon: Handshake },
    'Servicio en Curso': { color: 'bg-green-500', icon: Handshake },
    'En Disputa': { color: 'bg-red-500', icon: ShieldAlert },
    'Resuelto': { color: 'bg-green-500', icon: CheckCircle },
  };

  const filters: FilterStatus[] = ['all', 'Solicitud Pendiente', 'En Disputa', 'Pagado', 'Servicio en Curso'];

  const subtotal = getCartTotal();
  const deliveryCost = withDelivery ? 1.5 * 10 : 0;
  const total = subtotal + deliveryCost;

  const handleCheckout = () => {
    checkout(withDelivery);
    setActiveTab('history');
  };

  const isClient = currentUser.type === 'client';

  const handleExportPDF = () => {
    alert("Funcionalidad para exportar a PDF no implementada aún.");
  }

  return (
    <>
      <main className="container py-8">
        <div className="mb-6">
            <h1 className="text-3xl font-bold">Registro de Transacciones</h1>
            <p className="text-muted-foreground">Tu centro de control financiero.</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="summary"><LineChart className="mr-2 h-4 w-4" /> Resumen</TabsTrigger>
                <TabsTrigger value="history"><List className="mr-2 h-4 w-4" /> Historial</TabsTrigger>
                <TabsTrigger value="cart">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Carrito
                    {cart.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </Badge>
                    )}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
                 <Card>
                  <CardHeader>
                    <CardTitle>Resumen Visual de Movimientos</CardTitle>
                    <CardDescription>Gráfica de ingresos y egresos de los últimos meses.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TransactionsChart transactions={userTransactions} />
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history">
                <div className="flex justify-between items-center mb-4">
                  <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterStatus)}>
                      <TabsList>
                          {filters.map(f => (
                              <TabsTrigger key={f} value={f}>{f === 'all' ? 'Todas' : f}</TabsTrigger>
                          ))}
                      </TabsList>
                  </Tabs>
                  <Button variant="outline" onClick={handleExportPDF}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => {
                          const { icon: Icon, color } = statusInfo[tx.status];
                          return (
                            <TableRow key={tx.id} onClick={() => handleRowClick(tx)} className="cursor-pointer">
                              <TableCell>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${color}`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{tx.type === 'Compra' ? `Compra de ${tx.details.items?.length || 0} items` : `Servicio: ${tx.details.serviceName}`}</div>
                                <div className="text-sm text-muted-foreground">ID: {tx.id}</div>
                              </TableCell>
                              <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                              <TableCell>${tx.amount.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{tx.status}</Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No hay transacciones que coincidan con el filtro.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
            </TabsContent>
            <TabsContent value="cart">
                {!isClient ? (
                   <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/50">
                    <h2 className="mt-4 text-xl font-semibold">Acceso Denegado</h2>
                    <p className="mt-2 text-muted-foreground">El carrito solo está disponible para perfiles de cliente.</p>
                  </div>
                ) : cart.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                      <Card>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[100px] hidden md:table-cell">Producto</TableHead>
                                <TableHead>Detalles</TableHead>
                                <TableHead className="text-center">Cantidad</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cart.map(({ product, quantity }) => (
                                <TableRow key={product.id}>
                                  <TableCell className="hidden md:table-cell">
                                    <Image src={product.imageUrl} alt={product.name} width={80} height={80} className="rounded-md object-cover" data-ai-hint="product technology"/>
                                  </TableCell>
                                  <TableCell>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQuantity(product.id, quantity - 1)}>
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="font-mono">{quantity}</span>
                                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQuantity(product.id, quantity + 1)}>
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">${(product.price * quantity).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(product.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                      </Card>
                    </div>
                    <div className="lg:col-span-1">
                      <Card>
                        <CardHeader>
                          <CardTitle>Resumen de Pre-factura</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">${subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="delivery-switch" className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                              <Truck className="h-5 w-5" />
                              ¿Desea Delivery?
                            </Label>
                            <Switch id="delivery-switch" checked={withDelivery} onCheckedChange={setWithDelivery} />
                          </div>
                          {withDelivery && (
                            <div className="flex items-center justify-between text-sm text-muted-foreground pl-7">
                              <span>Costo de envío</span>
                              <span className="font-medium">${deliveryCost.toFixed(2)}</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                           <div className="flex items-center justify-between text-xl font-bold border-t pt-4 w-full">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                          <Button className="w-full" size="lg" onClick={handleCheckout}>
                            <Check className="mr-2 h-5 w-5" />
                            Finalizar Compra
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/50">
                    <ShoppingCartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">Tu carrito está vacío</h2>
                    <p className="mt-2 text-muted-foreground">Añade productos para verlos aquí.</p>
                    <Button asChild className="mt-6">
                      <a href="/products">Explorar productos</a>
                    </Button>
                  </div>
                )}
            </TabsContent>
        </Tabs>
      </main>
      <TransactionDetailsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={selectedTransaction}
      />
    </>
  );
}

    