
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

const coraboLogoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAA8CAMAAAB1a982AAAAbFBMVEUAAAAA//8AnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwdouwAnuwAnuwAnuwAm+oAm+oAnuwAnuwAnuwAnuwAnuwAl+sAnuwAm+oAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuxKq/H///8i2fa2AAAAI3RSTlMAwEC/f3+AIGAwv78Q75AgYFC/QKAwUP+AYI/vP0DfcM+fVfHlAAAAA1hJREFUeNrt2kGOwkAQRFGICYgi4g7u/w7HCXSBgY5Tqa2t1V4n9g7A9wzDfnsCslxw4qLliIuWIy5ajrhocR8XLYdcNB1x0XTERctRlzIuWou4aLbiwMUl4sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFp3DhL3BxcYg4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4-gVwAAAABJRU5ErkJggg==";

// Base64 encoded SVGs for icons to prevent CORS issues with canvas
const scanIconBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTNBOEEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1zY2FuLWxpbmUiPjxwYXRoIGQ9Ik0zIDdhOWE0LjUgNC41IDAgMCAxIDAtOSIgLz48cGF0aCBkPSJNMyAxN2E5IDkgMCAwIDAgMCA5IiAvPjxwYXRoIGQ9Ik0yMSA3YTkgOSAwIDAgMCAwLTkiIC8+PHBhdGggZD0iTTIxIDE3YTkgOSAwIDAgMSAwIDkiIC8+PHBhdGggZD0iTTcgOWg5IiAvPjxwYXRoIGQ9Ik04IDEybDcgMCIgLz48cGF0aCBkPSJNNyAxNWg4IiAvPjwvc3ZnPg==";
const authIconBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTNBOEEiIHN0cm9lZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1zaGllbGQtY2hlY2siPjxwYXRoIGQ9Ik0xMiAyMHM4LTQgOC0xMFY1TDEyIDJsLTggM3Y2YzAgNiA4IDEwIDggMTBaIiAvPjxwYXRoIGQ9Im05IDEyIDIgMiA0LTQiIC8+PC9zdmc+";
const payIconBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTNBOEEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1jcmVkaXQtY2FyZCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjE0IiB4PSIyIiB5PSI1IiByeD0iMiIgLz48bGluZSB4MT0iMiIgeDI9IjIyIiB5MT0iMTAiIHkyPSIxMCIgLz48L3N2Zz4=";


export const PrintableQrDisplay = ({ boxName, businessId, qrDataURL, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    const drawCanvasContent = useCallback(async () => {
        if (!qrDataURL) {
            setError("La información del código QR no está disponible.");
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Fallo al cargar la imagen: ${src.substring(0, 50)}...`));
                img.src = src;
            });
        };

        try {
            setError(null);
            setIsCanvasReady(false);
            
            const [qrImg, logoImg, scanImg, authImg, payImg] = await Promise.all([
                loadImage(qrDataURL),
                loadImage(coraboLogoBase64),
                loadImage(scanIconBase64),
                loadImage(authIconBase64),
                loadImage(payIconBase64)
            ]);

            const width = 400;
            const height = 600;
            canvas.width = width;
            canvas.height = height;

            // Background with rounded top corners
            ctx.fillStyle = '#E3F2FD'; // Light blue background
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(0, 20);
            ctx.quadraticCurveTo(0, 0, 20, 0);
            ctx.lineTo(width - 20, 0);
            ctx.quadraticCurveTo(width, 0, width, 20);
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();

            // Logo
            const logoAspectRatio = logoImg.width / logoImg.height;
            const logoWidth = 150;
            const logoHeight = logoWidth / logoAspectRatio;
            ctx.drawImage(logoImg, (width - logoWidth) / 2, 20, logoWidth, logoHeight);

            // Title
            ctx.fillStyle = '#1E3A8A'; // Dark blue text
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paga a tu Ritmo con Corabo', width / 2, 120);
            
            // QR Code
            const qrSize = 240;
            ctx.drawImage(qrImg, (width - qrSize) / 2, 150, qrSize, qrSize);
            
            // Steps
            const stepY = 440;
            const iconSize = 30;
            const stepGap = 120;
            const startX = (width - (stepGap * 2)) / 2;

            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(startX + iconSize / 2, stepY + iconSize / 2);
            ctx.lineTo(startX + stepGap - iconSize / 2, stepY + iconSize / 2);
            ctx.moveTo(startX + stepGap + iconSize / 2, stepY + iconSize / 2);
            ctx.lineTo(startX + 2 * stepGap - iconSize / 2, stepY + iconSize / 2);
            ctx.strokeStyle = '#90A4AE';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
            
            const steps = [
                { icon: scanImg, text: 'Escanear' },
                { icon: authImg, text: 'Autorizar' },
                { icon: payImg, text: 'Pagar' },
            ];
            
            ctx.font = 'bold 12px Arial';
            steps.forEach((step, i) => {
                 const x = startX + i * stepGap - iconSize / 2;
                 ctx.drawImage(step.icon, x, stepY, iconSize, iconSize);
                 ctx.fillText(step.text, x + iconSize/2, stepY + iconSize + 15);
            });


            // Footer
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
            toast({ variant: "destructive", title: "Error", description: "La imagen no está lista o contiene errores." });
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
