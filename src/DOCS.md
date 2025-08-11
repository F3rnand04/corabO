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

## 2. Lógica del Feed Principal: Algoritmo de "Oportunidad y Confianza"

Para asegurar un feed dinámico, relevante y justo, Corabo no utiliza un simple orden cronológico. En su lugar, implementa un algoritmo de ranking que calcula una **Puntuación de Relevancia** para cada publicación. Este sistema equilibra la visibilidad de los proveedores nuevos con la reputación de los establecidos.

### 2.1. Carriles de Ranking

El sistema utiliza dos "carriles" o lógicas de puntuación diferentes:

-   **Carril de Oportunidad (Para Proveedores Nuevos):** Diseñado para dar visibilidad a usuarios con menos de 5 transacciones y menos de 30 días en la plataforma. La puntuación se basa en:
    1.  **Relevancia para el Usuario:** Coincidencia entre la categoría de la publicación y los intereses del cliente.
    2.  **Frescura del Contenido:** Las publicaciones más recientes reciben un impulso.
    3.  **Calidad del Perfil:** Se bonifica a los proveedores que han completado su perfil al 100%.

-   **Carril de Confianza (Para Proveedores Establecidos):** Para usuarios con trayectoria, el ranking es una meritocracia basada en:
    1.  **Puntuación de Calidad:** Una combinación de **reputación (estrellas)**, **índice de efectividad (tiempo de respuesta)** y si el perfil está **verificado/suscrito**.
    2.  **Puntuación de Relevancia Personal:** Interacciones previas del cliente (si es un contacto, si ha dado likes) y la coincidencia con sus intereses.
    3.  **Frescura del Contenido:** Sigue siendo un factor, pero con menor peso.

### 2.2. Mezcla del Feed

El feed final que ve el usuario se construye principalmente con el "Carril de Confianza", pero el algoritmo **inyecta estratégicamente** publicaciones del "Carril de Oportunidad" en posiciones de alta visibilidad. Esto garantiza que los nuevos talentos relevantes siempre tengan la oportunidad de ser descubiertos, manteniendo un ecosistema competitivo y saludable.

## 3. Flujo de Autenticación y Datos

1.  **Inicio de Sesión:** El usuario es dirigido a `/login`, donde utiliza Firebase Authentication para iniciar sesión con su cuenta de Google.
2.  **Sincronización de Datos:** Una vez autenticado, `CoraboContext` se suscribe a las colecciones de Firestore relevantes para el usuario (sus transacciones, conversaciones, etc.).
3.  **Interacción:** Cuando el usuario realiza una acción (ej. enviar una propuesta), el componente de la interfaz llama a una función en el `CoraboContext`.
4.  **Ejecución en Backend:** El `CoraboContext` a su vez llama al flujo de Genkit correspondiente (ej. `acceptProposalFlow`).
5.  **Lógica Segura:** El flujo de Genkit se ejecuta en el servidor, realiza las validaciones necesarias y actualiza la base de datos de Firestore.
6.  **Actualización en Tiempo Real:** El cambio en Firestore es detectado por el `CoraboContext` en el cliente, y la interfaz se actualiza automáticamente.

## 4. Lógica de Negocio y Flujos de Genkit (`src/ai/flows/*`)

Los flujos de Genkit son el nuevo cerebro de la lógica de negocio. Actualmente tenemos:

-   **`campaign-flow.ts`**: Gestiona la creación de campañas publicitarias, incluyendo el cálculo de costos, la aplicación de descuentos y la creación de la transacción de pago correspondiente en Firestore.
-   **`message-flow.ts`**: Maneja el envío de mensajes y, crucialmente, el ciclo de vida de las propuestas de acuerdo. Se encarga de validar la propuesta y crear la transacción correspondiente de forma segura cuando un cliente la acepta.

## 5. Estructura de Datos (`src/lib/types.ts`)

La estructura de datos sigue siendo la misma, pero ahora estos tipos son compartidos entre el frontend y los flujos de backend de Genkit, asegurando consistencia en toda la aplicación. Las colecciones principales en Firestore (`users`, `transactions`, `conversations`) se basan en estos tipos.

## 6. Investigación Forense: El Error de Permisos Persistente

**Estado Actual (Punto de inflexión):** La aplicación puede mostrar publicaciones individuales (ej. en la página de perfil) pero sigue arrojando un error `FirebaseError: Missing or insufficient permissions` en la consola.

**Diagnóstico:** El error no se debe a las reglas de seguridad de lectura/escritura de documentos individuales, que son correctas. El error se origina por una **consulta compuesta** en la página de Mensajes (`/messages`).

La consulta problemática es:
`query(conversationsRef, where('participantIds', 'array-contains', USER_ID), orderBy('lastUpdated', 'desc'))`

Firestore no puede ejecutar una consulta que filtra por un campo de tipo `array` (`array-contains`) y ordena por un campo diferente (`orderBy`) sin un **índice compuesto** creado manualmente en la consola de Firebase. Al no existir este índice, la consulta falla y Firestore devuelve un error de permisos como fallback, aunque la causa real es una limitación de la consulta.

**Solución Temporal (Implementada):** Para estabilizar la aplicación para las pruebas, la cláusula `orderBy` ha sido eliminada de la consulta en el código. El ordenamiento ahora se realiza en el lado del cliente. Esto elimina el error y permite que la aplicación sea funcional, a la espera de la creación del índice compuesto en una fase posterior.

## 7. Conclusión

La arquitectura actual es sólida, segura y escalable, preparada para pruebas multi-equipo y futuras expansiones. La separación clara entre el frontend (React/Next.js), el backend (Genkit) y la base de datos (Firestore) permite un desarrollo modular y eficiente. Los próximos pasos deben centrarse en migrar el resto de la lógica de negocio del `CoraboContext` a nuevos flujos de Genkit.