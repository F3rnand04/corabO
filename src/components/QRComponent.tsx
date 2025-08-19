"use client";

import React from 'react';
import { useQRCode } from 'qrcode.react';

interface QRComponentProps {
  value: string;
}

const QRComponent = ({ value }: QRComponentProps) => {
  const {
    error,
    text = '',
  } = useQRCode({
    text: value,
    options: {
        level: 'H',
        margin: 1,
        width: 256,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    },
    imageSettings: {
        src: 'https://i.postimg.cc/Wz1MTvWK/lg.png',
        height: 48,
        width: 48,
        excavate: true,
    },
  });

  if (error) {
    console.error(error);
    return <div className="w-[256px] h-[256px] bg-red-100 flex items-center justify-center text-center text-red-700">Error al generar QR</div>;
  }
  
  if (!text) {
      return <div className="w-[256px] h-[256px] bg-gray-200 animate-pulse" />;
  }
  
  return <img src={text} alt="Código QR de Corabo" />;
};

export default QRComponent;
