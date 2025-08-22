# Arquitectura y Flujo de Datos de Corabo (Versión Estable)

Este documento describe la arquitectura estable y desacoplada de la aplicación Corabo, diseñada para ser mantenible, escalable y eficiente bajo los principios del App Router de Next.js.

---

## 1. Principio Fundamental: Lógica Centralizada en `AppLayout` y Acciones del Servidor

La aplicación se rige por un principio estricto de separación de responsabilidades:

-   **Componentes de UI (React):** Se encargan exclusivamente de renderizar la interfaz y capturar las interacciones del usuario. No contienen lógica de negocio.
-   **Capa de Acciones (`src/lib/actions.ts`):** Es el **único intermediario** entre la UI y el backend. Contiene funciones de servidor (`'use server'`) que son llamadas por los componentes. Su trabajo es orquestar las llamadas a los flujos de negocio de Genkit o interactuar directamente con la base de datos.
-   **Flujos de Negocio (Genkit):** Cada flujo (`src/ai/flows/*.ts`) encapsula una lógica de negocio compleja (ej. procesar un pago, enviar una notificación masiva). Son independientes y reutilizables.
-   **`AppLayout.tsx` (El Guardián Central):** Este componente es el núcleo de la lógica de sesión y enrutamiento.
    -   Renderiza los proveedores de contexto (`AuthProvider`, `CoraboProvider`).
    -   Contiene un `LayoutController` que es la **única fuente de verdad** para la protección de rutas.
    -   Basándose en el estado del usuario (`currentUser`), decide si renderizar el `Header`/`Footer`, si redirigir a `/login` o a `/initial-setup`, o si mostrar el contenido de la aplicación.
    -   **No se utiliza un `middleware.ts`**. Toda la lógica de redirección se maneja de forma segura en este layout del lado del cliente, evitando bucles y errores de hidratación.
-   **Contexto de React (`src/contexts/CoraboContext.tsx`):** Su única responsabilidad es actuar como un **proveedor de estado en tiempo real** para el cliente. Se suscribe a las colecciones de Firestore y distribuye los datos actualizados a toda la aplicación. No realiza mutaciones ni contiene lógica de negocio.

---

## 2. Diagrama de Flujo de Datos (Arquitectura Actual)

Este diagrama ilustra la nueva arquitectura de comunicación, que es unidireccional y predecible.

```mermaid
graph TD
    subgraph "Cliente (Navegador)"
        A[Componente de UI<br/>(ej. Button, Input)] -- "1. Interacción del Usuario" --> B[Función de Acción<br/>(en `src/lib/actions.ts`)];
        F[CoraboContext] -- "4. Provee Estado Actualizado" --> A;
    end

    subgraph "Servidor (Node.js)"
        B -- "2. Llama a Flujo de Genkit / Lógica de Servidor" --> D[Flujo de Genkit o Lógica Directa en Acción];
        D -- "3. Modifica Datos" --> E[Base de Datos<br/>(Firestore)];
    end

    subgraph "Sincronización en Tiempo Real"
        E -- "Notifica Cambios a Listeners" --> F;
    end
```

### Descripción del Flujo:

1.  **Interacción del Usuario:** Un usuario hace clic en un botón en un componente de React.
2.  **Llamada a la Acción:** El componente llama a una función `async` importada desde `src/lib/actions.ts`.
3.  **Ejecución en el Servidor:** La acción ejecuta la lógica de negocio correspondiente, ya sea llamando a un flujo de Genkit o directamente modificando la base de datos en Firestore.
4.  **Actualización Reactiva:** El listener de Firestore en `CoraboContext` (que se ejecuta en el cliente) detecta el cambio en la base de datos y actualiza el estado global.
5.  **Re-renderizado:** React re-renderiza los componentes que dependen de ese estado, mostrando la información actualizada al usuario de forma automática y eficiente.

Esta arquitectura elimina las condiciones de carrera, las dependencias circulares y los fallos de renderizado, garantizando una aplicación estable y de alto rendimiento.
