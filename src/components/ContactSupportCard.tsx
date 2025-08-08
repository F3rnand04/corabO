"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Instagram } from "lucide-react";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

export function ContactSupportCard() {
    const { toast } = useToast();
    const contactEmail = "corabo.app@gmail.com";
    const contactPhone = "+584128978405";
    const whatsappNumber = "584128978405"; // Number without '+' for wa.me link
    const instagramUrl = "https://www.instagram.com/corabo.app?igsh=cGF2MXl0aGdyZ3hx";

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado', description: `El ${type} de contacto ha sido copiado.` });
    };

    return (
        <Card className="mt-12 bg-background">
            <CardHeader>
                <CardTitle>¿Tienes Preguntas?</CardTitle>
                <CardDescription>
                    Si tienes alguna duda sobre nuestras políticas o necesitas reportar un incidente, nuestro equipo de soporte está aquí para ayudarte.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild variant="outline" className="w-full justify-start">
                         <Link href={`mailto:${contactEmail}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            {contactEmail}
                         </Link>
                    </Button>
                     <Button asChild variant="outline" className="w-full justify-start">
                        <Link href={instagramUrl} target="_blank">
                            <Instagram className="mr-2 h-4 w-4" />
                            @corabo.app
                        </Link>
                    </Button>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild variant="outline" className="w-full justify-start">
                        <Link href={`https://wa.me/${whatsappNumber}`} target="_blank">
                            <Phone className="mr-2 h-4 w-4" />
                            {contactPhone} (Abrir Chat)
                        </Link>
                    </Button>
                 </div>
            </CardContent>
        </Card>
    );
}
