
'use client';

import { Button } from "./ui/button";
import { Download, Loader2, QrCode, Handshake, Wallet, ArrowRight } from "lucide-react";
import { AlertDialogFooter, AlertDialogCancel } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState, useRef, useEffect } from "react";
import html2canvas from 'html2canvas';
import QRComponent from "./QRComponent"; 

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrValue: string;
    onClose: () => void;
}

// Custom hook to load an image as a base64 string
const useBase64Image = (src: string) => {
    const [base64, setBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            setBase64(dataURL);
            setIsLoading(false);
        };
        img.onerror = () => {
            setError("Failed to load image");
            setIsLoading(false);
        };
    }, [src]);

    return { base64, isLoading, error };
};


export const PrintableQrDisplay = ({ boxName, businessId, qrValue, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    
    const { base64: logoBase64, isLoading: isLogoLoading } = useBase64Image("https://i.postimg.cc/Wz1MTvWK/lg.png");

    const downloadQR = useCallback(() => {
        if (!printRef.current) {
            toast({ variant: "destructive", title: "Error", description: "No se puede encontrar el contenido para descargar." });
            return;
        }

        setIsDownloading(true);
        html2canvas(printRef.current, {
            useCORS: true,
            backgroundColor: null,
            logging: false,
            scale: 2 // Increase scale for better resolution
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
    
    const isLoading = isLogoLoading || isDownloading;

    return (
        <>
            {/* Hidden, fixed-size printable layout */}
            <div className="absolute -left-[9999px] top-0">
                 <div 
                    ref={printRef} 
                    className="bg-[#E3F2FD] p-12 rounded-2xl text-center flex flex-col justify-between" 
                    style={{ width: '825px', height: '1275px' }}
                >
                    <div className="flex-shrink-0 flex flex-col items-center justify-center pt-8">
                        <h2 className="text-3xl text-[#1E3A8A] mb-4">Escanea y paga a tu ritmo con</h2>
                        <div className="relative w-72 aspect-[3/1]">
                            {logoBase64 && <img src={logoBase64} alt="Corabo Logo" style={{objectFit: "contain", width: '100%', height: 'auto'}} />}
                        </div>
                    </div>
                    
                    <div className="flex justify-center items-center my-8 flex-grow">
                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <QRComponent value={qrValue} size={300} />
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 pb-8">
                         <h2 className="text-4xl font-bold text-[#1E3A8A] mt-4">Paga a tu Ritmo con Corabo</h2>
                         <p className="text-xl text-[#1E3A8A] mt-4">Descarga la App Corabo y únete a la comunidad de Óbiamigos</p>
                        <div className="flex justify-around items-center text-[#1E3A8A] my-12">
                            <div className="flex flex-col items-center gap-2">
                                <QrCode className="w-12 h-12" />
                                <span className="text-xl font-semibold">Escanea</span>
                            </div>
                            <ArrowRight className="w-10 h-10 text-gray-400" />
                            <div className="flex flex-col items-center gap-2">
                                <Handshake className="w-12 h-12" />
                                <span className="text-xl font-semibold">Autoriza</span>
                            </div>
                            <ArrowRight className="w-10 h-10 text-gray-400" />
                            <div className="flex flex-col items-center gap-2">
                                <Wallet className="w-12 h-12" />
                                <span className="text-xl font-semibold">Paga</span>
                            </div>
                        </div>

                        <div 
                            className="w-full border-b-4 border-dashed border-gray-400 my-8"
                        />
                        
                        <div className="text-2xl font-semibold text-[#1E3A8A]">
                            <p>Caja: {boxName}</p>
                            <p>ID Negocio: {businessId}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visible, responsive dialog content */}
            <div className="flex flex-col items-center gap-4 bg-background p-4 rounded-lg shadow-lg w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 h-64">
                       <Loader2 className="w-12 h-12 animate-spin text-primary" />
                       <p>Cargando diseño...</p>
                    </div>
                ) : (
                    <>
                        <h3 className="font-bold text-lg text-center">Vista Previa de Impresión</h3>
                        <div className="bg-[#E3F2FD] p-4 rounded-lg text-center w-full max-w-sm">
                             <h2 className="text-md font-semibold text-[#1E3A8A] mb-2">Escanea y paga a tu ritmo con</h2>
                             <div className="relative w-3/4 mx-auto mb-2 aspect-[3/1]">
                                {logoBase64 && <img src={logoBase64} alt="Corabo Logo" style={{objectFit: "contain", width: '100%', height: 'auto'}} />}
                            </div>
                            <div className="flex justify-center items-center my-4">
                                <div className="bg-white p-2 rounded-md shadow-sm">
                                    <QRComponent value={qrValue} />
                                </div>
                            </div>
                             <p className="text-xl font-bold text-[#1E3A8A] mt-2">Paga a tu Ritmo con Corabo</p>
                             <p className="text-xs text-[#1E3A8A] mt-1">Descarga la App Corabo y únete a la comunidad de Óbiamigos</p>
                             <div className="mt-4 pt-2 border-t border-blue-200 text-xs font-semibold text-[#1E3A8A]">
                                 <p>Caja: {boxName}</p>
                                 <p>ID Negocio: {businessId}</p>
                             </div>
                        </div>
                    </>
                )}
                 <AlertDialogFooter className="sm:justify-between w-full mt-4">
                    <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
                    <Button onClick={downloadQR} disabled={isLoading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isDownloading ? 'Generando...' : 'Descargar Media Carta'}
                    </Button>
                </AlertDialogFooter>
            </div>
        </>
    );
};
