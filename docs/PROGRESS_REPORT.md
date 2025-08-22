# Resumen de Progreso y Estado Actual de Corabo

Este documento resume la arquitectura, funcionalidad y flujos de usuario implementados y estabilizados en la aplicación Corabo hasta la fecha.

---

## 1. Arquitectura y Estructura del Proyecto

La aplicación ha evolucionado hacia una arquitectura moderna y robusta Cliente-Servidor, diseñada para ser escalable y segura.

-   **Framework Principal:** Next.js con el **App Router**.
-   **Frontend:** Construido con React, TypeScript y componentes de **ShadCN/UI** sobre Tailwind CSS.
-   **Backend (Lógica de Negocio):** La lógica de negocio crítica (creación de usuarios, publicaciones, transacciones, etc.) se gestiona a través de **flujos de Genkit**, orquestados por una capa de **Server Actions** (`src/lib/actions.ts`). Esto asegura una separación clara entre el código que se ejecuta en el servidor y el que se ejecuta en el navegador.
-   **Base de Datos y Autenticación:** Se utiliza **Firebase** como la plataforma principal:
    -   **Firestore:** Actúa como la base de datos en tiempo real para toda la información (usuarios, publicaciones, transacciones).
    -   **Firebase Authentication:** Gestiona el registro y la autenticación de usuarios de forma segura (actualmente con Google). La sesión se verifica tanto en el servidor como en el cliente para evitar errores de hidratación.
-   **Gestión de Estado (Cliente):** El `CoraboContext` (`src/contexts/CoraboContext.tsx`) funciona como el "cerebro" del lado del cliente. Se suscribe a los datos de Firestore en tiempo real para mantener la interfaz actualizada y actúa como un puente, llamando a los flujos de Genkit del backend para ejecutar acciones y persistir cambios.

---

## 2. Flujo de Rutas y Navegación

El enrutamiento está centralizado y controlado lógicamente por el componente `AppLayout.tsx`, que actúa como un guardián del lado del cliente.

1.  **Ruta de Login (`/login`):** Punto de entrada para usuarios no autenticados.
2.  **Redirección Post-Login:**
    -   Si un usuario es **nuevo** y su perfil no está completo (`isInitialSetupComplete` es `false`), es redirigido forzosamente a `/initial-setup`.
    -   Si un usuario ya tiene su perfil completo, es dirigido a la página principal (`/`).
3.  **Configuración Inicial (`/initial-setup`):** Un flujo obligatorio para nuevos usuarios donde deben proporcionar sus datos de identidad básicos. Ahora incluye una opción para volver al login si se equivocaron de cuenta.
4.  **Rutas de Perfil (`/profile/*`):** La navegación del perfil ha sido reestructurada. Ahora utiliza rutas explícitas (`/profile/publications`, `/profile/catalog`, `/profile/details`) controladas por un layout principal, lo que garantiza una navegación coherente y sin errores.
5.  **Rutas Protegidas:** El `AppLayout` asegura que solo los usuarios autenticados y con la configuración inicial completa puedan acceder al resto de la aplicación.

---

## 3. Funcionalidad y Características Principales

### 3.1. Sistema de Reputación y Perfiles Especializados
-   **Reputación Dinámica:** La calificación por estrellas, el índice de efectividad y la agilidad de pago se calculan y muestran en tiempo real.
-   **Perfiles Especializados:** La lógica de los formularios de detalles (`/profile/details`) ha sido corregida y ahora es totalmente coherente. El sistema muestra los campos correctos (Salud, Hogar, Alimentos, etc.) basándose en la categoría principal del proveedor, sin errores.
-   **Credicora para Empresas:** Se ha implementado un sistema de crédito diferenciado y más potente para usuarios de tipo "Empresa", con mayores límites y mejores condiciones de pago.

### 3.2. Panel de Control del Proveedor (`/transactions`)
-   **Dashboard Financiero:** Los proveedores tienen un panel de control con gráficos de líneas y de torta que muestran la evolución de sus ingresos/egresos y la distribución de sus finanzas.
-   **Incentivo a la Suscripción:** Se ha integrado una tarjeta persuasiva que muestra los beneficios de suscribirse para mejorar la monetización.

### 3.3. Interacción y Transacciones
-   **Chat y Propuestas:** La mensajería entre usuarios está operativa, con la capacidad de enviar "Propuestas de Acuerdo" formales desde el chat.
-   **Ciclo de Vida de Transacciones:** El flujo completo (finalización, calificación, pago, confirmación) está implementado y es gestionado de forma segura por el backend.
-   **Carrito Multi-Proveedor:** El carrito de compras ahora agrupa los productos por proveedor, permitiendo gestionar pre-facturas individuales para cada uno.

### 3.4. Sistema de Notificaciones Inteligente
-   **Gestión de Cobranza:** El sistema envía recordatorios de pago automáticos y alertas de morosidad.
-   **Marketing Dirigido:** Se envían notificaciones de campañas a usuarios segmentados por intereses, **solo después de que el pago de la campaña sea verificado**.
-   **Alertas de Delivery:** Los proveedores reciben notificaciones instantáneas si el sistema no logra encontrar un repartidor para un pedido.

### 3.5. Verificación y Puntos de Venta
-   **Verificación con IA:** El sistema utiliza un modelo multimodal para analizar documentos de identidad (imágenes o PDF) y verificar la información del usuario de forma automática, usando un algoritmo de similitud para nombres.
-   **Afiliaciones:** Las empresas pueden gestionar las solicitudes de afiliación de profesionales desde un panel de administración dedicado.
-   **Gestión de Cajas (Puntos de Venta):** Las empresas ahora pueden crear múltiples cajas, cada una con un código QR único y descargable en formato de media carta, listo para imprimir. Esto facilita los pagos directos en puntos de venta físicos.

### 3.6. Estabilidad y Pruebas
-   **Configuración de Compilación Robusta:** Los problemas de compilación recurrentes y los errores 404 de servidor han sido **resueltos** al ajustar `next.config.js` (`srcDir` y `transpilePackages`) para que Next.js compile correctamente las dependencias del servidor y encuentre el directorio de la aplicación.
-   **Errores de Hidratación Solucionados:** Se implementó un flujo de autenticación server-side en `RootLayout` para pasar el estado de la sesión al cliente, eliminando las discrepancias entre el HTML del servidor y el renderizado del cliente.
-   **Estructura de Proyecto Limpia:** Se ha optimizado la estructura de archivos (eliminando la carpeta `app` vacía) y la configuración de `tsconfig.json` para un mantenimiento más sencillo.
