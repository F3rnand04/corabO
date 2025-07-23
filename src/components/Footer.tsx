import { Home, Clapperboard, Search, MessageSquareText, User } from "lucide-react";
import { Button } from "./ui/button";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="container flex justify-around h-16 items-center px-2">
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground">
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground">
          <Clapperboard className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground">
          <Search className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground">
          <MessageSquareText className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1 text-muted-foreground">
          <User className="h-6 w-6" />
        </Button>
      </div>
    </footer>
  );
}
