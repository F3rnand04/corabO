
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Search,
  Upload,
  PlusCircle,
  Users,
  ChevronLeft,
  AlertCircle,
  XCircle,
  Package,
  Hand,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdvancedSearchOptions } from '@/components/AdvancedSearchOptions';


function QuotesProHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2 text-primary font-bold">
            <Zap className="w-5 h-5"/>
            <h1 className="text-xl">Cotización PRO</h1>
          </div>
          <Button variant="ghost" size="icon">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}

const serviceGroups = [
    { name: 'Hogar y Reparaciones' },
    { name: 'Tecnología y Soporte' },
    { name: 'Automotriz y Repuestos' },
    { name: 'Alimentos y Restaurantes' },
    { name: 'Fletes y Delivery' },
    { name: 'Salud y Bienestar' },
    { name: 'Educación y Capacitación' },
    { name: 'Eventos y Entretenimiento' },
    { name: 'Belleza y Cuidado Personal' },
];

const quoteSchema = z.object({
    type: z.enum(['product', 'service'], { required_error: "Debes seleccionar un tipo."}),
    items: z.array(z.object({ name: z.string().min(1, "El nombre no puede estar vacío.") })).min(1, 'Debes añadir al menos un producto.').max(5),
    title: z.string(),
    description: z.string(),
    searchQuery: z.string().min(1, "Debes especificar un proveedor o grupo."),
}).refine(data => {
    if (data.type === 'service') return data.title.length > 0;
    return true;
}, {
    message: "El título es requerido para servicios.",
    path: ['title'],
}).refine(data => {
    if (data.type === 'service') return data.description.length > 0;
    return true;
}, {
    message: "La descripción es requerida para servicios.",
    path: ['description'],
});


type QuoteFormValues = z.infer<typeof quoteSchema>;


export default function QuotesProPage() {
  const { toast } = useToast();
  const { requestQuoteFromGroup } = useCorabo();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      type: 'service',
      items: [{ name: '' }],
      title: '',
      description: '',
      searchQuery: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const quoteType = form.watch('type');

  const onSubmit = (data: QuoteFormValues) => {
    const quoteDetails = data.type === 'product'
      ? `Productos: ${data.items.map(i => i.name).join(', ')}`
      : `Servicio: ${data.title}`;

    requestQuoteFromGroup(quoteDetails, data.items.map(i => i.name));

    toast({
      title: "¡Felicidades! Solicitud PRO enviada",
      description: "Recibirás cotizaciones de los mejores proveedores."
    });
    form.reset();
  };

  return (
    <>
      <QuotesProHeader />
      <main className="container py-6">
        <div className="mx-auto max-w-2xl">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                            <FormLabel className="text-base font-semibold">¿Qué necesitas cotizar?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        form.clearErrors(); // Clear errors when changing type
                                        if (value === 'product' && fields.length === 0) {
                                            append({ name: '' });
                                        }
                                    }}
                                    defaultValue={field.value}
                                    className="flex gap-4"
                                >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="product" id="product" />
                                        </FormControl>
                                        <Label htmlFor="product" className="flex items-center gap-2 font-normal cursor-pointer"><Package className="w-4 h-4"/> Productos</Label>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="service" id="service" />
                                        </FormControl>
                                        <Label htmlFor="service" className="flex items-center gap-2 font-normal cursor-pointer"><Hand className="w-4 h-4"/> Servicios</Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage className="col-span-2" />
                        </FormItem>
                    )}
                  />
                  
                   <div className="flex items-center gap-2">
                     <Select>
                        <SelectTrigger className="w-[150px]">
                          <Users className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="GRUPOS" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceGroups.map((group) => (
                            <SelectItem key={group.name} value={group.name}>{group.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                     <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Buscar servicio o producto..." className="pl-10" />
                     </div>
                  </div>
              
                  <Separator />

                  {quoteType === 'service' && (
                    <>
                       <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                                <FormLabel>QUÉ NECESITAS:</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Instalar una lámpara de techo" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                          )}
                        />
                      <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción detallada:</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe con el mayor detalle posible tu requerimiento para obtener cotizaciones más precisas. Incluye medidas, materiales, ubicación, etc."
                                  rows={8}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </>
                  )}

                  {quoteType === 'product' && (
                     <div className="space-y-2">
                        <Label>Productos (máx. 5)</Label>
                        {fields.map((field, index) => (
                           <div key={field.id} className="flex items-center gap-2">
                             <Input 
                                {...form.register(`items.${index}.name` as const)}
                                placeholder={`Producto ${index + 1}`}
                             />
                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <XCircle className="w-5 h-5 text-destructive" />
                             </Button>
                           </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: '' })}
                            disabled={fields.length >= 5}
                            className="text-xs"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Producto
                        </Button>
                        <FormMessage>{form.formState.errors.items?.message || form.formState.errors.items?.root?.message}</FormMessage>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <AdvancedSearchOptions />
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <Button type="submit" size="lg" className="w-full">
                      <Zap className="mr-2 h-5 w-5"/>
                      Enviar Cotización PRO
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

