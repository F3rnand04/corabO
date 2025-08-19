
'use client';

import { Button } from "./ui/button";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";
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
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadQR = useCallback(() => {
        if (!qrDataURL) {
            toast({
                variant: "destructive",
                title: "Error de QR",
                description: "El código QR aún no está disponible para descargar."
            });
            return;
        }

        setIsDownloading(true);
        try {
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = qrDataURL;
            link.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
            
            // Append to the document, click, and then remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
                title: "Descarga Iniciada",
                description: "Tu código QR se está descargando."
            });
            onClose(); // Close the dialog after initiating download
        } catch (error) {
            console.error('Error al descargar el QR:', error);
            toast({
                variant: "destructive",
                title: "Error de Descarga",
                description: "No se pudo iniciar la descarga. Inténtalo de nuevo."
            });
        } finally {
            setIsDownloading(false);
        }
    }, [qrDataURL, boxName, toast, onClose]);

    return (
        <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-lg shadow-lg">
            <div className="text-center">
                <h3 className="font-bold text-lg">QR para Caja: {boxName}</h3>
                <p className="text-sm text-muted-foreground">ID Negocio: {businessId}</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md inline-block">
                {qrDataURL ? (
                    <Image src={qrDataURL} alt={`Código QR para ${boxName}`} width={220} height={220} />
                ) : (
                    <div className="w-[220px] h-[220px] flex flex-col items-center justify-center bg-gray-200 rounded-lg text-xs text-gray-500">
                        <Loader2 className="animate-spin h-8 w-8 mb-2" />
                        <p>Generando QR...</p>
                    </div>
                )}
            </div>
            
            <AlertDialogFooter className="sm:justify-between w-full">
                 <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
                 <Button onClick={downloadQR} disabled={isDownloading || !qrDataURL}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isDownloading ? 'Descargando...' : 'Descargar PNG'}
                </Button>
            </AlertDialogFooter>
        </div>
    );
};
