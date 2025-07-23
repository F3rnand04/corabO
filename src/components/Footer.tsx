"use client";

import { Home, PlayCircle, Search, MessageSquare, User } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { CategoryHub } from "./CategoryHub";
import { useState } from "react";

export function Footer() {
  const router = useRouter();
  const [isHubOpen, setIsHubOpen] = useState(false);

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <footer className="bg-background border-t sticky bottom-0 z-40">
      <div className="container flex justify-around h-16 items-center px-2">
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary" onClick={() => router.push('/')}>
          <Home className="h-6 w-6" />
          <span className="text-xs">Inicio</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground hover:text-primary">
          <PlayCircle className="h-6 w-6" />
           <span className="text-xs">Cómo se hace</span>
        </Button>
        
        <Dialog open={isHubOpen} onOpenChange={setIsHubOpen}>
        <DialogTrigger asChild>
            <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-lg -translate-y-4 bg-primary hover:bg-primary/90">
            <Search className="h-7 w-7" />
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md w-full bg-background/90 backdrop-blur-sm border-none shadow-2xl rounded-3xl">
            <CategoryHub onCategorySelect={() => setIsHubOpen(false)} />
        </DialogContent>
        </Dialog>

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
