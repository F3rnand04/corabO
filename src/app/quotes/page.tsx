
"use client";

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Trash2, Send, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuoteItem {
  id: number;
  description: string;
  quantity: number;
}

export default function QuotesPage() {
  const { currentUser } = useCorabo();
  const { toast } = useToast();
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [currentItem, setCurrentItem] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  // Simulación de límites basados en el usuario
  const quoteLimit = currentUser.type === 'provider' ? 20 : 5;
  const isVerified = currentUser.type === 'provider';

  const handleAddItem = () => {
    if (!currentItem.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'La descripción no puede estar vacía.' });
      return;
    }
    if (items.length >= quoteLimit) {
      toast({ variant: 'destructive', title: 'Límite alcanzado', description: `Has alcanzado tu límite de ${quoteLimit} artículos por cotización.` });
      return;
    }
    setItems([...items, { id: Date.now(), description: currentItem, quantity: currentQty }]);
    setCurrentItem('');
    setCurrentQty(1);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSendQuote = () => {
    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes añadir al menos un artículo a la lista.' });
      return;
    }
    // Lógica de envío simulada
    toast({ title: 'Cotización Enviada', description: 'Tu solicitud de cotización ha sido enviada a los proveedores cercanos.' });
    setItems([]);
  };

  return (
    <main className="container py-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <div>
            <h1 className="text-3xl font-bold">Cotizaciones Especiales</h1>
            <p className="text-muted-foreground">Crea una lista de productos o servicios para recibir una cotización personalizada.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Tu Lista de Cotización</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <Textarea 
                            placeholder="Describe el producto o servicio que necesitas..." 
                            value={currentItem}
                            onChange={(e) => setCurrentItem(e.target.value)}
                            className="flex-grow"
                        />
                         <div className="flex sm:flex-col gap-2">
                            <Input 
                                type="number" 
                                value={currentQty}
                                onChange={(e) => setCurrentQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20 sm:w-full"
                                min="1"
                            />
                            <Button onClick={handleAddItem} className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Añadir
                            </Button>
                        </div>
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="w-[100px] text-center">Cantidad</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length > 0 ? items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            Tu lista está vacía. Añade artículos para cotizar.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Información</CardTitle>
                    <CardDescription>Detalles sobre tu solicitud.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-start gap-3 p-3 bg-muted rounded-md border">
                        <Info className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold">Nivel de Usuario: {isVerified ? 'Verificado' : 'Básico'}</p>
                            <p className="text-sm text-muted-foreground">
                                {isVerified ? 'Acceso completo a cotizaciones.' : 'Algunas funciones son limitadas.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Artículos en la lista:</span>
                        <Badge variant={items.length >= quoteLimit ? 'destructive' : 'secondary'}>
                            {items.length} / {quoteLimit}
                        </Badge>
                    </div>
                    {!isVerified && (
                        <p className="text-xs text-muted-foreground text-center">
                            Este servicio puede tener un costo adicional para usuarios no verificados.
                        </p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" onClick={handleSendQuote} disabled={items.length === 0}>
                        <Send className="mr-2 h-5 w-5" />
                        Solicitar Cotización
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </main>
  );
}
