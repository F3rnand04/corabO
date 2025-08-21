
# Arquitectura y Flujo de Datos de Corabo (Post-Refactorización)

Este documento describe la arquitectura estable y desacoplada de la aplicación Corabo, diseñada para ser mantenible, escalable y eficiente.

---

## 1. Principio Fundamental: Responsabilidad Única Separada

La aplicación ahora se rige por un principio estricto: cada parte del sistema tiene una sola responsabilidad.

-   **Componentes de UI (React):** Se encargan exclusivamente de renderizar la interfaz y capturar las interacciones del usuario. No contienen lógica de negocio.
-   **Capa de Acciones (`src/lib/actions.ts`):** Es el **único intermediario** entre la UI y el backend. Contiene funciones de servidor (`'use server'`) que son llamadas por los componentes. Su trabajo es orquestar las llamadas a los flujos de negocio.
-   **Flujos de Negocio (Genkit):** Cada flujo (`src/ai/flows/*.ts`) encapsula una única lógica de negocio (ej. crear un usuario, procesar un pago, enviar una notificación). Son independientes entre sí y no se llaman unos a otros directamente para evitar dependencias circulares.
-   **Contexto de React (`src/contexts/CoraboContext.tsx`):** Su única responsabilidad es actuar como un **proveedor de estado en tiempo real** para el cliente. Se suscribe a las colecciones de Firestore y distribuye los datos actualizados a toda la aplicación. No realiza mutaciones ni contiene lógica de negocio.
-   **Componentes de Servidor (Next.js):** Se utilizan para obtener los datos iniciales de una página durante el renderizado en el servidor. Pasan estos datos como `props` a los componentes de cliente.
-   **Configuración:** La configuración del proyecto (`next.config.js`, `src/env.mjs`) es ahora robusta y está validada, asegurando un arranque estable del servidor.

---

## 2. Diagrama de Flujo de Datos (El Engranaje Perfecto)

Este diagrama ilustra la nueva arquitectura de comunicación, que es unidireccional y predecible.

```mermaid
graph TD
    subgraph "Cliente (Navegador)"
        A[Componente de UI<br/>(ej. Button, Input)] -- "1. Interacción del Usuario" --> B[Función de Acción<br/>(en `src/lib/actions.ts`)];
        B -- "2. Llama al Flujo de Genkit" --> C_PROXY[Proxy del Servidor Next.js];
        F[CoraboContext] -- "5. Provee Estado Actualizado" --> A;
    end

    subgraph "Servidor (Node.js)"
        C_PROXY -- "3. Ejecuta el Flujo" --> D[Flujo de Genkit<br/>(ej. `createCampaignFlow`)];
        D -- "4. Modifica Datos" --> E[Base de Datos<br/>(Firestore)];
    end

    subgraph "Sincronización en Tiempo Real"
        E -- "Notifica Cambios" --> F;
    end
```

### Descripción del Flujo:

1.  **Interacción del Usuario:** Un usuario hace clic en un botón en un componente de React.
2.  **Llamada a la Acción:** El componente no modifica el estado directamente. Llama a una función `async` importada desde `src/lib/actions.ts`.
3.  **Ejecución en el Servidor:** Next.js ejecuta la acción en el servidor, la cual a su vez invoca al flujo de Genkit correspondiente.
4.  **Mutación de Datos:** El flujo de Genkit realiza la lógica de negocio y actualiza la base de datos en Firestore.
5.  **Actualización Reactiva:** El listener de `CoraboContext` (que se ejecuta en el cliente) detecta el cambio en Firestore y actualiza el estado global.
6.  **Re-renderizado:** React re-renderiza los componentes que dependen de ese estado, mostrando la información actualizada al usuario de forma automática.

Esta arquitectura elimina las condiciones de carrera, las dependencias circulares y los fallos de renderizado, garantizando una aplicación estable y performante.
