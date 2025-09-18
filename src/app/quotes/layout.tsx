'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function QuotesHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold flex items-center gap-2">Solicitar una Cotización</h1>
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/30 min-h-screen">
       <QuotesHeader />
      <main className="container py-8 max-w-2xl mx-auto">
        {children}
      </main>
    </div>
  );
}
