
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, CameraOff, Loader2, Edit, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-provider';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { startQrSession } from '@/lib/actions/cashier.actions';

function ScanQrContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, users } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream;
    let animationFrameId: number;

    const setupCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setHasCamera(false);
            return;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setHasCamera(false);
            toast({
                variant: 'destructive',
                title: 'Error de Cámara',
                description: 'No se pudo acceder a la cámara. Revisa los permisos.',
            });
        }
    };
    
    const detectQrCode = async () => {
        if (videoRef.current && canvasRef.current && 'BarcodeDetector' in window) {
            const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && !isProcessing) {
                    handleScan(barcodes[0].rawValue);
                }
            } catch (e) {
                console.error('Barcode detection failed:', e);
            }
        }
        if (!isProcessing) {
          animationFrameId = requestAnimationFrame(detectQrCode);
        }
    };

    setupCamera().then(() => {
       if ('BarcodeDetector' in window) {
           animationFrameId = requestAnimationFrame(detect-qr-code);
       } else {
           console.warn("BarcodeDetector API not supported in this browser.");
           // Consider a fallback to a library if needed, but for now we'll rely on manual input.
           setHasCamera(false); 
       }
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if(animationFrameId){
        cancelAnimationFrame(animationFrameId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (data: string | null) => {
    if (data && !isProcessing && currentUser) {
      setIsProcessing(true);
      try {
        const qrData = JSON.parse(data);
        if (qrData.providerId) {
          toast({
            title: "¡QR Escaneado!",
            description: `Conectando con el proveedor...`,
          });
          const sessionId = await startQrSession(currentUser.id, qrData.providerId, qrData.cashierBoxId);
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

  const renderContent = () => {
    if (isProcessing) {
        return (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <h2 className="text-xl font-bold">Iniciando Sesión Segura...</h2>
            </div>
        );
    }
    
    if (hasCamera) {
        return (
             <div className="w-full max-w-sm aspect-square relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="w-2/3 h-2/3 text-white/50 animate-pulse" />
                </div>
                 <p className="absolute bottom-4 left-4 right-4 text-white text-center font-bold text-sm bg-black/50 p-2 rounded-lg">
                  Apunta la cámara al código QR
                </p>
             </div>
        )
    }

    // Fallback for Desktop or devices without camera/permission
    return (
      <div className="w-full max-w-sm text-center">
        <Card className="text-foreground shadow-2xl border-border">
          <CardHeader>
             <div className="mx-auto bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Edit className="w-8 h-8"/>
             </div>
            <CardTitle>Entrada Manual</CardTitle>
            <CardDescription>
              La cámara no está disponible. Introduce el Corabo ID del proveedor para iniciar el pago.
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
      <header className="absolute top-0 left-0 z-20 p-4">
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
