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
-   **`Transaction`**: Modela una transacción desde su inicio (`Carrito Activo`, `Solicitud Pendiente`) hasta su finalización (`Pagado`, `Resuelto`).

## 3. Lógica de Negocio y Estado (`src/contexts/CoraboContext.tsx`)

El `CoraboContext` es el corazón de la aplicación. Centraliza toda la lógica y los datos:

-   **Gestión de Estado:** Utiliza `useState` para manejar `users`, `products`, `services`, `transactions`, `currentUser`, `searchQuery`, `feedView` y el `cart` global.
-   **Acciones del Usuario:** Expone funciones para realizar todas las operaciones clave:
    -   `switchUser`: Cambia entre perfiles de usuario (para simulación).
    -   `addToCart`, `updateCartQuantity`: Gestionan el carrito de compras global.
    -   `setSearchQuery`, `setFeedView`: Controla los filtros del feed principal.
    -   `requestQuoteFromGroup`, `sendQuote`, `acceptQuote`: Gestiona el flujo de cotizaciones.
    -   `addContact`, `removeContact`: Administra la lista de contactos del usuario.
    -   `updateUserProfileAndGallery`: Permite a los proveedores añadir nuevas publicaciones a su perfil.
    -   **Límite de Cotizaciones:** Implementa una regla de negocio que limita a los usuarios no suscritos a cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.

## 4. Flujos de Usuario y Componentes Clave

### 4.1. Navegación Principal y Feed (Home)

-   **Página Principal (`src/app/page.tsx`):**
    -   Muestra un feed dinámico de `ServiceCard` o `ProviderCard`.
    -   La vista del feed se controla con los botones "Servicios" y "Empresas" del `Header`.
    -   El contenido se filtra en tiempo real según el `searchQuery` introducido en el `Header`.
-   **Encabezado (`src/components/Header.tsx`):**
    -   Contiene los botones para cambiar entre las vistas "Servicios" y "Empresas" (`feedView`).
    -   Incluye la barra de búsqueda que actualiza el `searchQuery` en el `CoraboContext`.
    -   Ofrece accesos directos al **GPS**, **cotizaciones**, **registro de transacciones (icono de billetera)** y un **carrito de compras global**.
-   **Tarjetas de Contenido (`ProviderCard.tsx`, `ServiceCard.tsx`):**
    -   Muestran la información del proveedor.
    -   El **nombre del proveedor** es un enlace directo a su perfil para una navegación intuitiva.
-   **Pie de Página (`src/components/Footer.tsx`):**
    -   Proporciona la navegación principal entre las vistas: Home, Videos, Búsqueda por Categorías, Mensajes y Perfil.

### 4.2. Configuración de Perfil (`src/app/profile-setup/page.tsx`)

-   **Asistente de 6 Pasos:** Guía al usuario a través de la configuración completa de su perfil.
    -   **Paso 1:** Selección de tipo de perfil (Cliente o Proveedor).
    -   **Paso 2:** Elección y validación de nombre de usuario.
    -   **Paso 3:** Selección de categorías de servicio (para proveedores).
    -   **Paso 4:** Validación de email y teléfono.
    -   **Paso 5:** Detalles específicos como ubicación, radio de acción y horarios (para proveedores).
    -   **Paso 6:** Revisión final de toda la información antes de guardar.
-   **Lógica Dinámica:** Los pasos se adaptan según el tipo de perfil seleccionado (los clientes omiten los pasos 3 y 5).

### 4.3. Perfiles de Usuario y Empresa

-   **Perfil del Propio Usuario (`src/app/profile/page.tsx`):**
    -   Muestra la información del `currentUser`.
    -   Permite al proveedor ver y gestionar su galería de publicaciones.
    -   El pie de página (`ProfileFooter`) es específico para esta vista y contiene un botón central para subir nuevas publicaciones (`UploadDialog`).
    -   Los proveedores pueden gestionar la "Promoción del Día" para destacar una publicación.
-   **Perfil de Empresa (`src/app/companies/[id]/page.tsx`):**
    -   Muestra el perfil público de un proveedor.
    -   Permite a los clientes ver la galería, reputación e información de la empresa.
    -   Incluye un **botón de Mensaje Directo** para facilitar la comunicación privada.
    -   Para proveedores de productos, se muestra una **cuadrícula de productos**.
    -   **Interacción con Productos (`ProductDetailsDialog`):** Al hacer doble clic en un producto, se abre un modal con detalles, comentarios y acciones (like, compartir, añadir al carrito).
    -   **Indicador de Horario (`BusinessHoursStatus.tsx`):** Muestra si el negocio está abierto o cerrado y el tiempo restante en formato `Xh Ym`, basado en cálculos precisos de la fecha/hora actual.

### 4.4. Registro de Transacciones (`src/app/transactions/*`)

Este es un módulo financiero clave para que los proveedores gestionen sus operaciones.

1.  **Página de Activación (`src/app/transactions/settings/page.tsx`):**
    -   **Flujo de Verificación en 2 Pasos:** Antes de poder usar el módulo, el proveedor debe activarlo.
    -   **Paso 1: Verificación de Identidad:** El usuario debe subir una foto de su cédula. El sistema simula una lectura y valida que los datos coincidan con los de la cuenta Corabo.
    -   **Paso 2: Registro de Cuenta de Pago:** Una vez verificada la identidad, el usuario debe registrar una cuenta bancaria o pago móvil.
    -   **Activación y Redirección:** Tras una verificación exitosa, el módulo se activa y el usuario es redirigido a la página principal de transacciones.

2.  **Panel de Control de Transacciones (`src/app/transactions/page.tsx`):**
    -   **Estado Inactivo:** Muestra una pantalla que invita al usuario a activarlo.
    -   **Estado Activo:** Cuando el módulo está activo, la página muestra:
        -   **Gráficos Responsivos:** Gráficos de ingresos y egresos (lineal o de tarta) que se ajustan correctamente al tamaño del contenedor sin superponerse.
        -   **Tarjeta CREDICORA con privacidad:** Muestra el límite de crédito disponible, con un **botón de ojo** para ocultar/mostrar los montos.
        -   Accesos directos a "Lista de Pendientes", "Transacciones" y "Compromisos de Pagos".
        -   Un menú de ajustes (engranaje) que permite imprimir reportes, modificar datos o desactivar el módulo.
        -   Un **carrito de compras global** y funcional en la cabecera.

### 4.5. Flujo de Cotizaciones y Monetización

1.  **Formulario de Cotización (`src/app/quotes/page.tsx`):**
    -   Permite a los usuarios solicitar cotizaciones para productos o servicios.
    -   Incluye un componente de "Búsqueda Avanzada" (`AdvancedSearchOptions.tsx`) con opciones premium bloqueadas.
2.  **Diálogo de Oferta (`AdvancedQuoteDialog.tsx`):**
    -   Al hacer clic en una opción bloqueada, se abre un modal que ofrece dos rutas: pago por uso o suscripción.
3.  **Página de Pago (`src/app/quotes/payment/page.tsx`):**
    -   Presenta una interfaz de pago aislada para desbloquear beneficios de cotización.
4.  **Formulario de Cotización PRO (`src/app/quotes/pro/page.tsx`):**
    -   Versión mejorada del formulario que se habilita tras un pago exitoso, con la opción avanzada desbloqueada.

## 5. Conclusión

El prototipo actual tiene una base sólida y una lógica bien definida. El `CoraboContext` actúa eficazmente como un motor de estado central, y los flujos de usuario están optimizados para la búsqueda, conexión, gestión financiera y monetización, con una interfaz de usuario coherente y funcional. Los futuros desarrollos deben seguir estos patrones para mantener la escalabilidad del proyecto.
