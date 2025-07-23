"use client";

import { CoraboProvider } from "@/contexts/CoraboContext";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CoraboProvider>
      {children}
      <Toaster />
    </CoraboProvider>
  );
}
