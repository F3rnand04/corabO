
'use client';

import { Button } from "./ui/button";
import { Download, Loader2, AlertTriangle } from "lucide-react";
import { AlertDialogFooter, AlertDialogCancel } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrDataURL: string | undefined;
    onClose: () => void;
}

// Hardcoded base64 logo to prevent CORS issues and ensure availability.
const coraboLogoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAA8CAMAAAB1a982AAAAbFBMVEUAAAAA//8AnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwdouwAnuwAnuwAnuwAm+oAm+oAnuwAnuwAnuwAnuwAnuwAl+sAnuwAm+oAnuwAnuwAnuwAnuwAnuxKq/H///8i2fa2AAAAI3RSTlMAwEC/f3+AIGAwv78Q75AgYFC/QKAwUP+AYI/vP0DfcM+fVfHlAAAAA1hJREFUeNrt2kGOwkAQRFGICYgi4g7u/w7HCXSBgY5Tqa2t1V4n9g7A9wzDfnsCslxw4qLliIuWIy5ajrhocR8XLYdcNB1x0XTERctRlzIuWou4aLbiwMUl4sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFp3DhL3BxcYg4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4acHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4c-gVwAAAABJRU5ErkJggg==";

const scanIconBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTNBOEEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1zY2FuLWxpbmUiPjxwYXRoIGQ9Ik0zIDcgVjVhMiAyIDAgMCAxIDItMmgxNGExIDEgMCAwIDEgMSAxdjE0YTIgMiAwIDAgMS0yIDJoLTQiLz48cGF0aCBkPSJtNyAxMkgxNSIvPjwvc3ZnPg==";
const authorizeIconBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTNBOEEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1maW5nZXJwcmludCI+PHBhdGggZD0iTTIgMTJmNGE0IDQgMCAwIDAgNC00aDdhMSAxIDAgMCAwIDEtMVY2YTEgMSAwIDAgMC0xLTFoLTdhNCA0IDAgMCAwLTMuNDUgNS44NSIvPjxwYXRoIGQ9Ik0xMiAxMHY2YTIgMiAwIDAgMCAyIDJoMiIvPjxwYXRoIGQ9Ik0xMiAxNnYyYTEgMSAwIDAgMCAxIDFIMTciLz48cGF0aCBkPSJNOEAMnDYiLz48cGF0aCBkPSJNNiA0YzEuMSAwIDIgLjkgMiAyIDAgMS4xLS45IDItMiAyYTIgMiAwIDEgMSAwLTRoMiIvPjxwYXRoIGQ9Ik0xOCA3YTIgMiAwIDAgMCAyIDIiLz48L3N2Zz4=";
const payIconBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTNBOEEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1kb2xsYXItc2lnbiI+PHBhdGggZD0iTTEyIDEydjBhNiA2IDAgMCAwIDYtNmgtNi02djZhNiA2IDAgMCAxLTYgNnoiLz48cGF0aCBkPSJNNCA2djEyIi8+PHBhdGggZD0iTTIxIDEydjBhNiA2IDAgMCAxLTYgNmgtNi02djZhNiA2IDAgMCAwIDYtNnoiLz48L3N2Zz4=";


export const PrintableQrDisplay = ({ boxName, businessId, qrDataURL, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    const drawCanvasContent = useCallback(async () => {
        setIsCanvasReady(false);
        setError(null);

        if (!qrDataURL) {
            setError("El código QR no está disponible.");
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                if (!src) {
                    reject(new Error("Image source is invalid or missing."));
                    return;
                }
                const img = new Image();
                img.crossOrigin = "anonymous"; 
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(new Error(`Fallo al cargar la imagen: ${err.toString()}`));
                img.src = src;
            });
        };

        try {
            const [qrImg, logoImg, scanIconImg, authorizeIconImg, payIconImg] = await Promise.all([
                loadImage(qrDataURL),
                loadImage(coraboLogoBase64),
                loadImage(scanIconBase64),
                loadImage(authorizeIconBase64),
                loadImage(payIconBase64),
            ]);
            
            const width = 400;
            const height = 600; 
            canvas.width = width;
            canvas.height = height;

            // Draw rounded rectangle background
            ctx.fillStyle = '#E3F2FD'; // Light blue
            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.arcTo(0, 0, 20, 0, 20);
            ctx.lineTo(width - 20, 0);
            ctx.arcTo(width, 0, width, 20, 20);
            ctx.lineTo(width, height - 20);
            ctx.arcTo(width, height, width - 20, height, 20);
            ctx.lineTo(20, height);
            ctx.arcTo(0, height, 0, height - 20, 20);
            ctx.closePath();
            ctx.fill();

            // Draw Logo
            const logoAspectRatio = logoImg.width / logoImg.height;
            const logoWidth = 150;
            const logoHeight = logoWidth / logoAspectRatio;
            ctx.drawImage(logoImg, (width - logoWidth) / 2, 30, logoWidth, logoHeight);
            
            // Draw Headline
            ctx.fillStyle = '#1E3A8A'; // Dark blue text
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paga a tu Ritmo con Corabo', width / 2, 140);
            
            // Draw white container for QR
            ctx.fillStyle = '#FFFFFF';
            const qrContainerX = (width - 240) / 2;
            const qrContainerY = 170;
            const qrContainerWidth = 240;
            const qrContainerHeight = 240;
            ctx.beginPath();
            ctx.moveTo(qrContainerX + 20, qrContainerY);
            ctx.lineTo(qrContainerX + qrContainerWidth - 20, qrContainerY);
            ctx.arcTo(qrContainerX + qrContainerWidth, qrContainerY, qrContainerX + qrContainerWidth, qrContainerY + 20, 20);
            ctx.lineTo(qrContainerX + qrContainerWidth, qrContainerY + qrContainerHeight - 20);
            ctx.arcTo(qrContainerX + qrContainerWidth, qrContainerY + qrContainerHeight, qrContainerX + qrContainerWidth - 20, qrContainerY + qrContainerHeight, 20);
            ctx.lineTo(qrContainerX + 20, qrContainerY + qrContainerHeight);
            ctx.arcTo(qrContainerX, qrContainerY + qrContainerHeight, qrContainerX, qrContainerY + qrContainerHeight - 20, 20);
            ctx.lineTo(qrContainerX, qrContainerY + 20);
            ctx.arcTo(qrContainerX, qrContainerY, qrContainerX + 20, qrContainerY, 20);
            ctx.closePath();
            ctx.fill();

            // Draw QR Code
            ctx.drawImage(qrImg, (width - 200) / 2, 190, 200, 200);

            // Draw instructional flow
            const flowY = 460;
            const iconSize = 40;
            const iconY = flowY - (iconSize / 2);
            const textY = flowY + (iconSize / 2) + 15;
            
            ctx.drawImage(scanIconImg, 60, iconY, iconSize, iconSize);
            ctx.drawImage(authorizeIconImg, 180, iconY, iconSize, iconSize);
            ctx.drawImage(payIconImg, 300, iconY, iconSize, iconSize);
            
            ctx.fillStyle = '#1E3A8A';
            ctx.font = '14px Arial';
            ctx.fillText('Escanea', 80, textY);
            ctx.fillText('Autoriza', 200, textY);
            ctx.fillText('Paga', 320, textY);
            
            // Dashed line
            ctx.beginPath();
            ctx.strokeStyle = '#93C5FD'; // blue-300
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.moveTo(110, flowY);
            ctx.lineTo(170, flowY);
            ctx.moveTo(230, flowY);
            ctx.lineTo(290, flowY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineWidth = 1;
            
            // Draw Footer Texts
            ctx.fillStyle = '#1E3A8A';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`Caja: ${boxName}`, width / 2, height - 50);
            ctx.font = '14px Arial';
            ctx.fillText(`ID Negocio: ${businessId}`, width / 2, height - 30);
            
            setIsCanvasReady(true);
        } catch (e: any) {
            console.error("Error al dibujar el canvas:", e);
            setError("No se pudieron cargar las imágenes para el QR.");
        }
    }, [qrDataURL, boxName, businessId]);

    useEffect(() => {
        // Trigger drawing only when the component is mounted and has the necessary data.
        if (qrDataURL) {
            drawCanvasContent();
        }
    }, [qrDataURL, drawCanvasContent]);
    
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
            {error && !isCanvasReady && (
                <div className="w-full h-[450px] flex flex-col items-center justify-center bg-red-50 text-destructive border border-destructive rounded-md p-4">
                    <AlertTriangle className="w-12 h-12 mb-4" />
                    <h3 className="font-bold">Error de imagen</h3>
                    <p className="text-sm text-center">{error}</p>
                </div>
            )}
            
            <canvas ref={canvasRef} className={cn("w-full max-w-[300px] border rounded-md", !isCanvasReady && 'hidden')} />
            
             {!isCanvasReady && !error && (
                 <div className="w-full h-[450px] flex flex-col items-center justify-center bg-muted/50 rounded-md">
                     <Loader2 className="w-12 h-12 animate-spin text-primary"/>
                     <p className="mt-4 text-sm text-muted-foreground">Generando previsualización...</p>
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
