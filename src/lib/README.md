# /src/lib

This directory contains the core business logic and type definitions for the application. It is the heart of both server-side and client-side functionality.

## Directiva Operativa Central

**IMPORTANTE:** Queda terminantemente prohibido alterar, eliminar o modificar la funcionalidad existente de los componentes, los flujos de la aplicación o el diseño de la interfaz de usuario. Cualquier optimización o cambio debe realizarse garantizando que **TODOS** los componentes y funcionalidades permanezcan 100% operativos y sin cambios en su comportamiento de cara al usuario. El objetivo es mejorar el rendimiento y la mantenibilidad del código subyacente sin afectar la lógica de negocio ya establecida.

## Subdirectories

-   **/actions**: Contains all Next.js Server Actions. These are the **only** functions that client components should import to interact with the backend. They act as a security and orchestration layer, calling flows (`/ai/flows`) to execute business logic.

-   **/data**: Stores static options and data used throughout the application, such as lists of categories, banks, or configurations that do not change frequently.

-   **`types.ts`**: The most critical file. It defines all TypeScript interfaces and types (like `User`, `Transaction`, `Product`, etc.) used across the application. It serves as the single source of truth for the data structure.

-   **`utils.ts`**: Provides reusable, pure utility functions like date formatting, mathematical calculations, etc.

-   **`firebase-admin.ts`**: Handles the initialization of the Firebase Admin SDK for backend operations (used exclusively by Server Actions and flows).

-   **`firebase-client.ts`**: Manages the initialization of the Firebase client-side SDK (used in React components and hooks).

-   **`firebase-config.ts`**: Contains the Firebase configuration object for the client. It is safe to expose this.

-   **`REPORT.md`**: A comprehensive report detailing the final, functional state of the application's architecture and modules after moving from simulation to a real, working implementation.