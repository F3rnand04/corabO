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

-   **Gestión de Estado:** Utiliza `useState` para manejar `users`, `products`, `services`, `transactions`, `currentUser`, `searchQuery` y `feedView`.
-   **Acciones del Usuario:** Expone funciones para realizar todas las operaciones clave:
    -   `switchUser`: Cambia entre perfiles de usuario (para simulación).
    -   `setSearchQuery`, `setFeedView`: Controla los filtros del feed principal.
    -   `requestQuoteFromGroup`, `sendQuote`, `acceptQuote`: Gestiona el flujo de cotizaciones.
    -   `addContact`, `removeContact`: Administra la lista de contactos del usuario.
    -   `updateUserProfileAndGallery`: Permite a los proveedores añadir nuevas publicaciones a su perfil.
    -   **Límite de Cotizaciones:** Implementa una regla de negocio que limita a los usuarios no suscritos a cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.

## 4. Flujos de Usuario y Componentes Clave

### 4.1. Navegación Principal y Feed (Home)

-   **Página Principal (`src/app/page.tsx`):**
    -   Muestra un feed dinámico de `ServiceCard`, `ProviderCard` o `ProductCard`.
    -   La vista del feed se controla con los botones "Servicios" y "Empresas" del `Header`.
    -   El contenido se filtra en tiempo real según el `searchQuery` introducido en el `Header`.
-   **Encabezado (`src/components/Header.tsx`):**
    -   Contiene los botones para cambiar entre las vistas "Servicios" y "Empresas" (`feedView`).
    -   Incluye la barra de búsqueda que actualiza el `searchQuery` en el `CoraboContext`.
    -   Ofrece accesos directos al GPS, cotizaciones, transacciones y un menú desplegable con más opciones.
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
    -   Permite a los clientes ver la galería, la reputación y la información de contacto de la empresa.
    -   La interacción con la galería (cambiar de imagen, ver detalles) está gestionada localmente con `useState`.

### 4.4. Registro de Transacciones (`src/app/transactions/*`)

Este es un módulo financiero clave para que los proveedores gestionen sus operaciones.

1.  **Página de Activación (`src/app/transactions/settings/page.tsx`):**
    -   **Flujo de Verificación en 2 Pasos:** Antes de poder usar el módulo, el proveedor debe activarlo.
    -   **Paso 1: Verificación de Identidad:** El usuario debe subir una foto de su cédula. El sistema simula una lectura y valida que los datos coincidan con los de la cuenta Corabo. Si no coinciden, se muestra un error informativo.
    -   **Paso 2: Registro de Cuenta de Pago:** Una vez verificada la identidad, el usuario debe registrar una cuenta bancaria o pago móvil. El sistema valida (de forma simulada) que el titular de la cuenta sea el mismo usuario.
    -   **Activación y Redirección:** Tras una verificación exitosa, el módulo se activa, se asigna un límite de crédito "CREDICORA" de $150 y el usuario es redirigido automáticamente a la página principal de transacciones.

2.  **Panel de Control de Transacciones (`src/app/transactions/page.tsx`):**
    -   **Estado Inactivo:** Si el módulo no está activo, muestra una pantalla que invita al usuario a activarlo, con un botón que lleva a la página de ajustes (`/transactions/settings`).
    -   **Estado Activo:** Cuando el módulo está activo, la página muestra:
        -   Gráficos de ingresos y egresos (lineal o de tarta).
        -   Una tarjeta "CREDICORA" con el límite de crédito disponible.
        -   Accesos directos a "Lista de Pendientes", "Transacciones" y "Compromisos de Pagos".
        -   Una tarjeta de llamado a la acción para suscribirse y obtener más beneficios.
        -   Un **menú de ajustes (engranaje)** que permite:
            -   Imprimir un registro en PDF de los últimos 3 meses.
            -   Modificar los datos de pago.
            -   Desactivar el registro (con un diálogo de advertencia previo).

### 4.5. Flujo de Cotizaciones y Monetización

1.  **Formulario de Cotización (`src/app/quotes/page.tsx`):**
    -   Permite a los usuarios solicitar cotizaciones para productos o servicios.
    -   Incluye un componente de "Búsqueda Avanzada" (`AdvancedSearchOptions.tsx`) con opciones premium bloqueadas (ej: "Usuarios Verificados").

2.  **Diálogo de Oferta (`AdvancedQuoteDialog.tsx`):**
    -   Al hacer clic en una opción bloqueada, se abre un modal que ofrece dos rutas:
        -   **Pago por Uso:** Para enviar una cotización a más proveedores. Redirige a la página de pago.
        -   **Suscripción:** Invita al usuario a suscribirse para obtener beneficios ilimitados.

3.  **Página de Pago (`src/app/quotes/payment/page.tsx`):**
    -   Presenta una interfaz de pago aislada (sin header/footer principal).
    -   Permite al usuario seleccionar un monto a pagar, el cual desbloquea diferentes niveles de alcance para su cotización.
    -   Muestra los datos para realizar un pago móvil o transferencia y permite subir un comprobante.

4.  **Formulario de Cotización PRO (`src/app/quotes/pro/page.tsx`):**
    -   Tras un pago exitoso, el usuario es redirigido a esta versión mejorada del formulario.
    -   La opción de búsqueda avanzada que pagó aparece desbloqueada y resaltada, confirmando el beneficio.

## 5. Conclusión

El prototipo actual tiene una base sólida y una lógica bien definida. El `CoraboContext` actúa eficazmente como un motor de estado central, y los flujos de usuario están optimizados para la búsqueda, conexión, gestión financiera y monetización. Los futuros desarrollos deben seguir estos patrones para mantener la coherencia y la escalabilidad del proyecto.
