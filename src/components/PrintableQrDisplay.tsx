
'use client';

import { Button } from "./ui/button";
import { Download, Loader2, QrCode, Handshake, Wallet, ArrowRight } from "lucide-react";
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
            backgroundColor: null,
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
            <div ref={printRef} className="bg-[#E3F2FD] p-6 rounded-2xl text-center flex flex-col justify-between" style={{ width: '384px', height: '640px' }}>
                <div className="flex-shrink-0">
                    <div className="relative w-40 h-16 mx-auto">
                         <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" fill style={{objectFit: "contain"}} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1E3A8A] mt-4">Paga a tu Ritmo con Corabo</h2>
                </div>
                
                <div className="flex justify-center items-center my-4 flex-grow">
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <QRComponent value={qrValue} />
                    </div>
                </div>
                
                <div className="flex-shrink-0">
                    <div className="flex justify-around items-center text-[#1E3A8A] mb-4">
                        <div className="flex flex-col items-center gap-1">
                            <QrCode className="w-8 h-8" />
                            <span className="text-sm font-semibold">Escanea</span>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                        <div className="flex flex-col items-center gap-1">
                            <Handshake className="w-8 h-8" />
                            <span className="text-sm font-semibold">Autoriza</span>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                        <div className="flex flex-col items-center gap-1">
                            <Wallet className="w-8 h-8" />
                            <span className="text-sm font-semibold">Paga</span>
                        </div>
                    </div>

                     <div 
                        className="w-full border-b border-dashed border-gray-400 mb-4" 
                        style={{
                            borderStyle: 'dashed',
                            borderWidth: '0 0 2px 0',
                        }}
                     />
                    
                    <div className="text-lg font-semibold text-[#1E3A8A]">
                        <p>Caja: {boxName}</p>
                        <p>ID Negocio: {businessId}</p>
                    </div>
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
