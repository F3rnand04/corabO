# Resumen de Progreso y Estado Actual de Corabo

Este documento resume la arquitectura, funcionalidad y flujos de usuario implementados y estabilizados en la aplicación Corabo hasta la fecha.

---

## 1. Arquitectura y Estructura del Proyecto

La aplicación ha sido refactorizada a una arquitectura moderna y robusta Cliente-Servidor, diseñada para ser escalable, segura y mantenible.

-   **Framework Principal:** Next.js con el **App Router**.
-   **Frontend:** Construido con React, TypeScript y componentes de **ShadCN/UI** sobre Tailwind CSS. La UI es reactiva y se encarga únicamente de la presentación de datos y la captura de interacciones.
-   **Backend (Lógica de Negocio):** La lógica de negocio crítica (creación de usuarios, publicaciones, transacciones, etc.) se gestiona a través de **flujos de Genkit**, que son orquestados por una capa de **Server Actions** (`src/lib/actions.ts`). Esta arquitectura asegura una separación clara entre el código que se ejecuta en el servidor y el del navegador.
-   **Base de Datos y Autenticación:** Se utiliza **Firebase** como la plataforma principal:
    -   **Firestore:** Actúa como la base de datos en tiempo real para toda la información (usuarios, publicaciones, transacciones).
    -   **Firebase Authentication:** Gestiona la autenticación segura de usuarios (con Google). La sesión se verifica en el servidor mediante **cookies de sesión HTTPOnly** y se hidrata en el cliente de forma consistente, eliminando errores de sincronización.
-   **Gestión de Estado (Cliente):** El `CoraboContext` (`src/contexts/CoraboContext.tsx`) actúa como un proveedor de datos en tiempo real. Se suscribe a las colecciones de Firestore y distribuye los datos actualizados a toda la aplicación una vez que el usuario está autenticado y su perfil ha sido cargado.

---

## 2. Flujo de Rutas y Navegación

El enrutamiento está centralizado y controlado lógicamente por el componente `AppLayout.tsx`, que actúa como un guardián del lado del cliente.

1.  **Ruta de Login (`/login`):** Punto de entrada para usuarios no autenticados.
2.  **Redirección Post-Login:**
    -   Si un usuario es **nuevo** (`isInitialSetupComplete` es `false`), es redirigido forzosamente a `/initial-setup`.
    -   Si un usuario ya tiene su perfil completo, es dirigido a la página principal (`/`).
3.  **Configuración Inicial (`/initial-setup`):** Un flujo obligatorio para nuevos usuarios donde deben proporcionar sus datos de identidad básicos.
4.  **Rutas Protegidas:** `AppLayout` asegura que solo los usuarios autenticados y con la configuración inicial completa puedan acceder a las rutas protegidas de la aplicación.

---

## 3. Funcionalidad y Características Principales

### 3.1. Gestión de Perfil y Verificación
-   **Reputación Dinámica:** La calificación, el índice de efectividad y la agilidad de pago se calculan y muestran en tiempo real.
-   **Perfiles Especializados:** Formularios dinámicos para que los proveedores añadan detalles específicos de su profesión (salud, hogar, etc.), enriqueciendo su perfil público.
-   **Verificación con IA:** El sistema utiliza un modelo multimodal de Genkit para analizar documentos de identidad (imágenes o PDF) y verificar la información del usuario de forma automática.
-   **Afiliaciones:** Las empresas pueden gestionar solicitudes de afiliación de profesionales desde un panel de administración, añadiendo una capa de confianza y verificación.

### 3.2. Panel de Control y Transacciones
-   **Dashboard Financiero (`/transactions`):** Los proveedores tienen un panel de control con gráficos que muestran la evolución de sus ingresos y egresos.
-   **Ciclo de Vida de Transacciones:** El flujo completo (creación, propuesta, aceptación, pago, confirmación, calificación) está implementado y gestionado de forma segura por el backend.
-   **Carrito Multi-Proveedor:** El carrito de compras agrupa los productos por proveedor, permitiendo gestionar pre-facturas individuales.
-   **Modelo de Comisión:** El sistema calcula y genera automáticamente la transacción de comisión para Corabo por cada venta de "Compra Directa" (pago por QR), asegurando la monetización de la plataforma.

### 3.3. Interacción y Puntos de Venta
-   **Chat y Propuestas:** La mensajería entre usuarios está operativa, con la capacidad de enviar "Propuestas de Acuerdo" formales.
-   **Gestión de Cajas (Puntos de Venta):** Las empresas pueden crear múltiples cajas, cada una con un código QR único y descargable, facilitando los pagos directos en puntos de venta físicos.
-   **Sistema de Notificaciones:** El backend envía notificaciones para eventos críticos como solicitudes de afiliación, alertas de pago y errores de delivery (simulado).

### 3.4. Estabilidad y Arquitectura
-   **Configuración de Compilación Robusta:** Los problemas de compilación y los errores de servidor han sido resueltos al ajustar `next.config.js` y `tsconfig.json` para alinear el proyecto con las mejores prácticas del App Router de Next.js.
-   **Errores de Hidratación Solucionados:** Se implementó un flujo de autenticación server-side en `RootLayout` que utiliza cookies de sesión, eliminando las discrepancias entre el HTML del servidor y el renderizado del cliente.
-   **Estructura de Proyecto Limpia:** Se ha optimizado la estructura de archivos y la configuración para un mantenimiento más sencillo y una clara separación de responsabilidades.