
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, CameraOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCorabo } from '@/contexts/CoraboContext';

// --- Placeholder for QR Scanner Library ---
const QrScannerPlaceholder = ({ onScan }: { onScan: (data: string) => void }) => {
  // Simulate a scan after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onScan('{"providerId":"user_provider_1"}'); // Simulate scanning a provider's QR
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

export default function ScanQrPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { startQrSession, currentUser } = useCorabo();
  
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const searchParams = useSearchParams();

  const isRedirected = searchParams.get('redirected');

  useEffect(() => {
    if (currentUser?.type === 'provider' && !isRedirected) {
      toast({
        variant: 'destructive',
        title: 'Acción no permitida',
        description: 'Los proveedores no pueden escanear códigos para pagar, pero puedes usar esta vista para probar.',
      });
    }
  }, [currentUser, toast, isRedirected]);

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
          const sessionId = await startQrSession(qrData.providerId);
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

  const handleError = (err: any) => {
    console.error(err);
    toast({
      variant: 'destructive',
      title: 'Error de Escaneo',
      description: 'No se pudo leer el código QR.',
    });
  };

  return (
    <div className="relative h-screen w-screen bg-black text-white">
      <header className="absolute top-0 left-0 z-20 p-4 w-full flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-black/30 rounded-full shadow-md hover:bg-black/50">
          <ChevronLeft className="h-6 w-6" />
        </Button>
         <h1 className="text-lg font-bold drop-shadow-md">Pagar con Credicora</h1>
        <div className="w-10"></div>
      </header>

      <main className="h-full w-full flex items-center justify-center p-8">
        {isProcessing ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <h2 className="text-xl font-bold">Iniciando Sesión Segura...</h2>
            </div>
        ) : hasCameraPermission ? (
          <div className="w-full max-w-sm">
            <QrScannerPlaceholder onScan={handleScan} />
          </div>
        ) : (
          <div className="text-center">
            <CameraOff className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold">Acceso a la Cámara Denegado</h2>
            <p className="text-muted-foreground mt-2">Por favor, habilita el permiso de la cámara en tu navegador para continuar.</p>
          </div>
        )}
      </main>

       <footer className="absolute bottom-0 left-0 z-20 p-6 w-full text-center bg-gradient-to-t from-black/70 to-transparent">
         <p className="text-sm">Apunta la cámara al código QR de la tienda para iniciar el pago.</p>
       </footer>
    </div>
  );
}
