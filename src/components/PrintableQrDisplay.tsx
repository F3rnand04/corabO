'use client';

import { Button } from "./ui/button";
import Image from "next/image";
import { QrCode, Handshake, Wallet, Download, Loader2 } from "lucide-react";
import { AlertDialogFooter, AlertDialogCancel } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";


interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrDataURL: string | undefined; // Can be undefined initially
    onClose: () => void;
}

export const PrintableQrDisplay = ({ boxName, businessId, qrDataURL, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const printableRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const downloadQR = async () => {
        const element = printableRef.current;
        if (!element || isGenerating) return;

        setIsGenerating(true);
        toast({
          title: "Generando Imagen...",
          description: "Preparando tu código QR para la descarga."
        });

        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(element, {
                scale: 3, 
                backgroundColor: null, // Transparent background
                useCORS: true,
            });

            // Convert canvas to Blob
            canvas.toBlob(function(blob) {
                if (!blob) {
                    toast({
                        variant: "destructive",
                        title: "Error de Descarga",
                        description: "No se pudo generar el archivo de imagen (blob)."
                    });
                    setIsGenerating(false);
                    return;
                }
                
                // Use File System Access API or fallback to anchor download
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement("a");
                downloadLink.href = url;
                downloadLink.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
                
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                URL.revokeObjectURL(url); // Clean up
                onClose();
            }, 'image/png');

        } catch (error) {
            console.error("Error downloading QR:", error);
            toast({
                variant: "destructive",
                title: "Error de Descarga",
                description: "No se pudo generar la imagen para descargar. Por favor, intenta de nuevo."
            });
        } finally {
            // The setIsGenerating(false) will be called after the blob is processed.
            // We set a timeout as a fallback.
            setTimeout(() => setIsGenerating(false), 3000);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div 
                ref={printableRef}
                className="w-[320px] p-6 bg-blue-100 dark:bg-blue-900/30 rounded-3xl shadow-lg font-sans text-center relative overflow-hidden"
            >
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 dark:bg-blue-800/20 rounded-full"></div>
                <div className="absolute -bottom-16 -left-8 w-40 h-40 bg-white/20 dark:bg-blue-800/20 rounded-full"></div>

                <div className="relative z-10">
                     <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" width={240} height={90} className="mx-auto h-24 w-auto mb-2" />
                     <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                        Paga a tu Ritmo con Corabo
                    </h2>

                    <div className="bg-white p-4 rounded-xl shadow-md inline-block my-4">
                        {qrDataURL ? (
                           <Image src={qrDataURL} alt="Código QR" width={180} height={180} />
                        ) : (
                           <div className="w-[180px] h-[180px] flex flex-col items-center justify-center bg-gray-200 rounded-lg text-xs text-gray-500">
                             <Loader2 className="animate-spin h-8 w-8 mb-2"/>
                             <p>Generando QR...</p>
                           </div>
                        )}
                    </div>
                    
                    <div className="flex justify-around items-center text-slate-700 dark:text-slate-300 my-4">
                        <div className="flex flex-col items-center gap-1">
                            <QrCode className="w-7 h-7" />
                            <p className="text-xs font-semibold">Escanea</p>
                        </div>
                        <div className="text-2xl font-light text-slate-400 dark:text-slate-600">&rarr;</div>
                        <div className="flex flex-col items-center gap-1">
                            <Handshake className="w-7 h-7" />
                            <p className="text-xs font-semibold">Autoriza</p>
                        </div>
                        <div className="text-2xl font-light text-slate-400 dark:text-slate-600">&rarr;</div>
                        <div className="flex flex-col items-center gap-1">
                            <Wallet className="w-7 h-7" />
                             <p className="text-xs font-semibold">Paga</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-black/20 dark:border-white/20 text-slate-800 dark:text-slate-200 font-medium text-sm">
                        <p>Caja: {boxName}</p>
                        <p>ID Negocio: {businessId}</p>
                    </div>
                </div>
            </div>
            <AlertDialogFooter className="sm:justify-between w-full px-6 pb-2">
                 <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
                 <Button onClick={downloadQR} disabled={isGenerating || !qrDataURL}>
                    <Download className="mr-2 h-4 w-4"/>
                    {isGenerating ? 'Generando...' : 'Descargar PNG'}
                </Button>
            </AlertDialogFooter>
        </div>
    );
};
