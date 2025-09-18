# /src/lib

Este directorio contiene la lógica de negocio principal y las definiciones de tipos para la aplicación. Es el núcleo de la funcionalidad del lado del servidor y del cliente.

## Subdirectorios

-   **`/actions`**: Contiene todas las Server Actions de Next.js. Estas son las únicas funciones que los componentes de cliente deben importar para interactuar con el backend. Actúan como una capa de seguridad y orquestación, llamando a los flujos (`/flows`) para ejecutar la lógica de negocio.

-   **`/data`**: Almacena opciones y datos estáticos utilizados en toda la aplicación, como listas de categorías, bancos, o configuraciones que no cambian frecuentemente.

-   **`types.ts`**: El archivo más crítico. Define todas las interfaces y tipos de TypeScript (como `User`, `Transaction`, `Product`, etc.) que se usan en la aplicación. Sirve como la única fuente de verdad para la estructura de datos.

-   **`utils.ts`**: Proporciona funciones de utilidad reutilizables y puras, como formateo de fechas, cálculos matemáticos, etc.

-   **`firebase-admin.ts`**: Se encarga de la inicialización del SDK de Firebase Admin para operaciones de backend (usado exclusivamente por las Server Actions).

-   **`firebase-client.ts`**: Maneja la inicialización del SDK de Firebase para el lado del cliente (usado en componentes de React).

-   **`firebase-config.ts`**: Contiene el objeto de configuración de Firebase para el cliente. Es seguro exponerlo.
