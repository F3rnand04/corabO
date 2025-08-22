
# Documentación del Prototipo Corabo

## 1. Arquitectura y Filosofía Central

Este documento detalla la arquitectura y la lógica de funcionamiento de la aplicación Corabo, construida con **Next.js, React, TypeScript, Firebase y Genkit**.

La aplicación sigue un principio fundamental de **Activación Progresiva** para mejorar la experiencia del usuario y la retención, minimizando la fricción inicial.

### Principio de Activación Progresiva: El "Muro y las Puertas"

El flujo de incorporación de un usuario no es un proceso monolítico, sino una serie de etapas diseñadas para fomentar la exploración y la confianza.

1.  **Login es Acceso Inmediato:** El primer paso es la autenticación a través de un proveedor como Google. Una vez autenticado, el usuario **ya está dentro de la aplicación**. No se le bloquea en la entrada.

2.  **El Muro de Configuración (`/initial-setup`):** Inmediatamente después del primer login, el usuario se encuentra con un **muro obligatorio**. Esta es la única barrera infranqueable. Aquí debe proporcionar los datos mínimos para la creación de su perfil (nombre, país, tipo de usuario). Es imposible saltarse este paso. Un usuario que no lo complete, volverá a esta pantalla cada vez que inicie sesión.

3.  **Libertad de Navegación (El Perfil por Defecto):** Una vez superado el "muro", el usuario obtiene acceso a la mayor parte de la aplicación con un **perfil por defecto**. Este perfil es funcional pero restrictivo. El objetivo es que el usuario pueda navegar, explorar perfiles, ver el feed y familiarizarse con la plataforma sin sentirse abrumado por solicitudes de información adicional.

4.  **Las Puertas Opcionales (Activación de Módulos):** Funcionalidades críticas que requieren un mayor nivel de compromiso o datos sensibles (como las transacciones o la venta de productos) están detrás de "puertas opcionales". La aplicación le sugerirá al usuario activar estos módulos cuando intente usarlos (ej. un banner "¡Activa tu registro!" en la sección de transacciones), pero nunca le impedirá seguir usando el resto de la aplicación.

Este enfoque reduce la carga cognitiva inicial, genera confianza y permite que el usuario se integre a su propio ritmo, descubriendo el valor de la plataforma de forma orgánica.

### Componentes Arquitectónicos Clave:

-   **Frontend Moderno:** La interfaz se construye con componentes reutilizables de React y ShadCN/UI, aprovechando el App Router de Next.js.
-   **Backend Seguro con Genkit:** La lógica de negocio crítica (creación de campañas, envío de mensajes, etc.) se gestiona en **flujos de Genkit**.
-   **Base de Datos y Autenticación:** Se utiliza **Firebase** (Firestore y Authentication).
-   **Controlador de Layout (`AppLayout.tsx`):** Es el **guardián central** que implementa la lógica del "Muro y las Puertas". Decide si mostrar un loader, forzar la redirección a `/initial-setup`, o dar acceso a la aplicación principal, eliminando condiciones de carrera.
-   **Gestión de Estado (`CoraboContext.tsx`):** Actúa como un proveedor de estado en tiempo real, suscribiéndose a los datos de Firestore y distribuyéndolos a la aplicación una vez que la lógica de enrutamiento del `AppLayout` se ha completado.
