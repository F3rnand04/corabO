# Resumen de Progreso y Estado Actual de Corabo

Este documento resume la arquitectura, funcionalidad y flujos de usuario implementados y estabilizados en la aplicación Corabo hasta la fecha.

---

## 1. Arquitectura y Estructura del Proyecto

La aplicación ha evolucionado hacia una arquitectura moderna y robusta Cliente-Servidor, diseñada para ser escalable y segura.

-   **Framework Principal:** Next.js con el **App Router**.
-   **Frontend:** Construido con React, TypeScript y componentes de **ShadCN/UI** sobre Tailwind CSS.
-   **Backend (Lógica de Negocio):** La lógica crítica (creación de usuarios, publicaciones, transacciones, etc.) se gestiona a través de **flujos de Genkit**, marcados con la directiva `'use server'`. Esto asegura una separación clara entre el código que se ejecuta en el servidor y el que se ejecuta en el navegador.
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
3.  **Configuración Inicial (`/initial-setup`):** Un flujo obligatorio para nuevos usuarios donde deben proporcionar sus datos de identidad básicos.
4.  **Rutas Protegidas:** El `AppLayout` asegura que solo los usuarios autenticados y con la configuración inicial completa puedan acceder al resto de la aplicación.

---

## 3. Funcionalidad y Características Principales

### 3.1. Sistema de Reputación Dinámico
El corazón de la confianza en Corabo. Es un sistema 100% funcional y automatizado que calcula la reputación de un usuario en tiempo real.
-   **Calificación por Estrellas:** Basada en el promedio de las calificaciones de los clientes.
-   **Índice de Efectividad:** Mide la fiabilidad. Comienza en 100% y se ajusta dinámicamente:
    -   **Aumenta** con cada transacción completada con éxito.
    -   **Disminuye** por disputas o cancelaciones.
-   **Agilidad de Pago:** Mide la rapidez con la que un cliente paga después de que un servicio es marcado como finalizado. Se categoriza y colorea para una fácil visualización (ej., "00-05 min" en verde, "+45 min" en rojo).
-   **Gestión de Inactividad:** Las cuentas se pausan automáticamente tras 45 días de inactividad para mantener la plataforma relevante.

### 3.2. Gestión de Perfil y Publicaciones
-   **Autenticación Real:** El inicio de sesión con Google funciona y está conectado al emulador de Firebase.
-   **Perfiles Dinámicos:** La vista del perfil de un proveedor (`/companies/[id]`) cambia automáticamente según si ofrece `'service'` (galería tipo Instagram) o `'product'` (catálogo de productos con carrito).
-   **Creación de Contenido:** Los proveedores pueden subir nuevas publicaciones (imágenes/videos) o productos a través del diálogo de carga (`UploadDialog`), que invoca a los flujos seguros de Genkit.

### 3.3. Interacción y Transacciones
-   **Chat y Propuestas:** La mensajería entre usuarios está operativa. Los proveedores pueden enviar "Propuestas de Acuerdo" formales desde el chat.
-   **Ciclo de Vida de Transacciones:** El flujo completo está implementado:
    1.  Proveedor marca trabajo como finalizado.
    2.  Cliente confirma la recepción y califica.
    3.  El sistema registra el **timestamp de la solicitud de pago**.
    4.  Cliente registra el pago, y el sistema registra el **timestamp del envío del pago**.
    5.  Proveedor confirma la recepción del pago, completando la transacción.

### 3.4. Sistema de Notificaciones Inteligente
-   **Gestión de Cobranza:** El sistema envía recordatorios de pago automáticos y proactivos (7, 2 y 1 día antes del vencimiento). Si un pago se retrasa, las notificaciones escalan, primero al usuario con advertencias y luego al administrador para una intervención directa.
-   **Marketing Dirigido:** Se envían notificaciones moderadas y relevantes sobre nuevas campañas o productos a los usuarios interesados, basándose en sus contactos y categorías de interés.

### 3.5. Estabilidad y Pruebas
-   **Pipeline de Integración Corregido:** Todos los tests de integración (`login`, `activación`, `paginación`) han sido reparados y actualizados para reflejar la lógica actual, asegurando la estabilidad de las funcionalidades clave.
-   **Estructura de Proyecto Limpia:** Se han eliminado rutas y componentes redundantes, y la configuración de Jest se ha estandarizado.
