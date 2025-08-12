
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Placeholder for QR Scanner Library ---
// In a real app, you would use a library like 'react-qr-reader'
const QrScannerPlaceholder = ({ onScan }: { onScan: (data: string) => void }) => {
  return (
    <div 
      className="w-full aspect-square bg-black rounded-lg flex flex-col items-center justify-center text-white"
      onClick={() => onScan('{"providerId":"provider_123","session":"xyz"}')}
    >
      <div className="w-64 h-64 border-4 border-dashed border-green-500 rounded-lg animate-pulse" />
      <p className="mt-4 text-sm text-center">Simulador de Escáner QR<br/>(Haz clic para simular un escaneo)</p>
    </div>
  );
};
// --- End Placeholder ---

export default function ScanQrPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  
  // Simulate asking for camera permission
  useEffect(() => {
    // This is a placeholder. A real implementation would use navigator.mediaDevices.getUserMedia
    setTimeout(() => {
        // To test the error case, you can set this to false
        setHasCameraPermission(true); 
    }, 500);
  }, []);

  const handleScan = (data: string | null) => {
    if (data) {
      setScannedData(data);
      toast({
        title: "¡QR Escaneado!",
        description: `Se ha iniciado una sesión de pago. Datos: ${data}`,
      });
      // Here you would redirect to the payment approval screen
      // For now, we just go back.
      setTimeout(() => router.back(), 2000);
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
        {hasCameraPermission ? (
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
