
'use client';

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function TransactionsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold">Registro de Transacciones</h1>
                <div className="w-10"></div>
                </div>
            </div>
        </header>
    );
}

export default function TransactionsPage() {
    return (
        <>
            <TransactionsHeader />
            <main className="container py-8">
                <p className="text-muted-foreground text-center">Esta página está en construcción.</p>
            </main>
        </>
    );
}
