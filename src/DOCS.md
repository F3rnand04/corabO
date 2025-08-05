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

-   **`User`**: Representa tanto a clientes (`client`) como a proveedores (`provider`). Contiene información como `id`, `name`, `profileImage`, `reputation` y, para los proveedores, una `gallery` de publicaciones. Incluye campos para el estado de suscripción (`isSubscribed`), la activación del módulo de transacciones (`isTransactionsActive`) y su nivel y límite en el sistema **Credicora**.
-   **`Product`**: Define un producto con `id`, `name`, `price`, `providerId`, etc.
-   **`Service`**: Define un servicio ofrecido por un proveedor.
-   **`GalleryImage`**: Representa una publicación en la galería de un proveedor, incluyendo imagen, descripción y comentarios.
-   **`Transaction`**: Modela una transacción desde su inicio (`Carrito Activo`, `Solicitud Pendiente`) hasta su finalización (`Pagado`, `Resuelto`). Incluye estados detallados para el ciclo de vida completo del pago y la entrega.
-   **`AgreementProposal`**: Estructura para las propuestas de acuerdo enviadas en el chat.
-   **`Message`**: Ahora puede contener opcionalmente una `proposal` para mostrarla como una cápsula interactiva.
-   **`CredicoraLevel`**: Define la estructura de los niveles del sistema Credicora (Alfa, Delta, Lambda, Sigma, Omega), especificando límite de crédito, porcentaje de pago inicial requerido y número de cuotas.

## 3. Lógica de Negocio y Estado (`src/contexts/CoraboContext.tsx`)

El `CoraboContext` es el corazón de la aplicación. Centraliza toda la lógica y los datos:

-   **Gestión de Estado:** Utiliza `useState` para manejar `users`, `products`, `services`, `transactions`, `currentUser`, `searchQuery`, `feedView` y el `cart` global.
-   **Acciones Clave:**
    -   `switchUser`: Cambia entre perfiles de usuario (para simulación).
    -   `addToCart`, `updateCartQuantity`: Gestionan el carrito de compras global.
    -   **Clasificación Automática de Empresas:** Implementa una función (`checkIfShouldBeEnterprise`) que reclasifica a un proveedor de productos como "Empresa" si demuestra un alto volumen de ventas (5 o más transacciones diarias durante 30 días consecutivos), asegurando que se le ofrezca el plan de suscripción correcto.
    -   **Flujo de Suscripción Seguro:**
        1.  Al suscribirse, la función `subscribeUser` **no activa la verificación inmediatamente**. En su lugar, crea un **compromiso de pago** (una transacción de sistema) por el monto del plan seleccionado (mensual/anual).
        2.  El usuario es redirigido a la página de pago para saldar este compromiso.
        3.  Una vez confirmado el pago, `confirmPaymentReceived` envía un **mensaje personalizado por DM** al usuario, solicitando la carga de documentos para la revisión manual. La insignia de "Verificado" solo se activa (simuladamente) tras este proceso.
    -   **Sistema Credicora Mejorado:**
        -   **Lógica de "Ayuda" en Compras:** `checkout` ahora implementa una lógica de financiación avanzada. Si una compra excede el límite de crédito del usuario, Credicora no bloquea la transacción. En su lugar, utiliza el **límite de crédito** para financiar una porción de la compra (ej. 40% del límite de $150), reduciendo significativamente el pago inicial que el cliente debe realizar. El monto financiado se divide en cuotas según el nivel del usuario.
        -   **Comisión para Proveedores:** Por cada venta realizada con Credicora, se genera automáticamente una transacción de sistema que representa una **comisión del 4.99%** para la plataforma, adeudada por el proveedor.
    -   **Flujo de Pago Seguro:**
        -   `confirmPaymentReceived` ahora acepta un parámetro booleano (`fromThirdParty`).
        -   Cuando un proveedor va a confirmar un pago, `TransactionDetailsDialog` le presenta un diálogo intermedio donde puede **reportar explícitamente si el pago proviene de un tercero**.
        -   Si se reporta, la transacción se marca con una advertencia visible en el historial.

## 4. Flujos de Usuario y Componentes Clave

### 4.1. Configuración de Perfil Obligatoria (`src/app/profile-setup/*`)

-   **Activación como Paso Final:** El asistente de configuración de perfil ahora es un flujo obligatorio para los proveedores. El último paso (`Step6_Review`) ya no finaliza el proceso, sino que **redirige al usuario a la página de activación de transacciones** (`/transactions/settings`). Esto asegura que **ningún proveedor pueda ofertar productos o servicios sin tener su registro de transacciones activo y verificado**.
-   **Eliminación de Alertas:** Como resultado del flujo obligatorio, se han eliminado las alertas que advertían a los clientes sobre proveedores no activos, ya que este escenario ya no es posible.

### 4.2. Chat y Negociación de Acuerdos (`src/app/messages/[id]/page.tsx`)

-   El chat funciona como una herramienta de negociación clave.
-   Los proveedores pueden enviar **propuestas de acuerdo** formales directamente en el chat, que los clientes pueden aceptar para crear un compromiso de pago automático.

### 4.3. Registro de Transacciones (`src/app/transactions/*`)

-   Es el centro financiero donde proveedores y clientes gestionan sus operaciones.
-   El panel principal (`transactions/page.tsx`) muestra gráficos de ingresos/egresos y la tarjeta de estado de **Credicora**, que refleja el nivel actual del usuario (Alfa, Delta, etc.) y su límite de crédito.
-   **Confirmación de Pago Segura:** El diálogo `TransactionDetailsDialog` ha sido modificado para incluir el nuevo flujo de reporte de pagos de terceros, añadiendo una capa de seguridad y transparencia al proceso.

### 4.4. Flujo de Videos Inmersivo (`src/app/videos/page.tsx`)

-   **Interfaz Limpia:** Se ha eliminado el header principal y los botones de acción inferiores para crear una experiencia de visualización sin distracciones.
-   **Navegación Directa:** El nombre y la imagen de perfil del creador del video ahora son enlaces directos a su perfil de empresa, facilitando la conexión.

## 5. Conclusión

El prototipo ha evolucionado hacia un modelo de negocio más robusto y seguro. La obligatoriedad de activar el registro de transacciones para proveedores, junto con el sofisticado sistema de niveles y financiación de **Credicora**, crea un ecosistema de alta confianza. El flujo de suscripción en dos pasos (pago y verificación documental) y el mecanismo de reporte de pagos de terceros fortalecen aún más la integridad de la plataforma. La documentación actual refleja fielmente esta lógica avanzada, sentando las bases para un desarrollo futuro coherente y escalable.
