
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users } from 'lucide-react';

function CommunityGuidelinesHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5"/> Normas de la Comunidad</h1>
          <div className="w-8"></div>
        </div>
      </div>
    </header>
  );
}

export default function CommunityGuidelinesPage() {
  return (
    <>
      <CommunityGuidelinesHeader />
      <main className="container max-w-4xl mx-auto py-8">
        <article className="prose dark:prose-invert max-w-none">
            <p className="text-sm text-muted-foreground">Fecha de Última Actualización: 22 de julio de 2025</p>
            <p>En CorabO, nos esforzamos por crear un entorno positivo, inclusivo y seguro. Para lograrlo, todos los miembros de nuestra comunidad deben adherirse a las siguientes normas. Estas directrices complementan nuestros Términos y Condiciones de Uso y nuestras Políticas de Servicio.</p>
            
            <h2>Principios Fundamentales</h2>
            <ul>
              <li><strong>Respeto Mutuo:</strong> Trata a todos los usuarios con cortesía y profesionalismo. No se tolerará el acoso, el discurso de odio, las amenazas o cualquier forma de intimidación.</li>
              <li><strong>Honestidad y Transparencia:</strong> Sé sincero en tus interacciones. No proporciones información falsa o engañosa sobre ti, tus servicios o tus productos. La suplantación de identidad está estrictamente prohibida.</li>
              <li><strong>Seguridad Primero:</strong> No compartas información personal sensible (como contraseñas o datos financieros completos) en chats públicos o perfiles. Utiliza los canales seguros y el Registro CorabO para formalizar acuerdos.</li>
            </ul>

            <h2>Contenido Prohibido</h2>
            <p>Se prohíbe estrictamente la publicación y promoción de lo siguiente:</p>
            <ul>
              <li><strong>Actividades Ilegales:</strong> Cualquier contenido que promueva o facilite actividades ilegales.</li>
              <li><strong>Contenido para Adultos:</strong> A excepción de la planificación familiar, no se permite contenido sexualmente explícito.</li>
              <li><strong>Productos y Sustancias Peligrosas:</strong> Tabaco, drogas, armas, explosivos y suplementos no regulados.</li>
              <li><strong>Servicios Financieros de Alto Riesgo:</strong> Préstamos abusivos, esquemas piramidales y otras prácticas fraudulentas.</li>
              <li><strong>Contenido Discriminatorio:</strong> Cualquier contenido que discrimine por raza, religión, identidad de género, etc.</li>
            </ul>

            <h2>Políticas sobre Contenido de Marca y Anuncios</h2>
            <p>Si publicas contenido de marca o anuncios, debes:</p>
            <ul>
              <li><strong>Usar la Herramienta Designada:</strong> Etiqueta siempre a tus socios comerciales utilizando la herramienta de contenido de marca.</li>
              <li><strong>Ser Transparente:</strong> Indica claramente la naturaleza comercial de tu contenido (ej., #publicidad).</li>
              <li><strong>Cumplir con los Requisitos de Calidad:</strong> Las imágenes y videos deben cumplir con nuestras especificaciones de resolución y formato. El texto debe ser claro, veraz y sin errores gramaticales.</li>
            </ul>

            <h2>Reporte de Infracciones</h2>
            <p>Si ves contenido o comportamiento que infringe estas normas, por favor, repórtalo utilizando las herramientas de la plataforma. Nuestro equipo revisará todos los reportes y tomará las medidas necesarias para mantener la seguridad de la comunidad.</p>

            <p>Gracias por ayudarnos a hacer de CorabO un lugar seguro y confiable para todos.</p>
        </article>
      </main>
    </>
  );
}
