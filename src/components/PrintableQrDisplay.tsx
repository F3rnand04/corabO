
'use client';

import { Button } from "./ui/button";
import Image from "next/image";
import { QrCode, Handshake, Wallet, Download, Loader2 } from "lucide-react";
import { AlertDialogFooter, AlertDialogCancel } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState } from "react";

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrDataURL: string | undefined;
    onClose: () => void;
}

export const PrintableQrDisplay = ({ boxName, businessId, qrDataURL, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    const downloadQR = useCallback(async () => {
        if (!qrDataURL) {
            toast({
                variant: "destructive",
                title: "Error de QR",
                description: "El código QR aún no se ha generado."
            });
            return;
        }

        setIsGenerating(true);
        toast({
            title: "Generando Imagen...",
            description: "Preparando tu código QR para la descarga."
        });

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error("No se pudo obtener el contexto del canvas");
            }

            const width = 320;
            const height = 480;
            canvas.width = width;
            canvas.height = height;

            // 1. Dibujar Fondo
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#e0f7fa'); // Cian claro
            gradient.addColorStop(1, '#e3f2fd'); // Azul claro
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Cargar y Dibujar Imagen QR
            const qrImg = new window.Image();
            qrImg.src = qrDataURL;
            await new Promise((resolve, reject) => {
                qrImg.onload = resolve;
                qrImg.onerror = reject;
            });
            
            // Dibuja un fondo blanco y un borde para el QR
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;
            ctx.fillRect((width - 200) / 2 - 10, 150 - 10, 220, 220);
            ctx.strokeRect((width - 200) / 2 - 10, 150 - 10, 220, 220);
            ctx.shadowColor = 'transparent'; // Resetear sombra
            
            // Dibuja la imagen del QR sobre el fondo blanco
            ctx.drawImage(qrImg, (width - 200) / 2, 150, 200, 200);

            // 3. Dibujar Textos (después del QR para que no se superpongan)
            ctx.fillStyle = '#0f172a'; // slate-900
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Paga a tu Ritmo con Corabo', width / 2, 70);

            // 4. Dibujar Textos del Pie de Página
            ctx.fillStyle = '#334155'; // slate-700
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`Caja: ${boxName}`, width / 2, height - 60);
            ctx.font = '14px monospace';
            ctx.fillText(`ID: ${businessId}`, width / 2, height - 35);
            
            // 5. Disparar Descarga
            const finalDataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = finalDataUrl;
            link.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onClose();

        } catch (error) {
            console.error('oops, algo salió mal!', error);
            toast({
                variant: "destructive",
                title: "Error de Descarga",
                description: "No se pudo generar la imagen. Por favor, intenta de nuevo."
            });
        } finally {
            setIsGenerating(false);
        }

    }, [qrDataURL, boxName, businessId, toast, onClose]);


    return (
        <div className="flex flex-col items-center gap-4">
            <div 
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
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                    {isGenerating ? 'Generando...' : 'Descargar PNG'}
                </Button>
            </AlertDialogFooter>
        </div>
    );
};
