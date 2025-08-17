# Documentación del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento detalla la arquitectura y la lógica de funcionamiento de la aplicación Corabo, construida con **Next.js, React, TypeScript, Firebase y Genkit**.

La aplicación ha evolucionado de un prototipo cliente-céntrico a una aplicación web robusta con una arquitectura cliente-servidor, diseñada para ser segura y escalable.

### Principios Arquitectónicos Clave:

-   **Frontend Moderno:** La interfaz se construye con componentes reutilizables de React y ShadCN/UI, aprovechando el App Router de Next.js para la navegación.
-   **Backend Seguro con Genkit:** La lógica de negocio crítica (creación de campañas, envío de mensajes, gestión de acuerdos) se ha migrado del frontend a **flujos de Genkit**. Estos flujos se ejecutan en el servidor, garantizando que las operaciones sean seguras y que la lógica de negocio no pueda ser manipulada desde el cliente.
-   **Autenticación y Base de Datos con Firebase:**
    -   **Firebase Authentication:** Gestiona el inicio de sesión de usuarios a través de proveedores como Google, proporcionando un sistema de autenticación seguro y real.
    -   **Firestore Database:** Actúa como la base de datos principal, almacenando en tiempo real la información de usuarios, transacciones y conversaciones.
-   **Gestión de Estado del Cliente (`CoraboContext.tsx`):** El `CoraboContext` ahora actúa como un gestor de estado del lado del cliente y un puente de comunicación. Se suscribe a los datos de Firestore en tiempo real y llama a los flujos de Genkit del backend para ejecutar acciones, manteniendo la UI reactiva y sincronizada.

## 2. Lógica de Perfil Dinámico y Especialización

Para ofrecer una experiencia de usuario clara, Corabo implementa un sistema de **perfiles dinámicos** que se adaptan al tipo de negocio del proveedor.

-   **Campos Especializados:** Dependiendo de la categoría principal seleccionada por el proveedor, el formulario de configuración de perfil (`profile/details`) muestra campos adicionales y opcionales para que puedan detallar sus servicios:
    -   **Salud y Bienestar:** Nro. de Licencia, Especialidades, Modalidad de Atención.
    -   **Hogar y Reparaciones:** Oficios Principales (Plomería, etc.), Habilidades Específicas (tags).
    -   **Belleza:** Oficios Principales (Manicure, Estilismo, etc.), Habilidades Específicas.
    -   **Transporte y Asistencia:** Tipo de Vehículo, Capacidad de Carga, Condiciones Especiales.
    -   **Alimentos y Restaurantes:** Tipo de Cocina, Opciones de Servicio (local, delivery, etc.), Enlace al Menú, Permiso Sanitario.
    -   **Otros Servicios Profesionales:** Habilidades Clave (tags), Marcas y Herramientas, Años de Experiencia.
-   **Visualización Pública:** La información especializada se muestra de forma clara en el perfil público del proveedor (`/companies/[id]`) mediante etiquetas (`Badge`) y secciones de detalles, ayudando a los clientes a tomar decisiones informadas.

## 3. Panel de Control del Proveedor (`/transactions`)

La sección de transacciones ha sido transformada en un verdadero **panel de control (Dashboard)** para proveedores.

-   **Gráficos de Rendimiento:**
    -   **Gráfico de Líneas:** Muestra la evolución de ingresos vs. egresos, incluyendo proyecciones de pagos pendientes.
    -   **Gráfico de Torta:** Ofrece un resumen visual de la distribución financiera actual (ingresos, egresos, pendientes, etc.).
-   **Incentivo a la Suscripción:** El panel incluye una tarjeta destacada que comunica de forma amigable y comercial los beneficios de suscribirse, como la insignia de verificado y mayor visibilidad.
-   **Navegación Intuitiva:** El panel es la vista principal, con acceso rápido a las listas detalladas de transacciones pendientes e historial.

## 4. Flujos Clave de la Aplicación

-   **Autenticación y Configuración Inicial:** Un flujo seguro y guiado asegura que todos los usuarios, especialmente los proveedores, completen su información básica y de identidad antes de poder transaccionar.
-   **Publicación de Contenido:** El flujo `publication-flow` centraliza la creación de publicaciones e ítems de catálogo, validando la existencia del usuario para mantener la integridad de los datos.
-   **Notificaciones:** El sistema de notificaciones (`notification-flow`) se utiliza para comunicar eventos importantes como solicitudes de afiliación, recordatorios de pago y la activación de nuevas campañas.
-   **Verificación de Identidad con IA (`verification-flow`):** Un flujo multimodal utiliza la IA de Google para analizar documentos de identidad, extrayendo y comparando los datos con los registros del usuario para una verificación rápida y segura.

## 5. Conclusión

El prototipo actual es una aplicación web funcional y robusta con una arquitectura bien definida. La separación clara entre el frontend y el backend (Genkit), el uso de una base de datos en tiempo real (Firestore) y la implementación de perfiles especializados y un panel de control avanzado sientan las bases para una plataforma escalable, segura y de alto valor para sus usuarios.
