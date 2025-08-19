
'use client';

import { Button } from "./ui/button";
import { Download, Loader2, AlertTriangle, ScanLine, CreditCard, ShieldCheck } from "lucide-react";
import { AlertDialogFooter, AlertDialogCancel } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrDataURL: string | undefined;
    onClose: () => void;
}

const coraboLogoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAA8CAMAAAB1a982AAAAbFBMVEUAAAAA//8AnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwdouwAnuwAnuwAnuwAm+oAm+oAnuwAnuwAnuwAnuwAnuwAl+sAnuwAm+oAnuwAnuwAnuwAnuwAnuwAnuxKq/H///8i2fa2AAAAI3RSTlMAwEC/f3+AIGAwv78Q75AgYFC/QKAwUP+AYI/vP0DfcM+fVfHlAAAAA1hJREFUeNrt2kGOwkAQRFGICYgi4g7u/w7HCXSBgY5Tqa2t1V4n9g7A9wzDfnsCslxw4qLliIuWIy5ajrhocR8XLYdcNB1x0XTERctRlzIuWou4aLbiwMUl4sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFp3DhL3BxcYg4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4-gVwAAAABJRU5ErkJggg==";

export const PrintableQrDisplay = ({ boxName, businessId, qrDataURL, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    const drawCanvasContent = useCallback(async () => {
        if (!qrDataURL) {
            setError("El código QR para esta caja no está disponible.");
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                if (!src) {
                    reject(new Error("Image source is missing."));
                    return;
                }
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Fallo al cargar la imagen: ${src.substring(0, 30)}...`));
                img.src = src;
            });
        };

        try {
            setIsCanvasReady(false);
            setError(null);

            const [qrImg, logoImg] = await Promise.all([
                loadImage(qrDataURL),
                loadImage(coraboLogoBase64),
            ]);

            const width = 400;
            const height = 550;
            canvas.width = width;
            canvas.height = height;

            // Draw rounded rectangle background
            ctx.fillStyle = '#E3F2FD'; // Light blue
            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.arcTo(0, 0, 20, 0, 20);
            ctx.lineTo(width - 20, 0);
            ctx.arcTo(width, 0, width, 20, 20);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();

            // Draw Logo
            const logoAspectRatio = logoImg.width / logoImg.height;
            const logoWidth = 150;
            const logoHeight = logoWidth / logoAspectRatio;
            ctx.drawImage(logoImg, (width - logoWidth) / 2, 30, logoWidth, logoHeight);

            // Draw Title
            ctx.fillStyle = '#1E3A8A'; // Dark blue text
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paga a tu Ritmo con Corabo', width / 2, 140);

            // Draw QR Code in a white rounded box
            const qrSize = 240;
            const qrContainerX = (width - qrSize) / 2;
            const qrContainerY = 170;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(qrContainerX, qrContainerY, qrSize, qrSize, 20);
            ctx.fill();
            ctx.drawImage(qrImg, qrContainerX + 20, qrContainerY + 20, qrSize - 40, qrSize - 40);
            
            // Draw Footer
            ctx.fillStyle = '#1E3A8A';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`${boxName}`, width / 2, height - 60);
            ctx.font = '14px Arial';
            ctx.fillText(`ID Negocio: ${businessId}`, width / 2, height - 35);
            
            setIsCanvasReady(true);
        } catch (e: any) {
            console.error("Error al dibujar el canvas:", e);
            setError(e.message || "No se pudieron cargar las imágenes para el QR.");
            setIsCanvasReady(false);
        }
    }, [qrDataURL, boxName, businessId]);

    useEffect(() => {
        drawCanvasContent();
    }, [drawCanvasContent]);
    
    const downloadQR = useCallback(() => {
        if (!isCanvasReady || error) {
            toast({ variant: "destructive", title: "Error", description: "El canvas no está listo o contiene errores." });
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsDownloading(true);
        try {
            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Descarga Iniciada", description: "Tu código QR se está descargando." });
        } catch (e) {
            console.error("Error al descargar el canvas:", e);
            toast({ variant: "destructive", title: "Error de Descarga", description: "No se pudo generar el PNG." });
        } finally {
            setIsDownloading(false);
            onClose();
        }
    }, [boxName, onClose, toast, error, isCanvasReady]);

    return (
        <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-lg shadow-lg">
            <canvas ref={canvasRef} className={cn("w-full max-w-[300px] border rounded-md", !isCanvasReady && 'hidden')} />
            
            {!isCanvasReady && !error && (
                 <div className="w-full h-[450px] flex flex-col items-center justify-center bg-muted/50 rounded-md">
                     <Loader2 className="w-12 h-12 animate-spin text-primary"/>
                     <p className="mt-4 text-sm text-muted-foreground">Generando previsualización...</p>
                 </div>
             )}

            {error && (
                <div className="w-full h-[450px] flex flex-col items-center justify-center bg-red-50 text-destructive border border-destructive rounded-md p-4">
                    <AlertTriangle className="w-12 h-12 mb-4" />
                    <h3 className="font-bold">Error de imagen</h3>
                    <p className="text-sm text-center">{error}</p>
                </div>
            )}

            <AlertDialogFooter className="sm:justify-between w-full mt-4">
                <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
                <Button onClick={downloadQR} disabled={isDownloading || !isCanvasReady || !!error}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isDownloading ? 'Generando...' : 'Descargar PNG'}
                </Button>
            </AlertDialogFooter>
        </div>
    );
};
