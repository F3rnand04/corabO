
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
import {
  FileText,
  Search,
  PlusCircle,
  ChevronLeft,
  AlertCircle,
  XCircle,
  Package,
  Hand,
  Zap,
  Star,
  Upload,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    group: z.string().min(1, "Debes seleccionar un grupo."),
    searchQuery: z.string().min(1, "Debes especificar una búsqueda."),
    items: z.array(z.object({ name: z.string().min(1, "El nombre no puede estar vacío.") })).max(5),
    title: z.string(),
    description: z.string(),
    file: z.any().optional(),
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const unlockedOption = searchParams.get('unlocked');
  const { requestQuoteFromGroup } = useCorabo();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      type: 'service',
      group: '',
      searchQuery: '',
      items: [{ name: '' }],
      title: '',
      description: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const quoteType = form.watch('type');

  const onSubmit = (data: QuoteFormValues) => {
    const success = requestQuoteFromGroup(data.title, data.items.map(i => i.name));

    if (success) {
        let successMessage = "¡Excelente! Tu solicitud PRO ha sido enviada a más de 15 proveedores premium. ¡Las mejores cotizaciones están en camino!";
        
        if (unlockedOption === 'verified') {
            successMessage = "¡Misión Cumplida! Tu solicitud PRO ha sido enviada a más de 20 proveedores verificados. ¡Prepárate para recibir las mejores ofertas!";
        }

        toast({
        title: "¡Cotización PRO Enviada!",
        description: successMessage
        });
        form.reset();
    } else {
         toast({
            variant: "destructive",
            title: "Límite de Cotizaciones Diarias Alcanzado",
            description: "Has superado el límite de cotizaciones para el mismo servicio/producto hoy. ¡Suscríbete para cotizar sin límites!",
            action: <Button variant="secondary" onClick={() => router.push('/contacts')}>Suscribirme</Button>
        })
    }
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
                  
                   <div className="flex items-start gap-2">
                     <FormField
                        control={form.control}
                        name="group"
                        render={({ field }) => (
                          <FormItem className="w-[150px]">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-full">
                                  <SelectValue placeholder="GRUPOS" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {serviceGroups.map((group) => (
                                  <SelectItem key={group.name} value={group.name}>{group.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     <FormField
                        control={form.control}
                        name="searchQuery"
                        render={({ field }) => (
                           <FormItem className="flex-grow">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <FormControl>
                                  <Input placeholder="Buscar servicio o producto..." className="pl-10 rounded-full" {...field} />
                                </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>¿Qué necesitas cotizar?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      if (value === 'service') {
                                          form.setValue('items', [{ name: '' }]);
                                      } else {
                                          form.setValue('title', '');
                                          form.setValue('description', '');
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
                            <FormMessage />
                        </FormItem>
                    )}
                />
              
                 {quoteType === 'service' ? (
                  <div className="space-y-6">
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
                  </div>
                 ) : (
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
                  
                  <div className="space-y-2">
                     <Label>Adjuntar Archivos (Opcional)</Label>
                     <div className="flex items-center gap-2">
                       <FormField
                         control={form.control}
                         name="file"
                         render={({ field }) => (
                           <FormItem>
                             <FormControl>
                               <Button asChild variant="outline">
                                 <Label htmlFor="file-upload" className="cursor-pointer">
                                   <Upload className="mr-2 h-4 w-4" />
                                   Cargar PDF o Fotos
                                 </Label>
                               </Button>
                             </FormControl>
                             <Input id="file-upload" type="file" className="hidden" multiple accept="image/*,.pdf" onChange={(e) => field.onChange(e.target.files)} />
                           </FormItem>
                         )}
                       />
                       <p className="text-xs text-muted-foreground">Puedes subir hasta 5 fotos o 1 PDF.</p>
                     </div>
                   </div>

                  <div className="pt-4">
                    <AdvancedSearchOptions unlockedOption={unlockedOption} />
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
          
           <div className="p-4 border rounded-lg bg-muted/50 mt-6 text-center">
                <h3 className="font-semibold">¡Cotiza siempre sin pagos adicionales!</h3>
                <p className="text-sm text-muted-foreground mt-1">Disfruta de búsquedas PRO ilimitadas y más beneficios.</p>
                <Button className="mt-4" variant="outline" onClick={() => router.push('/contacts')}>
                    <Star className="mr-2 h-4 w-4"/>
                    Suscribirme ahora
                </Button>
            </div>
        </div>
      </main>
    </>
  );
}
