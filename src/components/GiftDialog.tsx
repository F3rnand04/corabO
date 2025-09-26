'use client';

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { gifts } from '@/lib/data/options'; // Data import
import type { Gift } from '@/lib/types'; // Type import
import { cn } from '@/lib/utils';
import { purchaseGift } from '@/lib/actions/transaction.actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from "lucide-react";

export function GiftDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!currentUser || !selectedGift) return;

    setIsProcessing(true);
    try {
      await purchaseGift(currentUser.id, selectedGift);
      toast({
        title: "¡Regalo Comprado!",
        description: `Has comprado ${selectedGift.name}. Tus créditos han sido actualizados.`,
      });
      onOpenChange(false); // Close the dialog on success
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error en la Compra",
        description: error.message || "No se pudo completar la compra del regalo.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Comprar Créditos de Regalo</DialogTitle>
        <DialogDescription>
          Selecciona un paquete para recargar tu saldo y enviarlo a tus amigos.
          Tu saldo actual es de <span className="font-bold text-primary">{currentUser?.giftCredits || 0} créditos</span>.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-2 gap-4 py-4">
        {gifts.map((gift) => (
          <div
            key={gift.id}
            onClick={() => setSelectedGift(gift)}
            className={cn(
              "p-4 border rounded-lg cursor-pointer transition-all text-center",
              selectedGift?.id === gift.id
                ? "border-primary ring-2 ring-primary shadow-lg"
                : "hover:border-primary/50"
            )}
          >
            <div className="text-4xl mb-2">{gift.icon}</div>
            <div className="font-bold">{gift.credits} créditos</div>
            <div className="text-sm text-muted-foreground">${gift.price.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
        <Button onClick={handlePurchase} disabled={!selectedGift || isProcessing}>
          {isProcessing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
          ) : (
            `Comprar por $${selectedGift ? selectedGift.price.toFixed(2) : '0.00'}`
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
