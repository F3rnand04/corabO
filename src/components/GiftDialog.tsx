
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { gifts, Gift } from '@/lib/data/options';
import { cn } from '@/lib/utils';
import { purchaseGift } from '@/lib/actions/transaction.actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface GiftDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function GiftDialog({ isOpen, onOpenChange }: GiftDialogProps) {
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handlePurchase = async () => {
        if (!selectedGift || !currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un regalo.' });
            return;
        }
        
        const { paymentUrl } = await purchaseGift(currentUser.id, selectedGift);
        
        onOpenChange(false);
        router.push(paymentUrl);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-yellow-500" />
                        Comprar Regalos
                    </DialogTitle>
                    <DialogDescription>
                        Compra stickers para regalar a tus creadores favoritos durante sus transmisiones en vivo.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 grid grid-cols-2 gap-4">
                    {gifts.map((gift) => (
                        <div 
                            key={gift.id}
                            className={cn(
                                "border-2 rounded-lg p-4 text-center cursor-pointer transition-all",
                                selectedGift?.id === gift.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                            )}
                            onClick={() => setSelectedGift(gift)}
                        >
                            <div className="relative w-16 h-16 mx-auto mb-2">
                                <img src={gift.icon} alt={gift.name} className="object-contain w-full h-full" />
                            </div>
                            <p className="font-bold">{gift.name}</p>
                            <p className="text-sm font-semibold text-primary">${gift.price.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{gift.credits} créditos</p>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handlePurchase} disabled={!selectedGift}>
                        Comprar ({selectedGift ? `$${selectedGift.price.toFixed(2)}` : '$0.00'})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
