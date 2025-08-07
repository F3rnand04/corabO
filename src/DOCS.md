# Documentación del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento detalla la arquitectura y la lógica de funcionamiento de la aplicación Corabo, construida con **Next.js, React, TypeScript, Firebase y Genkit**.

La aplicación ha evolucionado de un prototipo cliente-céntrico a una aplicación web robusta con una arquitectura cliente-servidor, diseñada para ser segura y escalable.

### Principios Arquitectónicos Clave:

-   **Frontend Moderno:** La interfaz se construye con componentes reutilizables de React y ShadCN/UI, aprovechando el App Router de Next.js para la navegación.
-   **Backend Seguro con Genkit:** La lógica de negocio crítica (creación de campañas, envío de mensajes, gestión de acuerdos) se ha migrado del frontend a **flujos de Genkit**. Estos flujos se ejecutan en el servidor, garantizando que las operaciones sean seguras y que la lógica de negocio no pueda ser manipulada desde el cliente.
-   **Autenticación y Base de Datos con Firebase:**
    -   **Firebase Authentication:** Gestiona el inicio de sesión de usuarios a través de proveedores como Google, proporcionando un sistema de autenticación seguro y real.
    -   **Firestore Database:** Actúa como la base de datos principal, almacenando en tiempo real la información de usuarios, transacciones y conversaciones.
-   **Gestión de Estado del Cliente (`CoraboContext.tsx`):** El `CoraboContext` ahora actúa como un gestor de estado del lado del cliente y un puente de comunicación. Se suscribe a los datos de Firestore en tiempo real y llama a los flujos de Genkit del backend para ejecutar acciones, manteniendo la UI reactiva y sincronizada.

## 2. Flujo de Autenticación y Datos

1.  **Inicio de Sesión:** El usuario es dirigido a `/login`, donde utiliza Firebase Authentication para iniciar sesión con su cuenta de Google.
2.  **Sincronización de Datos:** Una vez autenticado, `CoraboContext` se suscribe a las colecciones de Firestore relevantes para el usuario (sus transacciones, conversaciones, etc.).
3.  **Interacción:** Cuando el usuario realiza una acción (ej. enviar una propuesta), el componente de la interfaz llama a una función en el `CoraboContext`.
4.  **Ejecución en Backend:** El `CoraboContext` a su vez llama al flujo de Genkit correspondiente (ej. `acceptProposalFlow`).
5.  **Lógica Segura:** El flujo de Genkit se ejecuta en el servidor, realiza las validaciones necesarias y actualiza la base de datos de Firestore.
6.  **Actualización en Tiempo Real:** El cambio en Firestore es detectado por el `CoraboContext` en el cliente, y la interfaz se actualiza automáticamente.

## 3. Lógica de Negocio y Flujos de Genkit (`src/ai/flows/*`)

Los flujos de Genkit son el nuevo cerebro de la lógica de negocio. Actualmente tenemos:

-   **`campaign-flow.ts`**: Gestiona la creación de campañas publicitarias, incluyendo el cálculo de costos, la aplicación de descuentos y la creación de la transacción de pago correspondiente en Firestore.
-   **`message-flow.ts`**: Maneja el envío de mensajes y, crucialmente, el ciclo de vida de las propuestas de acuerdo. Se encarga de validar la propuesta y crear la transacción correspondiente de forma segura cuando un cliente la acepta.

## 4. Estructura de Datos (`src/lib/types.ts`)

La estructura de datos sigue siendo la misma, pero ahora estos tipos son compartidos entre el frontend y los flujos de backend de Genkit, asegurando consistencia en toda la aplicación. Las colecciones principales en Firestore (`users`, `transactions`, `conversations`) se basan en estos tipos.

## 5. Conclusión

La arquitectura actual es sólida, segura y escalable, preparada para pruebas multi-equipo y futuras expansiones. La separación clara entre el frontend (React/Next.js), el backend (Genkit) y la base de datos (Firestore) permite un desarrollo modular y eficiente. Los próximos pasos deben centrarse en migrar el resto de la lógica de negocio del `CoraboContext` a nuevos flujos de Genkit.