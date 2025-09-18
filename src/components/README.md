# /src/components

Este directorio alberga todos los componentes de React reutilizables de la aplicación, organizados por funcionalidad para mantener un proyecto limpio y escalable.

## Estructura

-   **`/` (Raíz):** Contiene componentes de alto nivel o muy genéricos que se utilizan en múltiples partes de la aplicación.
    -   `Footer.tsx`: El pie de página de navegación principal.
    -   `Header.tsx`: La cabecera principal de la aplicación.
    -   `UserProfilePage.tsx`: El componente principal que renderiza el perfil de un usuario, reutilizado para el perfil propio y para ver perfiles de otros.
    -   ... y otros componentes globales.

-   **`/admin`**: Componentes específicos para el Panel de Administración.
    -   `UserManagementTab.tsx`: Tabla y lógica para gestionar usuarios.
    -   `PaymentVerificationTab.tsx`: Interfaz para verificar pagos.
    -   ... y otras pestañas y diálogos del panel.

-   **`/auth`**: Componentes relacionados con la autenticación.
    -   `AuthProvider.tsx`: El proveedor de contexto principal que gestiona el estado del usuario autenticado.

-   **`/charts`**: Componentes de gráficos (ej. `TransactionsLineChart.tsx`).

-   **`/profile`**: Componentes específicos para las distintas secciones del perfil de usuario.

-   **`/profile-setup`**: Componentes para el flujo de configuración inicial del perfil.

-   **`/ui`**: Contiene los componentes de la biblioteca de UI (shadcn/ui). Estos son componentes "primitivos" y estilizados (Button, Card, Input, etc.) que se utilizan para construir componentes más complejos. **No deben contener lógica de negocio**.
