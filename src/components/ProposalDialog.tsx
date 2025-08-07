
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCorabo } from '@/contexts/CoraboContext';
import { Handshake, Calendar as CalendarIcon, Star } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';

interface ProposalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  conversationId: string;
}

const proposalSchema = z.object({
    title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
    amount: z.coerce.number().min(0, "El monto no puede ser negativo."),
    deliveryDate: z.date({ required_error: "Debes seleccionar una fecha."}),
    acceptsCredicora: z.boolean().default(false),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

export function ProposalDialog({ isOpen, onOpenChange, conversationId }: ProposalDialogProps) {
    const { currentUser, sendProposalMessage } = useCorabo();

    const form = useForm<ProposalFormValues>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            title: '',
            description: '',
            amount: 0,
            acceptsCredicora: currentUser?.profileSetupData?.acceptsCredicora || false,
        }
    });

    const onSubmit = (data: ProposalFormValues) => {
        sendProposalMessage(conversationId, {
            ...data,
            deliveryDate: data.deliveryDate.toISOString(),
        });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Handshake /> Crear Propuesta de Acuerdo</DialogTitle>
                    <DialogDescription>
                        Define los términos del servicio. El cliente deberá aceptarlos para continuar.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título</FormLabel>
                                <FormControl><Input placeholder="Ej: Reparación de fuga en baño principal" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción Detallada</FormLabel>
                                <FormControl><Textarea placeholder="Incluye materiales, tiempo estimado, etc." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto Total (USD)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha de Entrega/Cita</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Elige una fecha</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="acceptsCredicora" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel className="flex items-center gap-2 text-blue-600"><Star className="w-4 h-4 fill-current" />Aceptar Credicora</FormLabel>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit">Enviar Propuesta</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
