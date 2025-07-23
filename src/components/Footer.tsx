"use client";

import { Home, PlayCircle, Search, MessageSquare, User } from "lucide-react";
import { Button } from "./ui/button";
import { useCorabo } from "@/contexts/CoraboContext";
import { useRouter } from "next/navigation";

export function Footer() {
  const router = useRouter();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="container flex justify-around h-16 items-center px-2">
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary" onClick={() => router.push('/')}>
          <Home className="h-6 w-6" />
          <span className="text-xs">Inicio</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
          <PlayCircle className="h-6 w-6" />
           <span className="text-xs">Cómo se hace</span>
        </Button>
        <Button variant="default" size="icon" className="h-12 w-12 rounded-full shadow-lg -translate-y-2" onClick={() => router.push('/services')}>
          <Search className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
          <MessageSquare className="h-6 w-6" />
           <span className="text-xs">Mensajes</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary" onClick={() => router.push('/products')}>
          <User className="h-6 w-6" />
          <span className="text-xs">Perfil</span>
        </Button>
      </div>
    </footer>
  );
}