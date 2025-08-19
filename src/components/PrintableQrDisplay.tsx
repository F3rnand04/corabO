'use client';

import { Button } from "./ui/button";
import { Download, Loader2 } from "lucide-react";
import { AlertDialogFooter, AlertDialogCancel } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState, useRef } from "react";
import Image from "next/image";
import html2canvas from 'html2canvas';
import QRComponent from "./QRComponent"; 

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrValue: string;
    onClose: () => void;
}

export const PrintableQrDisplay = ({ boxName, businessId, qrValue, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const downloadQR = useCallback(() => {
        if (!printRef.current) {
            toast({ variant: "destructive", title: "Error", description: "No se puede encontrar el contenido para descargar." });
            return;
        }

        setIsDownloading(true);
        html2canvas(printRef.current, {
            useCORS: true,
            backgroundColor: null, // Use transparent background for canvas
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast({ title: "Descarga Iniciada", description: "Tu código QR se está descargando." });
        }).catch(err => {
            console.error("Error al descargar el canvas:", err);
            toast({ variant: "destructive", title: "Error de Descarga", description: "No se pudo generar el PNG." });
        }).finally(() => {
            setIsDownloading(false);
            onClose();
        });
    }, [boxName, onClose, toast]);

    return (
        <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-lg shadow-lg">
            {/* This is the div that will be "photographed" */}
            <div ref={printRef} className="bg-[#E3F2FD] p-6 rounded-lg text-center" style={{ width: '400px' }}>
                <div className="relative w-48 h-20 mx-auto mb-4">
                     <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" fill style={{objectFit: "contain"}} />
                </div>
                <h3 className="text-xl font-bold text-[#1E3A8A] mb-4">Paga a tu Ritmo con Corabo</h3>
                
                <div className="flex justify-center mb-4 p-4">
                     <QRComponent value={qrValue} />
                </div>
                
                <div className="mt-6 border-t border-dashed border-gray-400 pt-4">
                    <p className="font-bold text-lg text-[#1E3A8A]">Caja: {boxName}</p>
                    <p className="text-sm text-gray-600">ID Negocio: {businessId}</p>
                </div>
            </div>

            <AlertDialogFooter className="sm:justify-between w-full mt-4">
                <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
                <Button onClick={downloadQR} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isDownloading ? 'Generando...' : 'Descargar PNG'}
                </Button>
            </AlertDialogFooter>
        </div>
    );
};
