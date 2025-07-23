
"use client";

import type { Service } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCorabo } from "@/contexts/CoraboContext";
import { Star, Send } from "lucide-react";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { requestService, users, currentUser } = useCorabo();
  const provider = users.find(u => u.id === service.providerId);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{service.name}</CardTitle>
        <CardDescription className="pt-2">{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
         <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Ofrecido por {provider?.name}</span>
             <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{provider?.reputation}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        {currentUser.type === 'client' && (
          <Button onClick={() => requestService(service)} className="w-full">
            <Send className="mr-2 h-4 w-4" /> Solicitar Servicio
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
