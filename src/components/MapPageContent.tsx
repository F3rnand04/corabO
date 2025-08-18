
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2, X, CheckCircle, Map as MapIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useCorabo } from '@/contexts/CoraboContext';

export function MapPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { setDeliveryAddress } = useCorabo();
  const [manualAddress, setManualAddress] = useState('');

  const handleConfirmLocation = () => {
    if (!manualAddress.trim()) {
      toast({
        variant: 'destructive',
        title: "Dirección Vacía",
        description: "Por favor, pega o escribe una dirección.",
      });
      return;
    }
    // For simplicity, we are not storing lat/lon anymore, just the address string.
    setDeliveryAddress(manualAddress);
    toast({ title: "Ubicación Confirmada", description: "La dirección ha sido guardada."});
    router.back();
  };

  return (
    <div className="relative h-screen w-screen bg-muted">
      <div className="absolute inset-0">
         <Image
            src="https://i.postimg.cc/PqM6bY7W/static-map.png"
            alt="Mapa estático de una ciudad"
            layout="fill"
            objectFit="cover"
            className="opacity-50"
            data-ai-hint="map background"
        />
      </div>

       <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 bg-background/80 hover:bg-background rounded-full shadow-md z-10">
            <X className="h-5 w-5"/>
        </Button>
      
        <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto z-10">
            <Card className="shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5">
                <CardContent className="p-4 space-y-4">
                    <div>
                    <h3 className="font-semibold text-lg">Define tu Ubicación</h3>
                    <p className="text-sm text-muted-foreground mt-1">Usa Google Maps para encontrar tu dirección y luego pégala aquí.</p>
                    </div>
                    <Button className="w-full" asChild>
                        <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">
                            <MapIcon className="mr-2 h-4 w-4"/>
                            Abrir Google Maps
                        </a>
                    </Button>
                    <div className="space-y-2">
                        <Label htmlFor="manual-address">Dirección Manual</Label>
                        <Input 
                            id="manual-address" 
                            placeholder="Pega la dirección aquí..."
                            value={manualAddress}
                            onChange={(e) => setManualAddress(e.target.value)}
                        />
                    </div>
                    <Button className="w-full" onClick={handleConfirmLocation} disabled={!manualAddress.trim()}>
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        Confirmar Ubicación
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
