
"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRComponentProps {
  value: string;
  size?: number;
}

const QRComponent = ({ value, size = 128 }: QRComponentProps) => {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor={"#ffffff"}
      fgColor={"#000000"}
      level={"L"}
      includeMargin={false}
    />
  );
};

export default QRComponent;
