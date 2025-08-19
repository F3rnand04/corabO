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
        scale: 8,
        width: 256,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    },
  });

  if (error) {
    console.error(error);
    return <p>No se pudo generar el QR.</p>;
  }

  // Render the QR code as a standard image tag using the generated data URL
  return <img src={text} alt="Código QR" />;
};

export default QRComponent;
