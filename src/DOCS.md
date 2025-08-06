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
-   **`GalleryImage`**: Representa una publicación (imagen o video) en la galería promocional de un proveedor, incluyendo imagen, descripción y comentarios. Estas publicaciones son las que aparecen en el feed principal.
-   **`Transaction`**: Modela una transacción desde su inicio (`Carrito Activo`, `Solicitud Pendiente`) hasta su finalización (`Pagado`, `Resuelto`). Incluye estados detallados para el ciclo de vida completo del pago y la entrega.
-   **`AgreementProposal`**: Estructura para las propuestas de acuerdo enviadas en el chat.
-   **`Message`**: Ahora puede contener opcionalmente una `proposal` para mostrarla como una cápsula interactiva.
-   **`CredicoraLevel`**: Define la estructura de los niveles del sistema Credicora (Alfa, Delta, Lambda, Sigma, Omega), especificando límite de crédito, porcentaje de pago inicial requerido y número de cuotas.

## 3. Lógica de Negocio y Estado (`src/contexts/CoraboContext.tsx`)

El `CoraboContext` es el corazón de la aplicación. Centraliza toda la lógica y los datos:

-   **Gestión de Estado:** Utiliza `useState` para manejar `users`, `products`, `services`, `transactions`, `currentUser`, `searchQuery`, `feedView` y el `cart` global.
-   **Acciones Clave:**
    -   **Clasificación Automática de Empresas:** Implementa una función (`checkIfShouldBeEnterprise`) que reclasifica a un proveedor de productos como "Empresa" si demuestra un alto volumen de ventas (5 o más transacciones diarias durante 30 días consecutivos), asegurando que se le ofrezca el plan de suscripción correcto.
    -   **Flujo de Suscripción Seguro:** Se mantiene el flujo de pago y verificación en dos pasos.
    -   **Sistema Credicora Mejorado:** La lógica de financiación avanzada y comisiones al proveedor sigue vigente.
    -   **Pausar Perfil:** Se introduce la función `pauseProfile`, que permite a un proveedor desactivar temporalmente su perfil, haciéndolo invisible en las búsquedas y simulando una penalización en su reputación.
    -   **Flexibilidad de Roles (Simulada):** El sistema permite cambiar de tipo de perfil (cliente, proveedor), pero muestra una advertencia indicando que en la versión real, este cambio estaría restringido (ej. cada 6 meses) para fomentar la estabilidad.

## 4. Flujos de Usuario y Componentes Clave

### 4.1. Navegación Principal y Footer (`Footer.tsx`)

-   **Pie de Página Dinámico:** El pie de página principal contiene 5 botones cuya funcionalidad es contextual:
    -   **Botón Central:**
        -   En la mayoría de las páginas, es un icono de **Búsqueda** que lleva a `/search`.
        -   Cuando el usuario está en su propio perfil (`/profile`), se convierte en un icono de **Subir**. Para proveedores, abre un diálogo para añadir publicaciones o productos; para clientes, redirige a "Emprende por Hoy".
    -   **Botón Derecho:**
        -   En la mayoría de las páginas, es el **Avatar del usuario**, que funciona como un atajo a su perfil (`/profile`).
        -   Cuando el usuario está en su propio perfil, se transforma en un **Engranaje de Ajustes**, que lleva a la página de configuración (`/profile-setup`).
-   **Header Principal:** El header con el logo y accesos directos se oculta automáticamente en páginas que tienen su propia cabecera (como un chat individual) o que son parte de un flujo (como la configuración de perfil), para evitar redundancia y mejorar el enfoque.

### 4.2. Perfil de Proveedor de Productos

-   **Diferenciación de Contenido:** Para proveedores que seleccionan `offerType: 'product'`, la plataforma diferencia entre:
    -   **Galería de Publicaciones:** Imágenes y videos promocionales que aparecen en el feed principal.
    -   **Catálogo de Productos:** Artículos para la venta que solo son visibles dentro del perfil del proveedor.
-   **Vista de Perfil Adaptada (`/companies/[id]/page.tsx`):** El perfil público de un vendedor de productos ahora muestra una cuadrícula de sus productos en venta, en lugar de su galería de imágenes. La imagen principal sigue siendo la última publicación de su galería.
-   **Estadísticas Relevantes:** Las métricas en la tarjeta del perfil muestran **"Publicaciones"** y **"Productos"** en lugar de "Trab. Realizados".

### 4.3. Diálogo de Subida (`UploadDialog.tsx`)

-   **Opciones Claras:** Para un proveedor de productos, el diálogo de subida ahora ofrece dos botones distintos: **"Publicar en Galería"** y **"Añadir Producto al Catálogo"**, guiando al usuario a la acción correcta.
-   **Sugerencia de Diseño:** Al añadir un producto, se muestra una alerta sugiriendo el uso de imágenes con fondo blanco para una mejor presentación.

## 5. Conclusión

El prototipo ha alcanzado un alto grado de madurez, simulando reglas de negocio complejas como la flexibilidad de roles con limitaciones, la capacidad de pausar perfiles y una clara distinción entre marketing (publicaciones) y ventas (productos). La documentación refleja ahora fielmente esta arquitectura avanzada, proporcionando una base sólida y clara para el desarrollo futuro.