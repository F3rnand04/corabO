
'use client';

import React from 'react';

// This component is temporarily disabled for diagnostics.
export function MapPageContent() {
  // A simple iframe-based map to avoid complex libraries during this critical fix.
  // Replace with a proper map library (like react-leaflet or @react-google-maps/api) later.
  const mapSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15694.00898514163!2d-66.8801946879883!3d10.49397652750691!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c2a59a7f3395965%3A0x28bedcf333758816!2sCaracas%2C%20Distrito%20Capital%2C%20Venezuela!5e0!3m2!1sen!2sus!4v1684343213872!5m2!1sen!2sus";
  
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-muted">
       <iframe
          src={mapSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de la ciudad"
       ></iframe>
    </div>
  );
}
