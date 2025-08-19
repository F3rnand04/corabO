
'use client';

import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { ShoppingCart, RefreshCw, HandCoins, Download } from "lucide-react";

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrValue: string;
}

export const PrintableQrDisplay = ({ boxName, businessId, qrValue }: PrintableQrDisplayProps) => {

    const downloadQR = () => {
        const printableArea = document.getElementById('printable-qr-area');
        if (printableArea) {
            // Temporarily disable shadows for cleaner image
            printableArea.style.boxShadow = 'none';

            import('html2canvas').then(html2canvas => {
                html2canvas(printableArea, { scale: 3 }).then(canvas => {
                    const pngFile = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                    
                    // Restore shadow after capture
                    printableArea.style.boxShadow = '';
                });
            });
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div 
                id="printable-qr-area"
                className="w-[320px] p-6 bg-yellow-400 rounded-3xl shadow-lg font-sans text-center relative overflow-hidden"
            >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 rounded-full"></div>
                <div className="absolute -bottom-16 -left-8 w-40 h-40 bg-white/20 rounded-full"></div>

                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-black mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                        Compra ahora, paga después
                    </h2>

                    <div className="bg-white p-4 rounded-xl shadow-md inline-block my-4">
                        <QRCodeSVG
                            value={qrValue}
                            size={180}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"H"}
                            includeMargin={false}
                            imageSettings={{
                                src: "https://i.postimg.cc/8zWvkhxS/Sin-t-tulo-3.png",
                                height: 40,
                                width: 60,
                                excavate: true,
                            }}
                        />
                    </div>
                    
                    <div className="flex justify-center my-4">
                        <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" width={140} height={40} />
                    </div>

                    <div className="flex justify-around items-center text-black/80 my-4">
                        <div className="flex flex-col items-center gap-1">
                            <ShoppingCart className="w-7 h-7" />
                            <p className="text-xs font-semibold">Carrito</p>
                        </div>
                        <div className="text-2xl font-light text-black/50">&rarr;</div>
                        <div className="flex flex-col items-center gap-1">
                            <RefreshCw className="w-7 h-7" />
                            <p className="text-xs font-semibold">Corabo</p>
                        </div>
                        <div className="text-2xl font-light text-black/50">&rarr;</div>
                        <div className="flex flex-col items-center gap-1">
                            <HandCoins className="w-7 h-7" />
                             <p className="text-xs font-semibold">Paga</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-black/20 text-black font-medium text-sm">
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
