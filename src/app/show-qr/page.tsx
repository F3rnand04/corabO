
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Info, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { QRCodeSVG } from 'qrcode.react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ShowQrPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useCorabo();

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // The value for the QR code, typically a JSON string or URL.
  const qrValue = JSON.stringify({ providerId: currentUser.id });
  const manualCode = currentUser.coraboId || 'N/A';
  
  const handleCopyCode = () => {
    if (manualCode !== 'N/A') {
      navigator.clipboard.writeText(manualCode);
      toast({ title: 'Copiado', description: 'Tu código manual ha sido copiado.' });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container py-8 max-w-md mx-auto text-center">
        <div className="relative mb-6">
             <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute left-0 top-1/2 -translate-y-1/2">
                <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">Cobrar en Tienda</h1>
        </div>

        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold">Muestra este QR a tu cliente</h2>
                <p className="text-muted-foreground mt-1">El cliente deberá escanearlo desde su app de Corabo para iniciar el pago.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-xl inline-block">
                 <QRCodeSVG 
                    value={qrValue} 
                    size={256} // ~256x256 pixels
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}
                />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Si el escaneo falla, el cliente puede usar tu:</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-2xl font-bold font-mono tracking-widest">{manualCode}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyCode} disabled={manualCode === 'N/A'}><Copy className="w-5 h-5"/></Button>
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
