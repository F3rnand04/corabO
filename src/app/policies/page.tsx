
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileText, Gavel, ShieldCheck, Users } from 'lucide-react';
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
          <h1 className="text-xl font-bold">Políticas y Documentos</h1>
          <div className="w-8"></div>
        </div>
      </div>
    </header>
  );
}

const policySections = [
    {
        icon: Gavel,
        title: "Términos y Condiciones de Uso",
        description: "Las reglas que rigen el uso de nuestra plataforma, tus derechos y obligaciones.",
        href: "/terms"
    },
    {
        icon: ShieldCheck,
        title: "Política de Privacidad",
        description: "Cómo recopilamos, usamos y protegemos tu información personal.",
        href: "/privacy"
    },
    {
        icon: Users,
        title: "Normas de la Comunidad",
        description: "Las directrices para mantener un entorno seguro, respetuoso y colaborativo.",
        href: "/community-guidelines"
    }
];

export default function PoliciesPage() {
  const router = useRouter();
  return (
    <>
      <PoliciesHeader />
      <main className="container max-w-4xl mx-auto py-8 space-y-8">
        <section className="text-center">
            <h2 className="text-3xl font-bold">Nuestro Compromiso con la Confianza y la Transparencia</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Aquí encontrarás todos los documentos legales que rigen el funcionamiento de Corabo. Te recomendamos leerlos para entender tus derechos y responsabilidades.
            </p>
        </section>

        <div className="space-y-4">
            {policySections.map(policy => (
                <Link href={policy.href} key={policy.title} passHref>
                    <Card className="hover:border-primary hover:bg-muted/30 transition-all cursor-pointer">
                       <CardHeader className="flex flex-row items-center gap-4">
                           <policy.icon className="h-8 w-8 text-primary shrink-0" />
                           <div>
                               <CardTitle className="text-xl">{policy.title}</CardTitle>
                               <CardDescription className="mt-1">{policy.description}</CardDescription>
                           </div>
                       </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>

        <Card className="mt-12 bg-background">
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
