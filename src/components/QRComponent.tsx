"use client";

import React from 'react';
import QRCode from 'qrcode.react';

interface QRComponentProps {
  value: string;
}

const QRComponent = ({ value }: QRComponentProps) => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', display: 'inline-block', borderRadius: '16px' }}>
      <QRCode 
        value={value} 
        size={256}
        level={"H"}
        includeMargin={true}
      />
    </div>
  );
};

export default QRComponent;
