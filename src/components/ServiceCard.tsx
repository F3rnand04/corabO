
"use client";

import type { Service } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCorabo } from "@/contexts/CoraboContext";
import { Star, Send, MessageCircle, MapPin, Bookmark, CheckCircle, Flag } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { useState } from "react";
import { ReportDialog } from "./ReportDialog";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';


interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { users, addContact, sendMessage } = useCorabo();
  const router = useRouter();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const provider = users.find(u => u.id === service.providerId);
  
  if (!provider) {
    return null; // or a fallback UI
  }

  const profileLink = `/companies/${provider.id}`;

  const handleSaveContact = () => {
    addContact(provider);
  };
  
  const handleDirectMessage = () => {
      const conversationId = sendMessage(provider.id, '', true);
      router.push(`/messages/${conversationId}`);
  };

  const isPromotionActive = provider.promotion && new Date(provider.promotion.expires) > new Date();

  const displayDistance = provider.profileSetupData?.showExactLocation ? "A menos de 1km" : "500m - 1km";


  return (
    <>
    <Card className="rounded-2xl overflow-hidden shadow-md">
      <CardContent className="p-0">
        <div className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary">
              <AvatarImage src={provider.profileImage} alt={provider.name} />
              <AvatarFallback className="text-xs">{provider.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                  <Link href={profileLink} passHref>
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <p className="font-bold text-base group-hover:underline">{provider.name}</p>
                        {provider.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary" onClick={handleSaveContact}>
                      <Bookmark className="w-5 h-5" />
                  </Button>
              </div>
              <p className="text-sm text-muted-foreground">Ofrece: {service.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-foreground">{provider.reputation}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span>99.9% Efec.</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-green-600 font-semibold">00-05 min</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <MapPin className={cn("w-5 h-5", provider.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
              <span className="text-xs font-semibold">{displayDistance}</span>
            </div>
          </div>
        </div>

        <div className="relative aspect-video w-full group">
          <Image src="https://placehold.co/600x400.png" alt={service.name} layout="fill" objectFit="cover" data-ai-hint="service person working"/>
          
           <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 left-2 z-10 text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsReportDialogOpen(true)}
            >
              <Flag className="w-4 h-4" />
            </Button>

          {isPromotionActive && provider.promotion && (
            <Badge variant="destructive" className="absolute top-2 right-2 bg-red-500 text-white shadow-lg">{provider.promotion.text}</Badge>
          )}
          <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2 text-white">
            <div className="flex flex-col items-center">
                <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                    <Star className="w-5 h-5" />
                </Button>
                <span className="text-xs font-bold mt-1 drop-shadow-md">4.5k</span>
            </div>
            <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                <span className="text-xs font-bold mt-1 drop-shadow-md">8.9k</span>
            </div>
              <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/40 rounded-full h-10 w-10">
                    <Send className="w-5 h-5" />
                  </Button>
                <span className="text-xs font-bold mt-1 drop-shadow-md">1.2k</span>
              </div>
          </div>
        </div>
        
        <div className="flex justify-around items-center border-t">
          <Button variant="ghost" className="flex-1 text-muted-foreground font-semibold text-sm rounded-none h-12" onClick={handleDirectMessage}>
            Mensaje
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Link href={profileLink} passHref className="flex-1">
            <Button variant="ghost" className="w-full text-muted-foreground font-semibold text-sm rounded-none h-12">
              Ver Perfil
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
     <ReportDialog 
        isOpen={isReportDialogOpen} 
        onOpenChange={setIsReportDialogOpen} 
        providerId={provider.id} 
        publicationId="serv1-img" 
      />
    </>
  );
}
