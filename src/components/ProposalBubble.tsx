'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Handshake, Star, Clock } from 'lucide-react';
import type { Message } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth-provider';

export function ProposalBubble({ msg, onAccept, canAccept }: { msg: Message, onAccept: (messageId: string) => void, canAccept: boolean }) {
    const { currentUser } = useAuth();
    const [formattedDate, setFormattedDate] = useState<string | null>(null);
    
    const isClient = currentUser?.type === 'client';
    const isAccepted = msg.isProposalAccepted;
    const proposal = msg.proposal;

    useEffect(() => {
        if (proposal?.deliveryDate) {
            // Format date on client to avoid hydration mismatch
            setFormattedDate(format(new Date(proposal.deliveryDate), "dd/MM/yyyy"));
        }
    }, [proposal?.deliveryDate]);

    if (!currentUser || !proposal) return null;

    const isHourly = proposal.pricingModel === 'hourly';
    const totalAmount = isHourly ? (proposal.hourlyRate || 0) * (proposal.estimatedHours || 0) : proposal.amount;

    return (
        <div className="flex justify-center w-full my-2">
            <div className="w-full max-w-sm rounded-lg border bg-background shadow-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Handshake className="w-6 h-6 text-primary" />
                    <h3 className="font-bold text-lg">{proposal.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{proposal.description}</p>
                <Separator />
                {isHourly ? (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tarifa:</span>
                            <span className="font-semibold">${proposal.hourlyRate?.toFixed(2)} / hora</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Horas Estimadas:</span>
                            <span className="font-semibold">{proposal.estimatedHours}h</span>
                        </div>
                    </>
                ) : null}
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fecha Entrega:</span>
                    <span className="font-semibold">{formattedDate || '...'}</span>
                </div>
                 <div className="flex justify-between items-baseline text-sm">
                    <span className="text-muted-foreground">Total Estimado:</span>
                    <span className="font-bold text-xl">${totalAmount.toFixed(2)}</span>
                </div>
                 {proposal.acceptsCredicora && (
                     <div className="flex items-center gap-2 text-blue-600">
                        <Star className="w-4 h-4 fill-current"/>
                        <span className="text-sm font-semibold">Acepta Credicora</span>
                     </div>
                 )}
                 <div className="pt-2">
                    {isClient && !isAccepted && (
                        <Button className="w-full" onClick={() => onAccept(msg.id)} disabled={!canAccept}>Revisar y Aceptar</Button>
                    )}
                    {isAccepted && (
                        <div className="text-center font-semibold text-green-600 p-2 bg-green-50 border border-green-200 rounded-md">
                            Acuerdo Aceptado
                        </div>
                    )}
                     {!isClient && !isAccepted && (
                         <div className="text-center font-semibold text-yellow-600 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                            Propuesta Enviada - Esperando Cliente
                        </div>
                     )}
                 </div>
            </div>
        </div>
    )
}
