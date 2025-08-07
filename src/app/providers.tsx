
"use client";

import { CoraboProvider } from "@/contexts/CoraboContext";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <CoraboProvider>
        {children}
        <Toaster />
      </CoraboProvider>
    </NextThemesProvider>
  );
}
