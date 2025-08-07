
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText, Lock, Users } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function PoliciesHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Políticas de la Empresa</h1>
          <div className="w-8"></div>
        </div>
      </div>
    </header>
  );
}

const policies = [
    {
        icon: FileText,
        title: "Términos y Condiciones de Uso",
        content: "Al utilizar Corabo, aceptas nuestros términos que rigen tu acceso y uso de la plataforma. Eres responsable de tu conducta y contenido, y debes cumplir con todas las leyes aplicables. Nos reservamos el derecho de suspender o terminar cuentas que violen nuestros términos."
    },
    {
        icon: Lock,
        title: "Política de Privacidad",
        content: "Valoramos tu privacidad. Recopilamos información para operar y mejorar nuestros servicios, como datos de perfil y transacciones. No compartimos tu información personal con terceros sin tu consentimiento, excepto cuando sea requerido por ley. Utilizamos medidas de seguridad para proteger tus datos."
    },
    {
        icon: Users,
        title: "Normas de la Comunidad",
        content: "Fomentamos un ambiente de respeto y confianza. Se prohíbe el acoso, el discurso de odio, el spam y cualquier actividad ilegal. Las transacciones deben ser honestas y transparentes. Reporta cualquier comportamiento inadecuado para que podamos tomar acción."
    }
];

export default function PoliciesPage() {
  return (
    <>
      <PoliciesHeader />
      <main className="container max-w-4xl mx-auto py-8 space-y-8">
        <section className="text-center">
            <h2 className="text-3xl font-bold">Nuestro Compromiso con la Confianza y la Seguridad</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Estas son las directrices que aseguran que Corabo sea una comunidad segura, justa y confiable para todos.
            </p>
        </section>

        <Accordion type="single" collapsible className="w-full">
            {policies.map(policy => (
                <AccordionItem value={policy.title} key={policy.title}>
                    <AccordionTrigger className="text-lg font-semibold">
                       <div className="flex items-center gap-3">
                         <policy.icon className="h-5 w-5 text-primary" />
                         {policy.title}
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground pl-10">
                        {policy.content}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>

        <Card className="mt-12">
            <CardHeader>
                <CardTitle>¿Tienes Preguntas?</CardTitle>
                <CardDescription>
                    Si tienes alguna duda sobre nuestras políticas o necesitas reportar un incidente, nuestro equipo de soporte está aquí para ayudarte.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button>Contactar a Soporte</Button>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
