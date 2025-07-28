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

-   **`User`**: Representa tanto a clientes (`client`) como a proveedores (`provider`). Contiene información como `id`, `name`, `profileImage`, `reputation` y, para los proveedores, una `gallery` de publicaciones.
-   **`Product`**: Define un producto con `id`, `name`, `price`, `providerId`, etc.
-   **`Service`**: Define un servicio ofrecido por un proveedor.
-   **`GalleryImage`**: Representa una publicación en la galería de un proveedor, incluyendo imagen, descripción y comentarios.
-   **`Transaction`**: Modela una transacción desde su inicio (`Carrito Activo`, `Solicitud Pendiente`) hasta su finalización (`Pagado`, `Resuelto`).

## 3. Lógica de Negocio y Estado (`src/contexts/CoraboContext.tsx`)

El `CoraboContext` es el corazón de la aplicación. Centraliza toda la lógica y los datos:

-   **Gestión de Estado:** Utiliza `useState` para manejar `users`, `products`, `services`, `transactions`, `currentUser`, `searchQuery` y `feedView`.
-   **Acciones del Usuario:** Expone funciones para realizar todas las operaciones clave:
    -   `switchUser`: Cambia entre perfiles de usuario (para simulación).
    -   `setSearchQuery`, `setFeedView`: Controla los filtros del feed principal.
    -   `requestQuoteFromGroup`, `sendQuote`, `acceptQuote`: Gestiona el flujo de cotizaciones.
    -   `addContact`, `removeContact`: Administra la lista de contactos del usuario.
    -   `updateUserProfileAndGallery`: Permite a los proveedores añadir nuevas publicaciones a su perfil.

## 4. Flujos de Usuario y Componentes Clave

### 4.1. Navegación Principal y Feed (Home)

-   **Página Principal (`src/app/page.tsx`):**
    -   Muestra un feed dinámico de `ServiceCard` o `ProviderCard`.
    -   La vista del feed se controla con los botones "Servicios" y "Empresas" del `Header`.
    -   El contenido se filtra en tiempo real según el `searchQuery` introducido en el `Header`.
-   **Encabezado (`src/components/Header.tsx`):**
    -   Contiene los botones para cambiar entre las vistas "Servicios" y "Empresas" (`feedView`).
    -   Incluye la barra de búsqueda que actualiza el `searchQuery` en el `CoraboContext`.
-   **Pie de Página (`src/components/Footer.tsx`):**
    -   Proporciona la navegación principal entre las vistas: Home, Videos, Búsqueda por Categorías, Mensajes y Perfil.

### 4.2. Búsqueda y Exploración por Categorías

-   **Botón Central de Búsqueda (Footer):** El botón de la lupa abre la página de exploración.
-   **Página de Exploración (`src/app/search/page.tsx`):**
    -   Muestra un `CategoryHub` con las principales categorías de servicios.
    -   **No tiene barra de búsqueda.** Su propósito es la navegación visual.
    -   **Botón "Ver Todo":** Permite al usuario volver al feed principal sin filtros.
    -   **Lógica de Clic en Categoría:** Al seleccionar una categoría, la aplicación:
        1.  Redirige al usuario a la página principal (`/`).
        2.  Establece `feedView` en `'empresas'`.
        3.  Establece `searchQuery` con el nombre de la categoría seleccionada.
        -   El resultado es que el feed principal muestra solo las empresas que pertenecen a ese grupo.

### 4.3. Solicitud de Cotizaciones

-   **Página de Cotizaciones (`src/app/quotes/page.tsx`):**
    -   Permite a los usuarios solicitar cotizaciones para **productos** o **servicios**.
    -   Utiliza `react-hook-form` y `zod` para la gestión y validación del formulario.
    -   **Formulario Dinámico:** La interfaz cambia según si el usuario selecciona "Producto" o "Servicio".
        -   **Producto:** Permite añadir hasta 3 productos en campos de texto separados.
        -   **Servicio:** Muestra campos para un título ("QUÉ NECESITAS") y una descripción detallada.
    -   **Selección de Grupo:** El usuario puede seleccionar un grupo (ej: "Automotriz y Repuestos") para dirigir su solicitud.

### 4.4. Perfiles de Usuario y Empresa

-   **Perfil del Propio Usuario (`src/app/profile/page.tsx`):**
    -   Muestra la información del `currentUser`.
    -   Permite al proveedor ver y gestionar su galería de publicaciones.
    -   El pie de página (`ProfileFooter`) es específico para esta vista y contiene un botón central para subir nuevas publicaciones (`UploadDialog`).
-   **Perfil de Empresa (`src/app/companies/[id]/page.tsx`):**
    -   Muestra el perfil público de un proveedor.
    -   Permite a los clientes ver la galería, la reputación y la información de contacto de la empresa.
    -   La interacción con la galería (cambiar de imagen, ver detalles) está gestionada localmente con `useState`.
-   **Gestión de Imágenes:**
    -   **`UploadDialog.tsx`**: Modal para que los proveedores suban nuevas imágenes a su galería.
    -   **`ImageDetailsDialog.tsx`**: Modal para ver los detalles de una imagen, incluyendo descripción y comentarios. Tiene una vista para el propietario (con opción de borrar) y una para el cliente.

## 5. Conclusión

El prototipo actual tiene una base sólida y una lógica bien definida. El `CoraboContext` actúa eficazmente como un motor de estado central, y el flujo de navegación está optimizado para la búsqueda y conexión entre usuarios. Los futuros desarrollos deben seguir estos patrones para mantener la coherencia y la escalabilidad del proyecto.
