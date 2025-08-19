
'use client';

import { Button } from "./ui/button";
import Image from "next/image";
import { Download, Loader2, X } from "lucide-react";
import { AlertDialogFooter, AlertDialogCancel } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState, useRef, useEffect } from "react";
import html2canvas from 'html2canvas';

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrDataURL: string | undefined;
    onClose: () => void;
}

export const PrintableQrDisplay = ({ boxName, businessId, qrDataURL, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const downloadQR = useCallback(async () => {
        if (!printRef.current) {
            toast({
                variant: "destructive",
                title: "Error de Renderizado",
                description: "No se pudo encontrar el elemento para descargar. Inténtalo de nuevo."
            });
            return;
        }

        setIsDownloading(true);

        // This small delay ensures all elements, especially the QR image, are fully rendered in the DOM
        // before html2canvas tries to capture them. This is the definitive fix.
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(printRef.current, {
                    useCORS: true,
                    backgroundColor: null,
                    scale: 3 // Higher scale for better resolution
                });
                
                const image = canvas.toDataURL("image/png", 1.0);
                const link = document.createElement('a');
                link.href = image;
                link.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
    
                toast({
                    title: "Descarga Exitosa",
                    description: "Tu código QR se ha descargado."
                });
                onClose();
    
            } catch (error) {
                console.error('Error al generar la imagen del QR:', error);
                toast({
                    variant: "destructive",
                    title: "Error de Descarga",
                    description: "No se pudo generar la imagen para descargar. Por favor, reporta este error."
                });
            } finally {
                setIsDownloading(false);
            }
        }, 500); // 500ms delay

    }, [boxName, onClose, toast]);
    
    return (
        <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-lg shadow-lg">
            {/* The printable area */}
            <div ref={printRef} className="bg-white p-4 rounded-lg">
                <div className="text-center bg-white">
                    <h3 className="font-bold text-lg text-black">Paga a tu Ritmo</h3>
                    <p className="text-sm text-gray-600">Escanea para iniciar con Credicora</p>
                    <div className="my-3 p-2 bg-white inline-block rounded-md">
                         {qrDataURL ? (
                            <Image src={qrDataURL} alt={`Código QR para ${boxName}`} width={220} height={220} />
                        ) : (
                            <div className="w-[220px] h-[220px] flex flex-col items-center justify-center bg-gray-200 rounded-lg text-xs text-gray-500">
                                <Loader2 className="animate-spin h-8 w-8 mb-2" />
                                <p>Cargando QR...</p>
                            </div>
                        )}
                    </div>
                    <p className="font-semibold text-base text-black">Caja: {boxName}</p>
                    <p className="text-xs text-gray-500">ID Negocio: {businessId}</p>
                </div>
            </div>
            
            <AlertDialogFooter className="sm:justify-between w-full">
                 <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
                 <Button onClick={downloadQR} disabled={isDownloading || !qrDataURL}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isDownloading ? 'Generando...' : 'Descargar PNG'}
                </Button>
            </AlertDialogFooter>
        </div>
    );
};
