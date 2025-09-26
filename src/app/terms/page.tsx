
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Gavel } from 'lucide-react';

function TermsHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2"><Gavel className="h-5 w-5"/> Términos y Condiciones de Uso</h1>
          <div className="w-8"></div>
        </div>
      </div>
    </header>
  );
}

export default function TermsPage() {
  return (
    <>
      <TermsHeader />
      <main className="container max-w-4xl mx-auto py-8">
        <article className="prose dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground">Fecha de Última Actualización: 24 de julio de 2024</p>
          
          <p>El presente documento establece las Políticas de Servicio que rigen el acceso y uso de la plataforma digital CorabO. Al acceder, registrarse o utilizar la Plataforma, usted manifiesta su pleno conocimiento, comprensión y aceptación de la totalidad de los términos y condiciones aquí estipulados.</p>

          <h2>1. Objeto del Servicio de CorabO: Conexión, Transparencia y Seguridad</h2>
          <p>CorabO se compromete a proporcionar un servicio integral para facilitar la conexión entre individuos y entidades. El Servicio de CorabO comprende, pero no se limita a, lo siguiente:</p>
          <ul>
            <li><strong>1.1. Facilitación de Conexiones Personalizadas:</strong> Optimizar la interacción entre Usuarios Solicitantes, Prestadores de Servicio, Empresas y Repartidores.</li>
            <li><strong>1.2. Fomento de un Entorno Seguro:</strong> Implementar herramientas para prevenir el uso indebido y mitigar conductas perjudiciales. La formalización de acuerdos a través del Registro CorabO es fundamental para esta seguridad.</li>
            <li><strong>1.3. Desarrollo de Tecnologías Innovadoras:</strong> Uso de inteligencia artificial y geolocalización para mejorar la personalización y protección del servicio.</li>
            <li><strong>1.4. Presentación de Contenido Relevante:</strong> Utilizar datos para presentar ofertas y promociones de interés.</li>
            <li><strong>1.5. Investigación y Mejora Continua:</strong> Evaluar el rendimiento del Servicio para su mejora constante.</li>
          </ul>

          <h2>2. Modelo de Financiamiento del Servicio</h2>
          <p>El registro y acceso básico es gratuito. La sostenibilidad se basa en servicios de valor agregado opcionales:</p>
          <ul>
            <li><strong>2.1. Publicidad:</strong> Los usuarios pueden adquirir espacios publicitarios para promocionar sus perfiles.</li>
            <li><strong>2.2. CrediCora:</strong> Sistema de crédito interno para flexibilizar pagos.</li>
            <li><strong>2.3. Suscripción a Verificado:</strong> Proceso de verificación avanzado para aumentar la confianza.</li>
            <li><strong>2.4. Cotizaciones:</strong> Herramientas avanzadas para la gestión de cotizaciones.</li>
          </ul>

          <h2>4. Compromisos y Obligaciones del Usuario</h2>
          <p>Para asegurar un Servicio seguro, el usuario se compromete a:</p>
          <ul>
            <li><strong>4.1. Requisitos de Uso:</strong> Ser mayor de edad, no estar sujeto a prohibiciones legales y no tener antecedentes penales graves.</li>
            <li><strong>4.2. Restricciones:</strong> No suplantar identidades, no realizar actividades ilícitas, no interferir con el servicio, y no comercializar datos o cuentas.</li>
            <li><strong>4.3. Responsabilidad de Credenciales:</strong> Mantener la confidencialidad de su contraseña y notificar cualquier uso no autorizado.</li>
          </ul>
          
          <h2>5. Verificación de Usuarios y Riesgos Asociados</h2>
          <p>CorabO ofrece una Verificación por Suscripción. Esta verificación confirma la información proporcionada, pero NO IMPLICA QUE CORABO AVALE, GARANTICE O ASUMA RESPONSABILIDAD por la calidad o fiabilidad del servicio prestado. La decisión final de contratar recae exclusivamente en el Usuario Solicitante.</p>

          <h2>6. Registro y Monitoreo de Transacciones</h2>
          <p>CorabO NO custodia fondos. La plataforma registra y monitorea acuerdos P2P (Peer-to-Peer) entre usuarios. Todas las transacciones deben realizarse exclusivamente entre cuentas cuyos datos coincidan con los usuarios registrados en la Plataforma.</p>

          <h2>8. Derechos Adicionales Reservados por CorabO</h2>
          <p>CorabO se reserva el derecho de modificar nombres de usuario, utilizar contenido de la plataforma (respetando la propiedad intelectual del usuario) y colaborar con autoridades competentes en caso de actividades ilícitas.</p>
          
          <h2>9. Supresión de Contenido e Inhabilitación de la Cuenta</h2>
          <p>CorabO puede suprimir contenido o inhabilitar cuentas que infrinjan estas políticas. Se implementa un sistema de penalización progresiva por incumplimiento de pagos, que puede llegar al congelamiento del perfil y al inicio de procesos de cobro.</p>
          
          <h2>10. Naturaleza de la Relación con Prestadores</h2>
          <p>Los Prestadores de Servicio, Empresas y Repartidores actúan como contratistas independientes. No existe relación laboral ni de agencia con CorabO.</p>

          <h2>11. Resolución de Disputas</h2>
          <p>Cualquier disputa se regirá por las leyes de la República Bolivariana de Venezuela. CorabO ofrece un proceso de mediación imparcial para conflictos en acuerdos registrados, cuya decisión final será vinculante.</p>
          
          <h2>12. Cláusula de Indemnidad</h2>
          <p>El usuario se compromete a indemnizar y eximir de responsabilidad a CorabO por cualquier reclamo o daño que surja de su uso o mal uso de la Plataforma.</p>

          <h2>13. Actualización de estas Condiciones</h2>
          <p>CorabO notificará a los usuarios sobre cambios importantes en estas condiciones. El uso continuado del servicio después de la notificación implica la aceptación de los nuevos términos.</p>
        </article>
      </main>
    </>
  );
}
