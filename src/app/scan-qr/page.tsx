
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, CameraOff, Loader2, Edit, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';


// --- Placeholder for QR Scanner Library ---
const QrScannerPlaceholder = ({ onScan, onScanError }: { onScan: (data: string) => void, onScanError: (error: Error) => void }) => {
  // In a real app, this would use a library like 'react-qr-scanner'
  // For this prototype, we'll simulate a scan.
  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate scanning a provider's QR for a specific box
      onScan('{"providerId":"user_provider_1", "cashierBoxId": "caja-1"}');
    }, 2000);
    return () => clearTimeout(timer);
  }, [onScan]);

  return (
    <div className="w-full aspect-square bg-black rounded-lg flex flex-col items-center justify-center text-white relative overflow-hidden">
      <div className="w-64 h-64 border-4 border-dashed border-green-500 rounded-lg" />
      <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-[scan_2s_ease-in-out_infinite]" />
      <p className="mt-4 text-sm text-center">Simulando escaneo...</p>
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
// --- End Placeholder ---

function ScanQrContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { startQrSession, currentUser, users } = useCorabo();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Check if running on a client-side environment
    setIsClient(true);
  }, []);

  const isMobileDevice = () => {
    if (!isClient) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };
  
  const handleScan = async (data: string | null) => {
    if (data && !isProcessing) {
      setIsProcessing(true);
      try {
        const qrData = JSON.parse(data);
        if (qrData.providerId) {
          toast({
            title: "¡QR Escaneado!",
            description: `Conectando con el proveedor...`,
          });
          const sessionId = await startQrSession(qrData.providerId, qrData.cashierBoxId);
          if (sessionId) {
            router.push(`/payment/approval?sessionId=${sessionId}`);
          } else {
             throw new Error("No se pudo iniciar la sesión");
          }
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error de Sesión',
          description: 'No se pudo iniciar la sesión de pago. Inténtalo de nuevo.',
        });
        setIsProcessing(false);
      }
    }
  };
  
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim() && !isProcessing) {
        const provider = users.find(u => u.coraboId === manualCode.trim());
        if(provider) {
            handleScan(JSON.stringify({providerId: provider.id}));
        } else {
             toast({
                variant: 'destructive',
                title: 'Código Inválido',
                description: 'No se encontró ningún proveedor con ese Corabo ID.',
            });
        }
    }
  }

  const handleError = (err: any) => {
    console.error(err);
    toast({
      variant: 'destructive',
      title: 'Error de Escaneo',
      description: 'No se pudo leer el código QR.',
    });
  };

  const renderContent = () => {
    if (isProcessing) {
        return (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <h2 className="text-xl font-bold">Iniciando Sesión Segura...</h2>
            </div>
        );
    }
    
    if (isMobileDevice()) {
        return (
             <div className="w-full max-w-sm">
                <QrScannerPlaceholder onScan={handleScan} onScanError={handleError} />
             </div>
        )
    }

    // Fallback for Desktop
    return (
      <div className="w-full max-w-sm text-center">
        <Card className="text-foreground shadow-2xl border-border">
          <CardHeader>
             <div className="mx-auto bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Edit className="w-8 h-8"/>
             </div>
            <CardTitle>Entrada Manual</CardTitle>
            <CardDescription>
              Parece que estás en una PC. Introduce el Corabo ID del proveedor para iniciar el pago.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit}>
              <Input 
                  placeholder="Ej: corabo1234"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="text-center text-lg"
              />
              <Button type="submit" className="w-full mt-4">Continuar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };


  return (
    <div className="relative h-screen w-screen bg-muted/40">
      <header className="absolute top-0 left-0 z-20 p-4 w-full flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-background/80 rounded-full shadow-md hover:bg-background">
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </header>
       <main className="h-full w-full flex items-center justify-center p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default function ScanQrPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <ScanQrContent />
        </Suspense>
    )
}
