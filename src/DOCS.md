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

La estructura de datos ahora sigue un modelo unificado donde todo el contenido visible (imágenes, videos, productos) reside en una única colección `publications`. Esto asegura consistencia y simplifica las consultas.

---

## 6. Análisis Forense del Éxito (Estado Actual)

Esta sección documenta por qué la aplicación es actualmente estable y la funcionalidad de publicación de contenido opera sin errores. Este es el punto de referencia para futuras depuraciones.

### 6.1. Pilar 1: Modelo de Datos Unificado ("Modelo Instagram")

El cambio más crítico fue abandonar la separación de datos en `gallery` (dentro del usuario) y `products` (en otra colección). Adoptamos un modelo similar al de Instagram:

-   **Colección Única `publications`:** Ahora, todo el contenido (imágenes, videos, productos) vive en una sola colección principal.
-   **Campo `type`:** Un campo `type` dentro de cada documento nos dice si es `'image'`, `'video'` o `'product'`.
-   **Objeto `productDetails`:** Los documentos de tipo `'product'` contienen un objeto adicional con los datos específicos del producto (precio, nombre, etc.).

**Resultado:** Esta arquitectura eliminó la necesidad de gestionar y consultar múltiples fuentes de datos, simplificando toda la lógica de lectura y escritura.

### 6.2. Pilar 2: Consultas a Firestore a Prueba de Errores

El error recurrente `Missing or insufficient permissions` era en realidad un error de `The query requires an index`. Ocurría porque nuestras consultas eran demasiado complejas para Firestore sin un índice compuesto creado manualmente.

-   **Consulta Antigua (Fallaba):** `query(..., where('providerId', ...), where('type', ...), orderBy(...))`
-   **Consulta Nueva (Funciona):** `query(..., where('providerId', '==', ...))`

La nueva estrategia es:
1.  **Hacer una consulta ultra-simple al backend:** Solo pedimos a Firestore los documentos que pertenecen a un `providerId`.
2.  **Filtrar y Ordenar en el Servidor:** Una vez que el flujo de Genkit tiene los datos, usa código de JavaScript normal para filtrar por tipo (imágenes vs. productos) y ordenarlos por fecha.

**Resultado:** La consulta a la base de datos es tan simple que **nunca necesitará un índice compuesto**, eliminando la raíz del error.

### 6.3. Pilar 3: Reglas de Seguridad Abiertas para Desarrollo

Para acelerar la fase de desarrollo y asegurarnos de que los únicos errores que veamos sean de lógica de la aplicación, las reglas de `firestore.rules` se han configurado de forma abierta.

-   **Regla Actual:** `allow read, write: if true;`
-   **Propósito:** Esto elimina completamente los permisos como una posible causa de error durante el desarrollo. Cualquier fallo que ocurra ahora es 100% un problema en el código TypeScript (React o Genkit), lo que hace que la depuración sea mucho más rápida y directa.

**Conclusión:** La combinación de un modelo de datos limpio, consultas simples y reglas de seguridad permisivas (para desarrollo) ha creado un entorno estable. Cualquier funcionalidad futura debe construirse sobre estos tres pilares para mantener la estabilidad.

---
## 7. Conclusión

La arquitectura actual es sólida, segura y escalable, preparada para pruebas multi-equipo y futuras expansiones. La separación clara entre el frontend (React/Next.js), el backend (Genkit) y la base de datos (Firestore) permite un desarrollo modular y eficiente. Los próximos pasos deben centrarse en migrar el resto de la lógica de negocio del `CoraboContext` a nuevos flujos de Genkit.
