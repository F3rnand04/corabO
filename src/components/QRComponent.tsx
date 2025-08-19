
"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRComponentProps {
  value: string;
}

const QRComponent = ({ value }: QRComponentProps) => {
  return (
    <QRCodeSVG
      value={value}
      size={256}
      bgColor={"#ffffff"}
      fgColor={"#000000"}
      level={"L"}
      includeMargin={false}
    />
  );
};

export default QRComponent;
