# Resumen de Progreso y Estado Actual de Corabo

Este documento resume la arquitectura, funcionalidad y flujos de usuario implementados y estabilizados en la aplicación Corabo hasta la fecha.

---

## 1. Arquitectura y Estructura del Proyecto

La aplicación ha evolucionado hacia una arquitectura moderna y robusta Cliente-Servidor, diseñada para ser escalable y segura.

-   **Framework Principal:** Next.js con el **App Router**.
-   **Frontend:** Construido con React, TypeScript y componentes de **ShadCN/UI** sobre Tailwind CSS.
-   **Backend (Lógica de Negocio):** La lógica crítica (creación de usuarios, publicaciones, transacciones, etc.) se gestiona a través de **flujos de Genkit**, marcados con la directiva `'use server'`. Esto asegura una separación clara entre el código que se ejecuta en el servidor y el que se ejecuta en el navegador.
-   **Base de Datos y Autenticación:** Se utiliza **Firebase** como la plataforma principal:
    -   **Firestore:** Actúa como la base de datos en tiempo real para toda la información (usuarios, publicaciones, transacciones).
    -   **Firebase Authentication:** Gestiona el registro y la autenticación de usuarios de forma segura (actualmente con Google).
-   **Gestión de Estado (Cliente):** El `CoraboContext` (`src/contexts/CoraboContext.tsx`) funciona como el "cerebro" del lado del cliente. Se suscribe a los datos de Firestore en tiempo real para mantener la interfaz actualizada y actúa como un puente, llamando a los flujos de Genkit del backend para ejecutar acciones y persistir cambios.

---

## 2. Flujo de Rutas y Navegación

El enrutamiento está centralizado y controlado lógicamente por el componente `AppLayout.tsx`, que actúa como un guardián.

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

### 3.2. Panel de Control del Proveedor (`/transactions`)
-   **Dashboard Financiero:** Los proveedores tienen un panel de control con gráficos de líneas y de torta que muestran la evolución de sus ingresos/egresos y la distribución de sus finanzas.
-   **Incentivo a la Suscripción:** Se ha integrado una tarjeta persuasiva que muestra los beneficios de suscribirse para mejorar la monetización.

### 3.3. Interacción y Transacciones
-   **Chat y Propuestas:** La mensajería entre usuarios está operativa, con la capacidad de enviar "Propuestas de Acuerdo" formales desde el chat.
-   **Ciclo de Vida de Transacciones:** El flujo completo (finalización, calificación, pago, confirmación) está implementado y es gestionado de forma segura por el backend.

### 3.4. Sistema de Notificaciones Inteligente
-   **Gestión de Cobranza:** El sistema envía recordatorios de pago automáticos y alertas de morosidad.
-   **Marketing Dirigido:** Se envían notificaciones de campañas a usuarios segmentados por intereses.

### 3.5. Estabilidad y Pruebas
-   **Configuración de Compilación Robusta:** Los problemas de compilación recurrentes han sido resueltos aislando las configuraciones de prueba y optimizando el `package.json` para entornos de producción.
-   **Estructura de Proyecto Limpia:** Se han optimizado las rutas y componentes, y la configuración de Jest se ha estandarizado para un mantenimiento más sencillo.
