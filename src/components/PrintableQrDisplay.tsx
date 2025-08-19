
'use client';

import { Button } from "./ui/button";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { QrCode, Handshake, Wallet, Download } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import html2canvas only on the client side
const html2canvas = dynamic(() => import('html2canvas'), { ssr: false });

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrValue: string;
}

export const PrintableQrDisplay = ({ boxName, businessId, qrValue }: PrintableQrDisplayProps) => {

    const downloadQR = async () => {
        const printableArea = document.getElementById('printable-qr-area');
        if (printableArea) {
            // Ensure html2canvas is loaded before using it
            const canvas = await (await import('html2canvas')).default(printableArea, { scale: 3, backgroundColor: null });

            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div 
                id="printable-qr-area"
                className="w-[320px] p-6 bg-blue-100 dark:bg-blue-900/30 rounded-3xl shadow-lg font-sans text-center relative overflow-hidden"
            >
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 dark:bg-blue-800/20 rounded-full"></div>
                <div className="absolute -bottom-16 -left-8 w-40 h-40 bg-white/20 dark:bg-blue-800/20 rounded-full"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-2">
                        <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" width={140} height={40} />
                    </div>
                    <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                        Paga a tu Ritmo con Corabo
                    </h2>

                    <div className="bg-white p-4 rounded-xl shadow-md inline-block my-4">
                        <QRCodeSVG
                            value={qrValue}
                            size={180}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"H"}
                            includeMargin={false}
                        />
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
            <Button onClick={downloadQR}>
                <Download className="mr-2 h-4 w-4"/>
                Descargar PNG
            </Button>
        </div>
    );
};
