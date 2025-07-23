"use client";

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Minus, Plus, Trash2, Truck, Check, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, checkout, currentUser } = useCorabo();
  const router = useRouter();
  const [withDelivery, setWithDelivery] = useState(false);

  if (currentUser.type !== 'client') {
    return (
      <main className="container flex items-center justify-center py-20 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground">Esta vista solo está disponible para perfiles de cliente.</p>
        </div>
      </main>
    );
  }

  const subtotal = getCartTotal();
  const deliveryCost = withDelivery ? 1.5 * 10 : 0; // Simulate 10km distance
  const total = subtotal + deliveryCost;

  const handleCheckout = () => {
    checkout(withDelivery);
    router.push('/transactions');
  };

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Tu Carrito de Compras</h1>
      {cart.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
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
                            <span>{quantity}</span>
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
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Pre-factura</CardTitle>
                <CardDescription>Revisa tu orden antes de finalizar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor="delivery-switch">¿Desea Delivery?</Label>
                  </div>
                  <Switch id="delivery-switch" checked={withDelivery} onCheckedChange={setWithDelivery} />
                </div>
                {withDelivery && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Costo de envío (simulado)</span>
                    <span className="font-medium">${deliveryCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xl font-bold border-t pt-4">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  <Check className="mr-2 h-5 w-5" />
                  Finalizar Compra
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Tu carrito está vacío</h2>
          <p className="mt-2 text-muted-foreground">Añade productos para verlos aquí.</p>
          <Button asChild className="mt-6">
            <a href="/products">Explorar productos</a>
          </Button>
        </div>
      )}
    </main>
  );
}
