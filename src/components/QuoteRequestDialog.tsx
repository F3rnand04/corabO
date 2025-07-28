
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { FileText, Search, PlusCircle, XCircle, Package, Wrench } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';

const quoteSchema = z.object({
    type: z.enum(['product', 'service'], { required_error: "Debes seleccionar un tipo."}),
    items: z.array(z.object({ name: z.string().min(1, "El nombre no puede estar vacío.") })).max(3),
    description: z.string().max(150, "La descripción no puede superar los 150 caracteres."),
    searchQuery: z.string().min(1, "Debes especificar un proveedor o grupo."),
}).refine(data => {
    if (data.type === 'product') return data.items.length > 0;
    if (data.type === 'service') return data.description.length > 0;
    return false;
}, {
    message: "Debes añadir al menos un producto o una descripción.",
    path: ['items'],
});


type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteRequestDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function QuoteRequestDialog({ isOpen, onOpenChange }: QuoteRequestDialogProps) {
  const { requestQuoteFromGroup } = useCorabo();
  const { toast } = useToast();
  
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      type: 'product',
      items: [{ name: '' }],
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
      : `Servicio: ${data.description}`;

    requestQuoteFromGroup(quoteDetails, data.items.map(i => i.name));

    toast({
      title: "Solicitud de Cotización Enviada",
      description: "Tu solicitud ha sido enviada a los proveedores correspondientes."
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Solicitar una Cotización
          </DialogTitle>
          <DialogDescription>
            Completa el formulario y recibe propuestas de hasta 3 proveedores.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>¿Qué necesitas cotizar?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
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
                                        <Label htmlFor="service" className="flex items-center gap-2 font-normal cursor-pointer"><Wrench className="w-4 h-4"/> Servicios</Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <Separator />
                
                {quoteType === 'product' && (
                    <div className="space-y-2">
                        <Label>Productos (máx. 3)</Label>
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
                            disabled={fields.length >= 3}
                            className="text-xs"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Producto
                        </Button>
                         <FormMessage>{form.formState.errors.items?.message}</FormMessage>
                    </div>
                )}
                
                {quoteType === 'service' && (
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Describe el servicio que necesitas</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Ej: Necesito instalar una lámpara de techo en la sala..."
                                        maxLength={150}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                
                <FormField
                    control={form.control}
                    name="searchQuery"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Buscar Proveedor o Grupo</FormLabel>
                            <FormControl>
                               <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                  <Input placeholder="Ej: Plomeros en Caracas" className="pl-10" {...field} />
                               </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Enviar Solicitud</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
