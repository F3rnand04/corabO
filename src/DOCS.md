# Documentación del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento detalla la arquitectura y la lógica de funcionamiento del prototipo de la aplicación Corabo, construida con Next.js, React y TypeScript.

La aplicación está diseñada como una plataforma de conexión entre **clientes** y **proveedores** de servicios/productos, con una interfaz centrada en la experiencia móvil.

### Principios Arquitectónicos Clave:

-   **Component-Based:** La interfaz se construye con componentes reutilizables de React y ShadCN/UI.
-   **Estado Centralizado:** Se utiliza el Context API de React (`CoraboContext`) para gestionar el estado global de la aplicación. Esto actúa como una "base de datos en memoria" y como el cerebro que controla la lógica de negocio.
-   **Enrutamiento de Next.js:** Se aprovecha el App Router de Next.js para la navegación entre páginas y vistas.
-   **Simulación de Backend:** Los datos (usuarios, productos, etc.) y la lógica de negocio (crear transacciones, añadir contactos) se simulan dentro de `CoraboContext.tsx`, utilizando `useState` para gestionar los cambios.

## 2. Estructura de Datos (`src/lib/types.ts`)

La aplicación se rige por un conjunto de tipos de datos bien definidos:

-   **`User`**: Representa tanto a clientes (`client`) como a proveedores (`provider`). Contiene información como `id`, `name`, `profileImage`, `reputation` y, para los proveedores, una `gallery` de publicaciones. Incluye campos para el estado de suscripción (`isSubscribed`), la activación del módulo de transacciones (`isTransactionsActive`) y su nivel y límite en el sistema **Credicora**. Un campo clave es `isPaused`, que permite a un proveedor desactivar temporalmente la visibilidad de su perfil.
-   **`Product`**: Define un producto con `id`, `name`, `price`, `providerId`, etc. Forma parte del catálogo de un proveedor.
-   **`GalleryImage`**: Representa una publicación (imagen o video) en la galería promocional de un proveedor. Crucialmente, ahora incluye un `campaignId` opcional, que la vincula a una campaña publicitaria activa.
-   **`Transaction`**: Modela una transacción desde su inicio (`Carrito Activo`, `Solicitud Pendiente`) hasta su finalización (`Pagado`, `Resuelto`). Incluye estados detallados para el ciclo de vida completo del pago y la entrega.
-   **`AgreementProposal`**: Estructura para las propuestas de acuerdo enviadas en el chat.
-   **`Message`**: Ahora puede contener opcionalmente una `proposal` para mostrarla como una cápsula interactiva.
-   **`Campaign`**: Un nuevo tipo de dato que modela una campaña publicitaria. Incluye `id`, `providerId`, `publicationId`, `budget`, `durationDays`, estado, y estadísticas de rendimiento (`impressions`, `clicks`, etc.).

## 3. Lógica de Negocio y Estado (`src/contexts/CoraboContext.tsx`)

El `CoraboContext` es el corazón de la aplicación. Centraliza toda la lógica y los datos:

-   **Gestión de Estado:** Utiliza `useState` para manejar `users`, `products`, `services`, `transactions`, `currentUser`, `searchQuery`, `feedView`, `cart`, `contacts` y el nuevo estado `campaigns`.
-   **Acciones Clave:**
    -   **Clasificación Automática de Empresas:** Implementa una función (`checkIfShouldBeEnterprise`) que reclasifica a un proveedor de productos como "Empresa" si demuestra un alto volumen de ventas.
    -   **Pausar Perfil:** Se introduce la función `pauseProfile`, que permite a un proveedor desactivar temporalmente su perfil.
    -   **Gestión de Campañas:** Se ha añadido una lógica robusta para campañas publicitarias:
        -   **`createCampaign`**: Permite a un proveedor iniciar una campaña para una publicación. Calcula el costo basado en el **nivel de impulso** y la **segmentación**, aplica un **descuento del 10% a suscriptores**, y genera una transacción de "Sistema" para el pago.
        -   **Pago con Credicora:** Las campañas con un costo de $20 o más pueden ser financiadas con Credicora, reutilizando la lógica de pago a plazos.
        -   **Simulación de Rendimiento:** El sistema simula el incremento de las estadísticas de las campañas activas para dar feedback visual al proveedor.
    -   **Gestión de Contactos:** Incluye la función `isContact` para verificar si un usuario ya ha sido guardado, permitiendo un feedback visual instantáneo en la UI.
    -   **Corrección de Errores de Renderizado:** Se ha refactorizado la gestión de notificaciones (`toast`) para evitar errores de "actualización durante el renderizado", asegurando que las notificaciones solo se activen como respuesta directa a eventos del usuario.

## 4. Flujos de Usuario y Componentes Clave

### 4.1. Navegación Principal y Footer (`Footer.tsx`)

-   **Pie de Página Dinámico:** El pie de página principal contiene 5 botones cuya funcionalidad es contextual, incluyendo el botón de "Subir" o "Buscar" y el de "Perfil" o "Ajustes".

### 4.2. Perfil del Proveedor (`/profile/page.tsx`)

-   **Header Fijo:** Se ha corregido la interfaz para que la información principal del perfil (avatar, nombre, estadísticas) permanezca fija en la parte superior al desplazarse.
-   **Botón de "Gestionar Campañas":**
    -   Se ha añadido un nuevo botón **"Gestionar Campañas"**, visible solo para proveedores, al lado de "Emprende por Hoy".
    -   Este botón abre el nuevo **`CampaignDialog`**.
-   **Diálogo de Campañas (`CampaignDialog.tsx`):**
    -   **Paso 1: Selección:** El proveedor elige una publicación de su galería para promocionar.
    -   **Paso 2: Presupuesto:** Selecciona un **nivel de impulso** (Básico, Avanzado, Premium) y una **duración en días**.
    -   **Paso 3: Segmentación:** Puede añadir opcionalmente segmentación geográfica o por intereses, lo que ajusta el costo.
    -   **Paso 4: Revisión y Pago:** Muestra un resumen del costo total, incluyendo descuentos por suscripción, y permite **pagar con Credicora** (si el monto es >= $20) antes de proceder al pago.

### 4.3. Perfil de Empresa (`/companies/[id]/page.tsx`)

-   **Botón de Mensaje Directo:** Se ha añadido un icono de **Enviar (`Send`)** junto al de guardar (`Bookmark`). Esto permite a cualquier usuario iniciar una conversación de chat directamente con el proveedor desde su perfil, mejorando la comunicación.
-   **Feedback Visual al Guardar:** El icono de `Bookmark` ahora se rellena de color cuando se guarda un contacto, proporcionando una confirmación visual inmediata y persistente.

### 4.4. Emprende por Hoy (`/emprende/page.tsx`)

-   **Flujo Corregido:** Se ha mejorado la lógica para que los usuarios sin el registro de transacciones activo sean redirigidos inmediatamente, evitando que puedan interactuar con un formulario que no pueden usar.

## 5. Conclusión

El prototipo ha evolucionado para incluir un sofisticado **módulo de autogestión publicitaria**, permitiendo a los proveedores invertir en su propio crecimiento dentro de la plataforma. Las mejoras en la interfaz, como el botón de mensaje directo y el feedback visual, agilizan la interacción del usuario. La corrección de errores de renderizado ha fortalecido la estabilidad de la aplicación. La documentación refleja esta nueva capa de monetización y las mejoras de usabilidad implementadas.
