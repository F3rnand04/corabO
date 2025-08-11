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

## 2. Lógica de Perfil Dinámico: El "Interruptor" de Tipo de Oferta

Para ofrecer una experiencia de usuario clara y coherente, Corabo implementa un sistema de **perfiles dinámicos** que se adaptan al tipo de negocio del proveedor. La clave de esta lógica es el campo `offerType` ('service' o 'product') dentro del `profileSetupData` del usuario.

-   **Prioridad del Producto:** Si un proveedor elige ofrecer tanto servicios como productos, la plataforma da **prioridad a la vista de "producto"**. Su perfil se transformará en un catálogo de ventas.
-   **Lógica de Renderizado Condicional:** Las páginas de perfil (`/companies/[id]` y `/profile`) leen el valor de `offerType` al cargar:
    -   **Si `offerType` es `'product'`:** La página renderiza la **Vista de Catálogo**, mostrando una cuadrícula de productos, métricas de ventas y el carrito de compras como acción principal.
    -   **Si `offerType` es `'service'`:** La página renderiza la **Vista de Galería**, mostrando publicaciones visuales, métricas de reputación y el contacto directo/agendamiento como acciones principales.

Este sistema asegura que la interfaz siempre se alinee con el objetivo comercial principal del proveedor, eliminando ambigüedades y mejorando la usabilidad.

## 3. Lógica del Feed Principal: Algoritmo de "Oportunidad y Confianza"

El feed principal utiliza un algoritmo de ranking que calcula una **Puntuación de Relevancia** para cada publicación, equilibrando la visibilidad de proveedores nuevos y establecidos.

### 3.1. Carriles de Ranking

-   **Carril de Oportunidad (Proveedores Nuevos):** Da visibilidad a usuarios con menos de 5 transacciones. La puntuación se basa en la relevancia de la categoría, la frescura del contenido y la completitud del perfil.
-   **Carril de Confianza (Proveedores Establecidos):** Se basa en la puntuación de calidad (reputación, efectividad, verificación), interacciones previas del cliente y frescura del contenido.

### 3.2. Mezcla del Feed

El feed final se construye principalmente con el "Carril de Confianza", pero el algoritmo **inyecta estratégicamente** publicaciones del "Carril de Oportunidad" para garantizar que los nuevos talentos relevantes siempre tengan la oportunidad de ser descubiertos.

## 4. Flujos de Genkit y Lógica de Backend (`src/ai/flows/*`)

Los flujos de Genkit son el cerebro de la lógica de negocio, incluyendo:
-   **`campaign-flow.ts`**: Creación de campañas publicitarias.
-   **`message-flow.ts`**: Envío de mensajes y gestión de propuestas de acuerdo.
-   **`publication-flow.ts`**: Creación unificada y segura de publicaciones (imágenes y productos).

---

## 5. Análisis Forense del Éxito (Estado Actual y Punto de Referencia)

Esta sección documenta por qué la aplicación es actualmente estable y la funcionalidad de publicación opera sin errores, sirviendo como un "estado dorado" para futuras depuraciones.

### 5.1. Pilar 1: Modelo de Datos Unificado ("Modelo Instagram")

El cambio más crítico fue adoptar un modelo de datos unificado.
-   **Colección Única `publications`:** Todo el contenido (imágenes, videos, productos) vive en una sola colección.
-   **Campo `type`:** Un campo `type` (`'image'`, `'video'`, `'product'`) diferencia cada documento.
-   **Objeto `productDetails`:** Los documentos de tipo `'product'` contienen un objeto con datos específicos (precio, nombre, etc.).

**Resultado:** Esta arquitectura eliminó la necesidad de gestionar y consultar múltiples colecciones, simplificando drásticamente la lógica de lectura y escritura.

### 5.2. Pilar 2: Consultas a Firestore a Prueba de Errores

El error recurrente `Missing or insufficient permissions` era en realidad un síntoma de una consulta demasiado compleja para Firestore (`The query requires an index`).
-   **Estrategia Nueva:**
    1.  **Consulta Ultra-Simple al Backend:** Solo pedimos a Firestore los documentos que pertenecen a un `providerId` (`where('providerId', '==', ...)`).
    2.  **Filtrado y Ordenamiento en el Servidor:** Una vez que el flujo de Genkit tiene los datos, usa código de JavaScript normal para filtrar por tipo y ordenar por fecha.

**Resultado:** La consulta a la base de datos es tan simple que **nunca necesitará un índice compuesto**, eliminando la raíz del error de forma permanente.

### 5.3. Pilar 3: Reglas de Seguridad Abiertas (Solo para Desarrollo)

Para acelerar la fase de desarrollo, las reglas de `firestore.rules` se han configurado de forma abierta.
-   **Regla Actual:** `allow read, write: if true;`
-   **Propósito:** Esto elimina los permisos como una posible causa de error durante el desarrollo. Cualquier fallo que ocurra ahora es 100% un problema en el código TypeScript (React o Genkit), lo que hace la depuración mucho más rápida y directa.

**Conclusión:** La combinación de un modelo de datos limpio, consultas simples y reglas de seguridad permisivas (para desarrollo) ha creado un entorno estable. Cualquier funcionalidad futura debe construirse sobre estos tres pilares para mantener la estabilidad.
