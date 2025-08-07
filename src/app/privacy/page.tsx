
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

function PrivacyHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> Política de Privacidad</h1>
          <div className="w-8"></div>
        </div>
      </div>
    </header>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <PrivacyHeader />
      <main className="container max-w-4xl mx-auto py-8">
        <article className="prose dark:prose-invert max-w-none">
            <p className="text-sm text-muted-foreground">Fecha de Última Actualización: 22 de julio de 2025</p>
            <p>Esta Política de Privacidad explica cómo CorabO Soluciones Cercanas C.A. recopila, usa, comparte y protege tu información. Queremos que comprendas qué información recopilamos y cómo la usamos para que puedas usar CorabO de un modo que te resulte conveniente.</p>
            
            <h3>3.1. ¿Qué información recopilamos?</h3>
            <p>Recopilamos la información que nos proporcionas y la que se genera con tu actividad en la plataforma:</p>
            <ul>
                <li><strong>Información de Registro y Perfil:</strong> Nombre, correo, teléfono, ubicación, tipo de usuario, datos bancarios (para validación, no custodia), credenciales, etc.</li>
                <li><strong>Información de Uso:</strong> Tu actividad en CorabO, servicios buscados u ofrecidos, transacciones, contenido publicado, interacciones, etc.</li>
                <li><strong>Contenido que Creas:</strong> Publicaciones, comentarios, imágenes, videos, etc.</li>
                <li><strong>Información del Dispositivo:</strong> Modelo, sistema operativo, dirección IP, cookies, etc.</li>
                <li><strong>Información de Ubicación:</strong> Ubicación GPS precisa (con tu permiso) y aproximada (inferida de la IP).</li>
                <li><strong>Información de Transacciones:</strong> Detalles de los acuerdos monitoreados (monto, fecha, estado), sin custodiar fondos.</li>
            </ul>
            <p>Cierta información es necesaria para usar nuestros productos. Sin otra información opcional, la calidad de tu experiencia podría verse afectada.</p>

            <h3>3.2. ¿Cómo usamos tu información?</h3>
            <p>Utilizamos la información recopilada para:</p>
            <ul>
                <li><strong>Proveer, Personalizar y Mejorar Nuestros Servicios:</strong> Operar, mantener y mejorar la plataforma, personalizar tu experiencia y desarrollar nuevas herramientas.</li>
                <li><strong>Garantizar la Seguridad e Integridad:</strong> Verificar cuentas, investigar actividades sospechosas y prevenir fraudes.</li>
                <li><strong>Ofrecer Servicios de Medición y Análisis:</strong> Generar estadísticas agregadas y anónimas para mejorar la plataforma y para informes de rendimiento a anunciantes (sin revelar tu identidad).</li>
                <li><strong>Comunicarnos Contigo:</strong> Enviarte notificaciones importantes sobre tu cuenta y actualizaciones.</li>
                <li><strong>Realizar Investigaciones e Innovar:</strong> Analizar tendencias para mejorar nuestras funcionalidades.</li>
            </ul>

            <h3>3.3. ¿Cómo se comparte tu información?</h3>
            <p>No vendemos tu información personal. La compartimos en las siguientes circunstancias:</p>
            <ul>
                <li><strong>Dentro de la Plataforma:</strong> Cierta información de tu perfil es visible para otros usuarios para facilitar la interacción.</li>
                <li><strong>Con Proveedores de Servicios:</strong> Con terceros que nos ayudan a operar la plataforma (ej. alojamiento, soporte), bajo estrictos acuerdos de confidencialidad.</li>
                <li><strong>Con Socios Comerciales (Anunciantes):</strong> Información agregada y anónima para medir la efectividad de sus campañas.</li>
                <li><strong>Por Motivos Legales:</strong> Si es necesario para cumplir con la ley o proteger los derechos y la seguridad de CorabO y sus usuarios.</li>
                <li><strong>Transferencias de Negocio:</strong> En caso de fusión o adquisición, tu información puede ser transferida.</li>
            </ul>

            <h3>3.4. ¿Cómo puedes administrar o eliminar tu información?</h3>
            <p>Te ofrecemos herramientas para gestionar tus datos y ejercer tus derechos:</p>
            <ul>
                <li><strong>Acceder y Gestionar:</strong> Puedes revisar y actualizar tu perfil en la configuración de tu cuenta.</li>
                <li><strong>Solicitar Portabilidad:</strong> Puedes solicitar una copia de tu información.</li>
                <li><strong>Eliminar tu Cuenta:</strong> Puedes solicitar la eliminación de tu cuenta, aunque cierta información puede ser retenida por obligaciones legales o de seguridad.</li>
            </ul>

            <h3>3.5. ¿Cuánto tiempo conservamos tu información?</h3>
            <p>Conservamos la información el tiempo necesario para ofrecer nuestros servicios, cumplir con obligaciones legales y proteger nuestros intereses.</p>

            <h3>3.6. ¿Cómo transferimos información?</h3>
            <p>Como plataforma global, tu información puede ser transferida, almacenada y procesada más allá de las fronteras, siempre cumpliendo con las leyes de protección de datos.</p>

            <h3>3.7. ¿Cómo respondemos a solicitudes legales?</h3>
            <p>Accedemos a tu información y la compartimos en respuesta a solicitudes legales y para promover la seguridad y la integridad de nuestros productos.</p>
            
            <h3>3.8. ¿Cómo sabrás si la Política cambió?</h3>
            <p>Te notificaremos sobre cambios sustanciales en esta política antes de que entren en vigor.</p>

            <h3>3.9. ¿Cómo puedes contactarnos?</h3>
            <p>Si tienes preguntas sobre esta política, puedes contactarnos a través del Servicio de Ayuda de la plataforma.</p>
        </article>
      </main>
    </>
  );
}
