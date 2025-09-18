# /src/hooks

Este directorio contiene los custom hooks de React que encapsulan lógica reutilizable y manejo de estado complejo, manteniendo los componentes limpios y enfocados en la UI.

## Hooks Principales

-   **`useAuth.ts`**:
    -   **Propósito:** Proporciona acceso al estado de autenticación de Firebase y a los datos del usuario logueado (`currentUser`).
    -   **Funcionalidad Clave:** Expone `firebaseUser`, `currentUser`, `isLoadingAuth` y la función `logout`. Es el único punto de contacto para saber quién es el usuario actual.
    -   **Uso:** Debe ser utilizado dentro de un `AuthProvider`.

-   **`useCorabo.ts`**:
    -   **Propósito:** Gestiona y provee todo el estado global de la aplicación que **no** es de autenticación.
    -   **Funcionalidad Clave:** Expone listas en tiempo real de `users`, `transactions`, `publications`, el estado del `cart`, `searchQuery`, etc. Separa la lógica de negocio del estado de autenticación.
    -   **Uso:** Debe ser utilizado dentro de un `CoraboProvider`.

-   **`useToast.ts`**:
    -   **Propósito:** Proporciona una forma estandarizada y sencilla de mostrar notificaciones "toast" (mensajes emergentes) en toda la aplicación.

-   **`use-mobile.ts`**:
    -   **Propósito:** Un hook simple para detectar si el usuario está en un dispositivo móvil, permitiendo renderizar componentes de forma condicional.
