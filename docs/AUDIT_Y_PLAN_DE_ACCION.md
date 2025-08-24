# Plan Maestro de Auditoría y Refactorización de Corabo (v2.0)

**Fecha de Inicio:** 24 de Agosto de 2025
**Objetivo Final:** Alcanzar un estado 100% funcional, estable y coherente de la aplicación, lista para un lanzamiento de prueba (Beta) con usuarios reales, sin fallas críticas.
**Principio Rector:** **Nada que no funcione avanza.** Cada fase debe ser completada y verificada antes de iniciar la siguiente. La funcionalidad se construye sobre cimientos sólidos.

---

## Manifiesto Arquitectónico: El Ecosistema de Confianza

Nuestra visión es ambiciosa: fusionar la **atracción visual** de Instagram, la **confianza transaccional** de Binance/Cashea y el **engagement dinámico** de TikTok en una plataforma para prestadores de servicios. Esto exige una arquitectura impecable. Cada componente, acción y flujo es un engranaje. Si un engranaje falla, todo el sistema se detiene. Esta auditoría es la inspección completa para asegurar que cada pieza funcione a la perfección.

---

## **Las 8 Fases Hacia el Lanzamiento**

### **Fase 1: La Fundación - Autenticación y Carga de Perfil**
*   **Objetivo:** Que un usuario pueda iniciar sesión y su perfil (`currentUser`) se cargue de forma fiable y consistente, sin errores de hidratación ni bucles de carga. Es el paso más crítico que desbloquea toda la aplicación.
*   **Auditoría de Componentes y Flujos:**
    *   `next.config.js`, `tsconfig.json`, `package.json`: Garantizar la compatibilidad de dependencias y la configuración de compilación.
    *   `src/lib/actions.ts`: Reconstruir como el único "puente" de comunicación, empezando con `getOrCreateUser`.
    *   `AuthProvider.tsx` y `CoraboContext.tsx`: Refactorizar para un flujo de carga de datos unidireccional y sin condiciones de carrera.
    *   `auth-flow.ts`: Asegurar que `getOrCreateUserFlow` devuelve datos serializables.
    *   `AppLayout.tsx`: Verificar que la lógica de redirección post-login (`/` o `/initial-setup`) es infalible.
*   **Criterio de Completado:** Un usuario nuevo se redirige a `/initial-setup`. Un usuario existente accede al feed (`/`). El `currentUser` está disponible globalmente. La aplicación es estable tras el login.

### **Fase 2: La Identidad del Proveedor - Configuración y Verificación**
*   **Objetivo:** Permitir que un proveedor (persona o empresa) configure su perfil público al 100%, incluyendo sus datos especializados, y pueda completar el proceso de verificación de identidad.
*   **Auditoría de Componentes y Flujos:**
    *   `/initial-setup`: Flujo de configuración inicial.
    *   `/profile-setup/**`: Rutas de configuración detallada para proveedores.
    *   `/profile-setup/verify-id`: Flujo de carga y verificación de documentos.
    *   `verification-flow.ts`: El flujo de IA para analizar documentos.
    *   `profile-flow.ts`: Todos los flujos relacionados con la actualización del perfil.
    *   Componentes en `src/components/profile/specialized-fields/`: Todos los formularios dinámicos.
*   **Criterio de Completado:** Un proveedor puede rellenar todos los campos de su perfil. La verificación de identidad (con IA o manual) es funcional. Los datos se guardan y se muestran correctamente.

### **Fase 3: La Vitrina - Publicaciones, Catálogo y Feed Visual**
*   **Objetivo:** Dar a los proveedores las herramientas para mostrar su trabajo y productos, y a los clientes una forma atractiva de descubrirlo. Es la capa "Instagram" de Corabo.
*   **Auditoría de Componentes y Flujos:**
    *   `FeedClientComponent.tsx` y `PublicationCard.tsx`: El corazón del feed.
    *   `UploadDialog.tsx`: El componente para subir nuevas publicaciones y productos.
    *   `ImageDetailsDialog.tsx` y `ProductDetailsDialog.tsx`: Vistas de detalle.
    *   `/profile/publications` y `/profile/catalog`: Pestañas del perfil.
    *   `publication-flow.ts` y `feed-flow.ts`: Lógica de backend para crear y obtener contenido.
*   **Criterio de Completado:** Un proveedor puede publicar un servicio/producto y este aparece en su perfil y en el feed principal. Un cliente puede ver, dar like y comentar en las publicaciones.

### **Fase 4: La Interacción - Mensajería y Propuestas de Acuerdo**
*   **Objetivo:** Establecer un canal de comunicación directo y funcional entre cliente y proveedor, donde puedan negociar y formalizar acuerdos de servicio.
*   **Auditoría de Componentes y Flujos:**
    *   `/messages` y `/messages/[id]`: Listado de chats y vista de chat individual.
    *   `ConversationCard.tsx` y `ProposalDialog.tsx`: Componentes clave de la interfaz de mensajería.
    *   `message-flow.ts`: Backend para enviar mensajes y aceptar propuestas.
    *   `transaction-flow.ts`: La lógica que convierte una propuesta aceptada en una transacción formal.
*   **Criterio de Completado:** Dos usuarios pueden iniciar una conversación. Un proveedor puede enviar una propuesta. Un cliente puede aceptarla, creando una transacción pendiente en el sistema.

### **Fase 5: El Ciclo de Vida Transaccional (Servicios)**
*   **Objetivo:** Auditar y garantizar que todo el ciclo de vida de un servicio contratado funcione sin fisuras, desde la aceptación hasta la calificación final.
*   **Auditoría de Componentes y Flujos:**
    *   `TransactionDetailsDialog.tsx`: El modal central para gestionar cada paso.
    *   `transaction-flow.ts`: Todos los flujos que modifican el estado de una transacción (`completeWork`, `confirmWorkReceived`, `payCommitment`, `confirmPaymentReceived`).
    *   `/transactions`: La vista de registro donde los usuarios monitorean sus transacciones.
*   **Criterio de Completado:** Un proveedor puede marcar un trabajo como hecho. El cliente puede confirmar, calificar, pagar y subir un comprobante. El proveedor puede confirmar el pago, cerrando el ciclo.

### **Fase 6: El Ciclo de Vida Transaccional (Productos y Delivery)**
*   **Objetivo:** Asegurar que el flujo de compra de productos, desde el carrito hasta la entrega, sea robusto y completo.
*   **Auditoría de Componentes y Flujos:**
    *   `CartPopoverContent.tsx` y `CheckoutAlertDialogContent.tsx`: Componentes del carrito y pre-factura.
    *   `delivery-flow.ts`: El flujo crítico para encontrar repartidores.
    *   `/map`: La página para seleccionar la dirección de entrega (actualmente desactivada).
    *   `transaction-flow.ts`: La acción `checkout`.
*   **Criterio de Completado:** Un cliente puede añadir productos de múltiples proveedores al carrito. Puede realizar el checkout para un proveedor, seleccionar una dirección y método de entrega. Si se requiere delivery, el sistema busca un repartidor.

### **Fase 7: Confianza y Ecosistema - Credicora, Afiliaciones y Reputación**
*   **Objetivo:** Verificar que los sistemas que construyen la confianza en la plataforma (crédito, verificaciones por terceros, reputación) funcionen correctamente.
*   **Auditoría de Componentes y Flujos:**
    *   `/credicora`: Página informativa.
    *   `affiliation-flow.ts`: Lógica para que empresas verifiquen a profesionales.
    *   `/admin` (Pestaña de Afiliaciones): Interfaz de gestión para empresas.
    *   `credicoraLevels` y `credicoraCompanyLevels` en `types.ts`: Las reglas del sistema de crédito.
    *   Lógica de cálculo de reputación y efectividad en `CoraboContext`.
*   **Criterio de Completado:** Los niveles de Credicora se aplican correctamente. Una empresa puede aprobar la solicitud de un profesional. La reputación de los usuarios se actualiza dinámicamente con cada acción.

### **Fase 8: Estabilidad Final - Pulido, Pruebas y Responsividad**
*   **Objetivo:** Preparar la aplicación para el lanzamiento de prueba, asegurando una experiencia de usuario de alta calidad en todos los dispositivos.
*   **Auditoría de Componentes y Flujos:**
    *   Revisión de todos los componentes para un manejo de errores y estados de carga consistente (`try...catch`, loaders).
    *   Auditoría de CSS y layout en todas las páginas para garantizar la responsividad móvil y de escritorio.
    *   Pruebas manuales E2E (End-to-End) de todos los flujos principales.
    *   Revisión final de `firestore.indexes.json` para asegurar que todas las consultas de producción están cubiertas.
    *   Actualización de este mismo documento para reflejar el estado final de la aplicación.
*   **Criterio de Completado:** La aplicación es estable, robusta, visualmente pulida y está lista para recibir a sus primeros usuarios de prueba.

---
*Este documento es nuestro plan de trabajo oficial. Cada fase completada será registrada aquí.*