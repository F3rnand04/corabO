'use client';

import { Dialog, DialogContent } from "./ui/dialog";
import { QRCodeSVG } from 'qrcode.react';
import { Button } from "./ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import CoraboLogo from "./CoraboLogo";

interface PersonalQrDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PersonalQrDialog({ isOpen, onOpenChange }: PersonalQrDialogProps) {
    const { currentUser } = useAuth();
    const { toast } = useToast();

    if (!currentUser || !currentUser.coraboId) {
        return null;
    }

    const qrValue = JSON.stringify({ providerId: currentUser.id });
    const manualCode = currentUser.coraboId;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(manualCode);
        toast({ title: 'Copiado', description: 'Tu ID de Corabo ha sido copiado.' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <div className="flex flex-col items-center justify-center p-6 bg-background rounded-lg text-center space-y-4">
                     <CoraboLogo className="h-10 text-foreground mb-2" />
                    <h2 className="text-xl font-semibold">Muestra este código para recibir pagos</h2>
                    <div className="bg-white p-4 rounded-lg shadow-inner inline-block">
                        <QRCodeSVG 
                            value={qrValue} 
                            size={180}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"L"}
                            includeMargin={false}
                        />
                    </div>
                    <div className="text-center w-full">
                        <p className="text-sm text-muted-foreground">Si el escaneo falla, usa el ID:</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <p className="text-xl font-bold font-mono tracking-widest">{manualCode}</p>
                            <Button variant="ghost" size="icon" onClick={handleCopyCode} className="text-muted-foreground hover:text-foreground">
                                <Copy className="w-5 h-5"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
