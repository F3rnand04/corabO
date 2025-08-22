# Arquitectura y Flujo de Datos de Corabo (Versión Estable)

Este documento describe la arquitectura estable y desacoplada de la aplicación Corabo, diseñada para ser mantenible, escalable y eficiente bajo los principios del App Router de Next.js.

---

## 1. Principio Fundamental: Lógica de Servidor Centralizada y Flujo de Datos Unidireccional

La aplicación se rige por un principio estricto de separación de responsabilidades para garantizar la estabilidad y prevenir errores de hidratación:

-   **Renderizado del Lado del Servidor (SSR) con Verificación de Sesión:** El `RootLayout` (`src/app/layout.tsx`) actúa como un Server Component. Utiliza la SDK de Firebase Admin para verificar la sesión del usuario en el servidor antes de renderizar la página. El estado inicial del usuario se pasa al cliente para garantizar una hidratación consistente.
-   **`AppLayout.tsx` (El Guardián del Cliente):** Este componente es el núcleo de la lógica de enrutamiento del lado del cliente. Basándose en el estado de autenticación (que ya viene pre-cargado desde el servidor), decide si mostrar un loader, forzar redirecciones a `/login` o a `/initial-setup`, o dar acceso a la aplicación.
-   **Componentes de UI (React):** Se encargan exclusivamente de renderizar la interfaz y capturar las interacciones del usuario. No contienen lógica de negocio directa.
-   **Capa de Acciones (`src/lib/actions.ts`):** Es el **único intermediario** entre la UI y el backend. Contiene funciones de servidor (`'use server'`) que son llamadas por los componentes. Su trabajo es orquestar las llamadas a los flujos de Genkit o interactuar directamente con la base de datos.
-   **Contexto de React (`src/contexts/CoraboContext.tsx`):** Su única responsabilidad es actuar como un **proveedor de estado en tiempo real** para el cliente. Se suscribe a las colecciones de Firestore y distribuye los datos actualizados a toda la aplicación una vez que el usuario está autenticado y cargado.

Esta arquitectura desacoplada resuelve los errores de hidratación y asegura que la lógica de negocio permanezca en el servidor, mientras que la UI reacciona a los cambios en los datos.

---

## 2. Diagrama de Flujo de Datos (Arquitectura Actual)

Este diagrama ilustra la nueva arquitectura de comunicación, que es unidireccional y predecible.

```mermaid
graph TD
    subgraph "Servidor (Node.js)"
        A[Request a /] --> B{RootLayout (Server Component)};
        B -- "1. Verifica cookie de sesión" --> C[Firebase Admin SDK];
        C -- "2. Devuelve Firebase User o null" --> B;
    end

    subgraph "Cliente (Navegador)"
        B -- "3. Renderiza HTML con serverFirebaseUser" --> D[AuthProvider];
        D -- "4. Inicializa estado con serverFirebaseUser" --> E[CoraboProvider];
        E -- "5. Obtiene currentUser de Firestore" --> F[Componente de UI];
        F -- "6. Usuario interactúa" --> G[Función de Acción en actions.ts];
        H[Firestore] -- "9. Sincroniza en tiempo real" --> E;
        E -- "10. Actualiza estado global" --> F;
    end
    
    subgraph "Backend (Server Actions)"
        G -- "7. Llama a Flujo de Genkit" --> I[Genkit Flow];
        I -- "8. Modifica datos" --> H;
    end
```

### Descripción del Flujo:

1.  **Verificación en el Servidor:** Una petición llega al `RootLayout`, que verifica la cookie de sesión del usuario con Firebase Admin.
2.  **Estado Inicial:** El `RootLayout` renderiza el HTML inicial, pasando el objeto de usuario (o `null`) al `AuthProvider`.
3.  **Hidratación Consistente:** El `AuthProvider` en el cliente se inicializa con el mismo estado que el servidor, evitando errores de hidratación.
4.  **Carga del Perfil:** El `CoraboProvider`, al recibir un usuario de Firebase, obtiene el perfil completo (`currentUser`) desde Firestore.
5.  **Interacción del Usuario:** El usuario hace clic en un botón en un componente de React.
6.  **Llamada a la Acción:** El componente llama a una función `async` importada desde `src/lib/actions.ts`.
7.  **Ejecución en el Servidor:** La acción ejecuta la lógica de negocio correspondiente llamando a un flujo de Genkit.
8.  **Actualización de Datos:** El flujo de Genkit modifica los datos en Firestore.
9.  **Sincronización Reactiva:** El listener de Firestore en `CoraboContext` detecta el cambio en la base de datos y actualiza el estado global.
10. **Re-renderizado:** React re-renderiza los componentes que dependen de ese estado, mostrando la información actualizada.

Esta arquitectura elimina las condiciones de carrera y los fallos de renderizado, garantizando una aplicación estable y de alto rendimiento.
