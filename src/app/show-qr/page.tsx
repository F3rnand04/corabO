
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Info, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Placeholder for QR Code Generator Library ---
// In a real app, you'd use a library like 'qrcode.react'
const QrCodePlaceholder = ({ value }: { value: string }) => {
  const simplifiedValue = value.split(',')[0].replace(/["{}]/g, '').replace('providerId:', '');

  return (
    <div className="w-full max-w-xs aspect-square bg-white p-4 rounded-lg flex items-center justify-center mx-auto shadow-2xl">
      <div className="w-full h-full border-8 border-black flex flex-col items-center justify-center gap-2">
         <p className="text-black font-bold text-lg">CÓDIGO QR</p>
         <p className="text-black font-mono text-xs break-all p-2">{simplifiedValue}</p>
      </div>
    </div>
  );
};
// --- End Placeholder ---

export default function ShowQrPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useCorabo();

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const qrValue = JSON.stringify({ providerId: currentUser.id });
  const manualCode = currentUser.coraboId || 'N/A';
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(manualCode);
    toast({ title: 'Copiado', description: 'Tu código manual ha sido copiado.' });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-bold">Cobrar en Tienda</h1>
                <div className="w-8"></div>
            </div>
        </div>
      </header>

      <main className="container py-8 max-w-md mx-auto text-center">
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Muestra este QR a tu cliente</h2>
                <p className="text-muted-foreground mt-1">El cliente deberá escanearlo desde su app de Corabo para iniciar el pago.</p>
            </div>
            
            <QrCodePlaceholder value={qrValue} />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Si el escaneo falla, el cliente puede usar tu:</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-2xl font-bold font-mono tracking-widest">{manualCode}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyCode}><Copy className="w-5 h-5"/></Button>
              </div>
            </div>
            
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>¿Cómo funciona?</AlertTitle>
                <AlertDescription>
                    Una vez el cliente escanee el código, se te pedirá introducir el monto total. Luego, el cliente deberá confirmar el plan de pago en su dispositivo para finalizar la transacción.
                </AlertDescription>
            </Alert>
        </div>
      </main>
    </div>
  );
}

