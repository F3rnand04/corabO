# Resumen de Progreso y Estado Actual de Corabo

Este documento resume la arquitectura, funcionalidad y flujos de usuario implementados y estabilizados en la aplicación Corabo hasta la fecha.

---

## 1. Arquitectura y Estructura del Proyecto

La aplicación ha evolucionado hacia una arquitectura moderna y robusta Cliente-Servidor, diseñada para ser escalable y segura.

-   **Framework Principal:** Next.js con el **App Router**.
-   **Frontend:** Construido con React, TypeScript y componentes de **ShadCN/UI** sobre Tailwind CSS.
-   **Backend (Lógica de Negocio):** La lógica crítica (creación de usuarios, publicaciones, transacciones, etc.) se gestiona a través de **flujos de Genkit**, marcados con la directiva `'use server'`. Esto asegura una separación clara entre el código que se ejecuta en el servidor y el que se ejecuta en el navegador, resolviendo los problemas de compilación y carga.
-   **Base de Datos y Autenticación:** Se utiliza **Firebase** como la plataforma principal:
    -   **Firestore:** Actúa como la base de datos en tiempo real para toda la información (usuarios, publicaciones, transacciones, conversaciones).
    -   **Firebase Authentication:** Gestiona el registro y la autenticación de usuarios de forma segura (actualmente con Google).
-   **Gestión de Estado (Cliente):** El `CoraboContext` (`src/contexts/CoraboContext.tsx`) funciona como el "cerebro" del lado del cliente. Se suscribe a los datos de Firestore en tiempo real para mantener la interfaz actualizada y actúa como un puente, llamando a los flujos de Genkit del backend para ejecutar acciones y persistir cambios.

---

## 2. Flujo de Rutas y Navegación

El enrutamiento está centralizado y controlado lógicamente por el componente `AppLayout.tsx`, que actúa como un guardián.

1.  **Ruta de Login (`/login`):** Punto de entrada para usuarios no autenticados.
2.  **Redirección Post-Login:**
    -   Si un usuario es **nuevo** y su perfil no está completo (`isInitialSetupComplete` es `false`), es redirigido forzosamente a `/initial-setup`.
    -   Si un usuario ya tiene su perfil completo, es dirigido a la página principal (`/`).
3.  **Configuración Inicial (`/initial-setup`):** Un flujo obligatorio para nuevos usuarios donde deben proporcionar sus datos de identidad básicos (nombre, país, cédula). Esta página ya no tiene lógica de redirección propia, evitando bucles.
4.  **Rutas Protegidas:** El `AppLayout` asegura que solo los usuarios autenticados y con la configuración inicial completa puedan acceder al resto de la aplicación.

---

## 3. Funcionalidad y Características Principales

### 3.1. Gestión de Perfil
-   **Autenticación Real:** El inicio de sesión con Google funciona y está conectado al emulador de Firebase.
-   **Creación y Actualización de Perfiles:** Los usuarios pueden configurar su perfil desde cero (`/profile-setup`) y la información se guarda correctamente en Firestore.
-   **Perfiles Dinámicos:** La vista del perfil de un proveedor (`/companies/[id]`) cambia automáticamente según el `offerType` de su perfil:
    -   **`'service'`**: Muestra una galería de publicaciones (como Instagram).
    -   **`'product'`**: Muestra un catálogo de productos con precios y carrito de compras.

### 3.2. Publicaciones y Feed
-   **Feed Principal (`/`):** Muestra un feed de publicaciones de todos los proveedores. La lógica de filtrado por categoría y búsqueda por texto está implementada y funciona.
-   **Creación de Contenido:** Los proveedores pueden subir nuevas publicaciones (imágenes/videos) o productos a través del diálogo de carga (`UploadDialog`), que invoca a los flujos seguros de Genkit en el backend.

### 3.3. Interacción y Transacciones
-   **Chat y Propuestas:** La mensajería entre usuarios está operativa. Los proveedores pueden enviar "Propuestas de Acuerdo" formalizadas desde el chat, que se crean y guardan de forma segura en el backend.
-   **Aceptación de Acuerdos:** Los clientes pueden aceptar estas propuestas, lo que automáticamente crea una transacción en Firestore con el estado inicial correcto (basado en si el cliente está suscrito o no).
-   **Ciclo de Vida de Transacciones:** El flujo completo para una transacción de servicio está implementado:
    1.  Proveedor marca trabajo como finalizado.
    2.  Cliente confirma la recepción y califica el servicio.
    3.  Cliente procede a registrar el pago.
    4.  Proveedor confirma la recepción del pago, completando la transacción.

### 3.4. Activación de Cuenta y Pagos
-   **Flujo de Activación Guiado:** El banner `ActivationWarning` guía correctamente al usuario a través de los pasos necesarios para activar las transacciones:
    1.  Completar perfil inicial.
    2.  Verificar documento de identidad con IA (`/profile-setup/verify-id`).
    3.  Configurar métodos de pago (`/transactions/settings`).
-   **Módulo de Registro (`/transactions`):** El panel financiero es completamente funcional. Muestra gráficos, resúmenes y listas de transacciones pendientes e históricas, y permite gestionar los compromisos de pago.
-   **Credicora:** La lógica de niveles, límites y cálculo de cuotas está integrada en el contexto.

### 3.5. Estabilidad y Pruebas
-   **Pipeline de Integración Corregido:** Todos los "engranajes" de las pruebas automáticas (`login`, `activación`, `paginación`) han sido reparados y ahora se ejecutan con éxito, garantizando que las funcionalidades clave son estables y no tienen regresiones.
-   **Estructura de Proyecto Estandarizada:** El proyecto ahora sigue las convenciones recomendadas para la organización de archivos de prueba y configuración de Jest, asegurando que el comando `npm test` funcione correctamente desde la terminal.
