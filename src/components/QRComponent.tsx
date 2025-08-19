
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
        imageSettings={{
            src: "https://i.postimg.cc/Wz1MTvWK/lg.png",
            height: 40,
            width: 40,
            excavate: true,
        }}
      />
    </div>
  );
};

export default QRComponent;
