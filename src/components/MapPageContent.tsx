'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

// This component is temporarily disabled for diagnostics.
export function MapPageContent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-muted">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Mapa temporalmente desactivado para diagnóstico...</p>
    </div>
  );
}
