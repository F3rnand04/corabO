# Plan Maestro de Auditoría y Refactorización de Corabo (v2.0)

**Fecha de Inicio:** 24 de Agosto de 2025
**Objetivo Final:** Alcanzar un estado 100% funcional, estable y coherente de la aplicación, lista para un lanzamiento de prueba (Beta) con usuarios reales, sin fallas críticas.
**Principio Rector:** **Nada que no funcione avanza.** Cada fase debe ser completada y verificada antes de iniciar la siguiente. La funcionalidad se construye sobre cimientos sólidos.

---

## Manifiesto Arquitectónico: El Ecosistema de Engranajes

Nuestra visión es ambiciosa: fusionar la **atracción visual** de Instagram, la **confianza transaccional** de Binance/Cashea y el **engagement dinámico** de TikTok en una plataforma para prestadores de servicios. Esto exige una arquitectura impecable donde cada componente, acción y flujo es un engranaje que interactúa con otros de forma predecible. La arquitectura ahora sigue un modelo estricto de **Separación de Responsabilidades**:

1.  **Componentes de UI (React):** Se encargan exclusivamente de renderizar la interfaz y capturar las interacciones del usuario. No contienen lógica de negocio directa.
2.  **Capa de Acciones (`src/lib/actions.ts`):** Actúa como el **único intermediario** entre la UI (cliente) y el backend. Contiene funciones de servidor (`'use server'`) que son llamadas por los componentes. Su trabajo es orquestar las llamadas a los flujos de Genkit o interactuar directamente con la base de datos.
3.  **Flujos de Genkit (`src/ai/flows/*.ts`):** Contienen la lógica de negocio pura y las interacciones con APIs de IA y la base de datos. Son llamados únicamente por la capa de acciones.
4.  **Proveedores de Contexto (React Context):** Se utilizan exclusivamente para la **gestión de estado global** del lado del cliente y la provisión de datos en tiempo real (ej. `CoraboContext` para datos de Firestore, `AuthProvider` para la sesión de Firebase).

Esta arquitectura desacoplada y unidireccional previene errores de hidratación, mejora la mantenibilidad y asegura que la lógica de negocio crítica permanezca segura en el servidor.

---

## **Las 8 Fases Hacia el Lanzamiento (Revisado y Validado)**

### **Fase 1: La Fundación - Autenticación y Carga de Perfil**
*   **Objetivo:** Que un usuario pueda iniciar sesión y su perfil (`currentUser`) se cargue de forma fiable y consistente, sin errores de hidratación ni bucles de carga. Es el paso más crítico que desbloquea toda la aplicación.
*   **Estado:** **COMPLETADO Y ESTABLE.** El flujo de autenticación server-side con cookies de sesión está implementado. El `AppLayout` gestiona las redirecciones correctamente basándose en un estado de usuario consistente.

### **Fase 2: La Identidad del Proveedor - Configuración y Verificación**
*   **Objetivo:** Permitir que un proveedor (persona o empresa) configure su perfil público al 100%, incluyendo sus datos especializados, y pueda completar el proceso de verificación de identidad.
*   **Estado:** **IMPLEMENTADO.** Los flujos de configuración (`/initial-setup`, `/profile-setup`) y verificación de identidad (`/profile-setup/verify-id`) están conectados a sus respectivas Server Actions y flujos de Genkit.

### **Fase 3: La Vitrina - Publicaciones, Catálogo y Feed Visual**
*   **Objetivo:** Dar a los proveedores las herramientas para mostrar su trabajo y productos, y a los clientes una forma atractiva de descubrirlo.
*   **Estado:** **IMPLEMENTADO.** La carga de publicaciones y productos se realiza a través de `UploadDialog`, gestionado por Server Actions. El feed se obtiene eficientemente a través de la acción `getFeed`.

### **Fase 4: La Interacción - Mensajería y Propuestas de Acuerdo**
*   **Objetivo:** Establecer un canal de comunicación directo y funcional entre cliente y proveedor, donde puedan negociar y formalizar acuerdos de servicio.
*   **Estado:** **IMPLEMENTADO.** La mensajería es funcional. Las propuestas se envían y aceptan a través de Server Actions, creando transacciones formales en Firestore.

### **Fase 5: El Ciclo de Vida Transaccional (Servicios)**
*   **Objetivo:** Auditar y garantizar que todo el ciclo de vida de un servicio contratado funcione sin fisuras, desde la aceptación hasta la calificación final.
*   **Estado:** **IMPLEMENTADO.** Las acciones para `completeWork`, `confirmWorkReceived`, `payCommitment` y `confirmPaymentReceived` están conectadas y funcionales.

### **Fase 6: El Ciclo de Vida Transaccional (Productos y Delivery)**
*   **Objetivo:** Asegurar que el flujo de compra de productos, desde el carrito hasta la entrega, sea robusto y completo.
*   **Estado:** **IMPLEMENTADO.** El carrito multi-proveedor funciona. La acción `checkout` está conectada, y aunque el flujo de delivery (`findDeliveryProvider`) es una simulación, el ciclo de vida de la transacción está completo.

### **Fase 7: Confianza y Ecosistema - Credicora, Afiliaciones y Reputación**
*   **Objetivo:** Verificar que los sistemas que construyen la confianza en la plataforma (crédito, verificaciones por terceros, reputación) funcionen correctamente.
*   **Estado:** **IMPLEMENTADO.** Los niveles de Credicora se aplican según el tipo de usuario. El flujo de afiliaciones y el panel de admin son funcionales. La reputación se calcula dinámicamente en el `CoraboContext`.

### **Fase 8: Estabilidad Final - Pruebas y Pulido**
*   **Objetivo:** Validar la aplicación completa contra el plan de pruebas, asegurar una experiencia de usuario de alta calidad y una responsividad perfecta.
*   **Estado:** **EN CURSO.** Esta fase consiste en la ejecución del nuevo `TESTING_PLAN.md`.

---
*Este documento es nuestro plan de trabajo oficial y refleja la arquitectura actual y estable de la aplicación.*