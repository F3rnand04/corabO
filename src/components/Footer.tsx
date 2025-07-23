"use client";

import { Home, PlayCircle, Search, MessageSquare, User } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useCorabo } from "@/contexts/CoraboContext";

export function Footer() {
  const router = useRouter();
  const { currentUser } = useCorabo();

  const handleProfileClick = () => {
    // This is a placeholder. In a real app, you'd have a dedicated profile page.
    // For now, it will go to the products page.
    router.push('/products'); 
  };

  return (
    <footer className="bg-background border-t">
      <div className="container flex justify-around h-16 items-center px-2">
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary" onClick={() => router.push('/')}>
          <Home className="h-6 w-6" />
          <span className="text-xs">Inicio</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
          <PlayCircle className="h-6 w-6" />
           <span className="text-xs">Cómo se hace</span>
        </Button>
        <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-lg -translate-y-4 bg-primary hover:bg-primary/90">
          <Search className="h-7 w-7" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
          <MessageSquare className="h-6 w-6" />
           <span className="text-xs">Mensajes</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary" onClick={handleProfileClick}>
          <User className="h-6 w-6" />
          <span className="text-xs">Perfil</span>
        </Button>
      </div>
    </footer>
  );
}
