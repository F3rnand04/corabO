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

-   **`User`**: Representa tanto a clientes (`client`) como a proveedores (`provider`). Contiene información como `id`, `name`, `profileImage`, `reputation` y, para los proveedores, una `gallery` de publicaciones. Incluye campos para el estado de suscripción y la activación del módulo de transacciones.
-   **`Product`**: Define un producto con `id`, `name`, `price`, `providerId`, etc.
-   **`Service`**: Define un servicio ofrecido por un proveedor.
-   **`GalleryImage`**: Representa una publicación en la galería de un proveedor, incluyendo imagen, descripción y comentarios.
-   **`Transaction`**: Modela una transacción desde su inicio (`Carrito Activo`, `Solicitud Pendiente`) hasta su finalización (`Pagado`, `Resuelto`). Incluye nuevos estados como `Cita Solicitada` y `Pago Enviado - Esperando Confirmación` para un seguimiento más detallado.
-   **`AgreementProposal`**: Estructura para las propuestas de acuerdo enviadas en el chat.
-   **`Message`**: Ahora puede contener opcionalmente una `proposal` para mostrarla como una cápsula interactiva.

## 3. Lógica de Negocio y Estado (`src/contexts/CoraboContext.tsx`)

El `CoraboContext` es el corazón de la aplicación. Centraliza toda la lógica y los datos:

-   **Gestión de Estado:** Utiliza `useState` para manejar `users`, `products`, `services`, `transactions`, `currentUser`, `searchQuery`, `feedView` y el `cart` global.
-   **Acciones del Usuario:** Expone funciones para realizar todas las operaciones clave:
    -   `switchUser`: Cambia entre perfiles de usuario (para simulación).
    -   `addToCart`, `updateCartQuantity`: Gestionan el carrito de compras global.
    -   `checkout`: Procesa el pago, incluyendo la opción de usar **Credicora**, que calcula un pago inicial y genera cuotas futuras como transacciones separadas.
    -   `requestQuoteFromGroup`, `sendQuote`: Gestionan el flujo de cotizaciones.
    -   `addContact`, `removeContact`: Administra la lista de contactos del usuario.
    -   **Flujo de Citas y Acuerdos:** Nuevas funciones como `createAppointmentRequest`, `sendProposalMessage` y `acceptProposal` gestionan un flujo de negociación completo desde el chat.
    -   **Flujo de Finalización de Servicio:** Lógica mejorada con `completeWork` y `confirmWorkReceived` para asegurar que el cliente confirma la recepción y califica antes de pagar, y el proveedor confirma el pago.
    -   **Límite de Cotizaciones:** Implementa una regla de negocio que limita a los usuarios no suscritos a cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.

## 4. Flujos de Usuario y Componentes Clave

### 4.1. Navegación Principal y Feed (Home)

-   **Página Principal (`src/app/page.tsx`):** Muestra un feed dinámico de `ServiceCard` o `ProviderCard` que se filtra en tiempo real.
-   **Encabezado (`src/components/Header.tsx`):** Contiene la barra de búsqueda y accesos directos, incluyendo un **carrito de compras global** que ahora abre un diálogo de pre-factura completo.
-   **Tarjetas de Contenido (`ProviderCard.tsx`, `ServiceCard.tsx`):** Muestran la información del proveedor con un enlace directo a su perfil.

### 4.2. Configuración de Perfil (`src/app/profile-setup/page.tsx`)

-   **Asistente de 6 Pasos:** Guía al usuario a través de la configuración completa de su perfil, incluyendo opciones para que los proveedores definan si aceptan Credicora y el costo de sus citas.

### 4.3. Perfiles de Usuario y Empresa

-   **Perfil del Propio Usuario (`src/app/profile/page.tsx`):**
    -   Permite al proveedor gestionar su galería de publicaciones y la "Promoción del Día".
-   **Perfil de Empresa (`src/app/companies/[id]/page.tsx`):**
    -   Muestra el perfil público de un proveedor.
    -   **Agendamiento de Citas:** Al hacer clic en una fecha del calendario, se abre un diálogo para que el cliente escriba un resumen de su solicitud. Esto inicia un proceso de negociación en lugar de crear un compromiso automático.
    -   **Carrito de Compras Mejorado:** El carrito de compras de la cabecera ahora también abre un diálogo de pre-factura completo, permitiendo añadir delivery y usar Credicora si el proveedor lo acepta.
    -   **Mensaje Directo:** Se ha añadido un icono para enviar un mensaje directo al proveedor, mejorando la comunicación inicial.

### 4.4. Chat y Negociación de Acuerdos (`src/app/messages/[id]/page.tsx`)

-   El chat ha sido transformado en una herramienta de negociación.
-   **Botón de Propuesta:** Los proveedores tienen un botón (+) para abrir un diálogo y **"Establecer Acuerdo de Servicio"**.
-   **Formulario de Acuerdo:** Permite definir título, descripción, fecha de entrega/cita, costo y si se acepta Credicora.
-   **Cápsula de Propuesta:** La propuesta se envía como una tarjeta interactiva en el chat. El cliente la ve y puede aceptarla directamente.
-   **Creación de Compromiso:** Al aceptar, se crea automáticamente una transacción con el estado "Acuerdo Aceptado - Pendiente de Ejecución", formalizando el trato.

### 4.5. Registro de Transacciones (`src/app/transactions/*`)

Este es un módulo financiero clave para que los proveedores gestionen sus operaciones.

1.  **Activación y Panel de Control:** El flujo de activación y el panel principal se mantienen, con gráficos de ingresos/egresos y la tarjeta Credicora.

2.  **Flujo de Finalización de Servicio Mejorado (`TransactionDetailsDialog`):**
    -   **Escenario 1 (Iniciado por Proveedor):** El proveedor marca un trabajo como finalizado (`Pendiente de Confirmación del Cliente`).
    -   **Escenario 2 (Iniciado por Cliente):** Un cliente puede ir a un compromiso de pago pendiente y hacer clic en "Pagar Ahora".
    -   **Confirmación del Cliente:** En ambos casos, el cliente debe primero confirmar que ha recibido el servicio satisfactoriamente.
    -   **Calificación Integrada:** Inmediatamente después de confirmar, se le pide al cliente que califique el servicio (con estrellas) y deje un comentario opcional.
    -   **Paso de Pago:** Luego de calificar, el cliente procede a la pantalla de pago para registrar su transferencia o pago móvil.
    -   **Confirmación del Proveedor:** El estado cambia a `Pago Enviado - Esperando Confirmación`. El proveedor debe ahora confirmar la recepción del pago para que la transacción se marque como `Pagado` y se complete el ciclo.

### 4.6. Flujo de Cotizaciones y Monetización

-   El flujo se mantiene, permitiendo a los usuarios hacer cotizaciones normales o pagar para acceder a opciones de "Búsqueda Avanzada" en el formulario PRO.

## 5. Conclusión

El prototipo actual tiene una base sólida y una lógica bien definida. El `CoraboContext` actúa eficazmente como un motor de estado central. Los flujos de usuario han sido optimizados para reflejar procesos de negocio más realistas, especialmente en la negociación de acuerdos a través del chat y en el ciclo de vida de finalización de una transacción, mejorando la transparencia y seguridad para ambas partes. Los futuros desarrollos deben seguir estos patrones para mantener la escalabilidad del proyecto.
