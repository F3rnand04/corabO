# Resumen de Progreso y Plan de Refactorización Integral

Este documento resume la arquitectura, funcionalidad y, más importante, el **plan de acción definitivo** para estabilizar y optimizar la aplicación Corabo.

---

## Manifiesto Arquitectónico: Principio de Responsabilidad Separada

A partir de este momento, todo el desarrollo y refactorización del proyecto Corabo se adherirá al siguiente principio:

*   **Cada componente, hook o servicio debe tener una única y bien definida responsabilidad.** Se evitará a toda costa la creación de "Componentes Dios" o "Contextos Dios" que manejen lógica no relacionada. La lógica de negocio (llamadas al backend) se aislará en la capa de acciones, el estado global se gestionará en contextos específicos, el estado local se manejará en los componentes, y las funcionalidades complejas (como el carrito o la autenticación) tendrán sus propios hooks o proveedores dedicados. **La integración se logrará a través de una composición clara (como engranajes), no a través de una centralización monolítica.**

---

## Plan de Refactorización y Auditoría Integral (15 Pasos)

Este plan está diseñado para desmantelar sistemáticamente la arquitectura monolítica actual y reconstruirla sobre una base modular, eficiente y mantenible.

### Fase I: Cimentación y Estructura del Backend (Pasos 1-4)

*   **Paso 1: Sanear la Configuración del Servidor.** Corregir `next.config.js`, `firebase-server.ts` y la inicialización de Genkit para garantizar que el servidor arranque sin errores fatales.
*   **Paso 2: Aislar la Lógica de Negocio.** Crear una capa de servicio (`src/lib/actions.ts`) que será el único intermediario entre la UI y los flujos de Genkit, eliminando todas las llamadas al backend desde los contextos y componentes.
*   **Paso 3: Refactorizar `CoraboContext` a un Proveedor de Datos Puro.** Despojar al `CoraboContext` de toda responsabilidad que no sea la de proveer estado global en tiempo real (datos de Firestore: usuarios, transacciones, etc.).
*   **Paso 4: Refactorizar `AuthProvider` a un Proveedor de Autenticación Puro.** `AuthProvider` solo gestionará el estado de la sesión de Firebase (`firebaseUser`), sin conocimiento de la base de datos de Corabo.

### Fase II: Desacoplamiento de Funcionalidades Clave (Pasos 5-8)

*   **Paso 5: Crear Hook `useCart`.** Extraer toda la lógica del carrito de compras (obtener carrito, añadir, quitar, calcular total) a un hook dedicado `useCart`, que consumirá el estado de `CoraboContext` y llamará a las funciones de `actions.ts`.
*   **Paso 6: Aislar el Componente de Checkout.** Refactorizar `CheckoutAlertDialogContent` para que sea un componente autónomo que utilice el hook `useCart` y llame a la acción `checkout`.
*   **Paso 7: Aislar la Lógica de Sesión QR.** Refactorizar la lógica de `startQrSession`, `setQrSessionAmount`, etc., para que sea gestionada por `actions.ts` y consumida directamente por las páginas `scan-qr` y `show-qr`, sin pasar por el contexto.
*   **Paso 8: Abstraer la Lógica de Publicaciones.** Mover toda la lógica relacionada con la creación (`UploadDialog`) y visualización de publicaciones (`PublicationCard`) para que dependa de `actions.ts` y no del `CoraboContext`.

### Fase III: Refactorización y Optimización de la UI (Pasos 9-12)

*   **Paso 9: Descomponer `TransactionDetailsDialog`.** Este componente es demasiado complejo. Se dividirá en sub-componentes basados en el estado de la transacción (`PendingQuote`, `PendingPayment`, `RatingScreen`, etc.) para simplificar su lógica.
*   **Paso 10: Descomponer `ProfileHeader`.** La cabecera del perfil de usuario maneja la edición de la imagen, la visualización de estadísticas y las acciones. Se dividirá en componentes más pequeños con responsabilidades únicas.
*   **Paso 11: Optimizar Componentes de Listas.** Auditar `TransactionList` y `ConversationCard` para asegurar que cada ítem gestione su propio estado derivado, evitando re-renderizados de toda la lista cuando solo un ítem cambia.
*   **Paso 12: Refactorizar Formularios de Configuración.** Descomponer los formularios de `profile-setup` y `profile/details` en componentes más pequeños y manejables, cada uno responsable de una sección (ej. `ScheduleEditor`, `PaymentDetailsForm`).

### Fase IV: Auditoría Final y Documentación (Pasos 13-15)

*   **Paso 13: Auditar el Flujo de Datos Completo.** Realizar una traza completa del flujo de datos, desde la interacción del usuario en un componente hasta la actualización en Firestore y el retorno del estado a la UI, para validar la arquitectura de "engranajes".
*   **Paso 14: Análisis de Rendimiento.** Utilizar las herramientas de desarrollo de React para identificar y eliminar cualquier re-renderizado innecesario que haya quedado tras la refactorización.
*   **Paso 15: Actualizar Documentación.** Este es el paso final. Actualizar todos los documentos (`DOCS.md`, `MANUAL_DE_FUNCIONAMIENTO.md`, etc.) para que reflejen la nueva arquitectura de **Responsabilidad Separada**, incluyendo diagramas de flujo que muestren la interacción entre los componentes, hooks y acciones.
