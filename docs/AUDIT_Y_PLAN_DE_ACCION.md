# Plan Maestro de Auditoría y Refactorización de Corabo

**Fecha de Inicio:** 24 de Agosto de 2025
**Objetivo:** Alcanzar un estado funcional, estable y coherente de la aplicación, lista para un lanzamiento de prueba (Beta) con usuarios reales.
**Principio Rector:** Cada componente, acción y flujo debe tener una única y bien definida responsabilidad, integrándose como engranajes en un sistema mayor.

---

## Fase I: Auditoría Arquitectónica y Funcional (Completada)

### 1. Resumen del Diagnóstico

El análisis concluyó que la aplicación sufre de una **falla crítica en la capa de comunicación cliente-servidor**. Aunque los componentes de UI y la lógica de negocio en los flujos de Genkit están mayormente bien definidos, el "puente" que los une (las Server Actions de Next.js) está mal implementado.

*   **Causa Raíz:** Una configuración de compilación incorrecta y una implementación de `src/lib/actions.ts` que viola las reglas de las Server Actions de Next.js, creando una ruptura en la cadena de ejecución que impide que las llamadas del cliente lleguen al backend.
*   **Impacto Principal:** El flujo de login se bloquea, impidiendo que el perfil de usuario se cargue (`currentUser` permanece `null` en el contexto), lo que a su vez bloquea el acceso a todas las demás funcionalidades de la aplicación.

### 2. Inventario de Fallos Detectados

*   **Fallo Arquitectónico Central:** La capa de acciones (`src/lib/actions.ts`) no es funcional y rompe el build o falla silenciosamente.
*   **Fugas de Lógica:** Componentes del cliente intentan llamar directamente a flujos, o la lógica de carga de datos está dispersa en lugares incorrectos (ej. `CoraboContext` en lugar de `AuthProvider`).
*   **Rutas Incompletas:** Flujos de negocio como el `checkout` de productos no invocan los pasos subsecuentes (ej. `findDeliveryProvider`).
*   **Funcionalidades Desconectadas:** El mapa de selección de dirección (`MapPageContent`) está deshabilitado.
*   **Índices de Firestore Faltantes:** Se han identificado consultas que fallarán en producción sin los índices compuestos necesarios.
*   **Dependencias de Proyecto Incompletas:** Falta el paquete `firebase` del lado del cliente.

---

## Fase II: Plan de Acción Correctivo (Pendiente de Ejecución)

Este plan detalla los pasos necesarios para reconstruir los cimientos de la aplicación y llevarla a un estado funcional. Se ejecutará en orden de prioridad.

### **Sub-fase A: Reparación del Núcleo de Comunicación (Máxima Prioridad)**

*   **Paso 1: Reconstruir la Capa de Acciones (`src/lib/actions.ts`).**
    *   **Tarea:** Crear un nuevo `src/lib/actions.ts` desde cero.
    *   **Especificación:** Debe contener `export async function` explícitas para cada operación que el cliente necesite. Cada una de estas funciones será un *wrapper* que importa y llama al flujo de Genkit correspondiente.
    *   **Meta:** Crear un "puente" de Server Actions robusto y compatible con Next.js.

*   **Paso 2: Centralizar la Lógica de Carga de Usuario en `AuthProvider`.**
    *   **Tarea:** Modificar `AuthProvider.tsx` para que, una vez verificado el `firebaseUser`, sea este componente quien llame a la nueva acción `getOrCreateUser`.
    *   **Tarea:** `AuthProvider` gestionará el estado `isLoadingUser` y pasará el `currentUser` (perfil de Corabo) ya cargado al `CoraboContext`.
    *   **Meta:** Eliminar la condición de carrera y la falla de hidratación de una vez por todas.

*   **Paso 3: Simplificar `CoraboContext`.**
    *   **Tarea:** Eliminar toda la lógica de carga de usuario de `CoraboContext.tsx`.
    *   **Meta:** Convertirlo en un proveedor de estado puro que solo distribuye los datos que recibe.

*   **Paso 4: Corregir Dependencias y Configuración.**
    *   **Tarea:** Añadir el paquete `firebase` a `package.json`.
    *   **Tarea:** Crear un `firestore.indexes.json` para añadir los índices de Firestore requeridos.
    *   **Tarea:** Validar que `next.config.js` esté limpio y no contenga configuraciones conflictivas.
    *   **Meta:** Asegurar que el entorno de ejecución sea estable.

### **Sub-fase B: Conexión y Finalización de Flujos**

*   **Paso 5: Reconectar Todos los Componentes.**
    *   **Tarea:** Auditar cada componente que realizaba llamadas al backend (`PublicationCard`, `ImageDetailsDialog`, `TransactionDetailsDialog`, etc.) y asegurarse de que ahora importen y usen las funciones del nuevo `src/lib/actions.ts`.
    *   **Meta:** Unificar todas las interacciones con el backend a través de un único punto de entrada.

*   **Paso 6: Completar el Flujo de Checkout y Delivery.**
    *   **Tarea:** Modificar la acción `checkout` para que invoque correctamente el flujo `findDeliveryProvider`.
    *   **Tarea:** Crear la lógica en la UI (probablemente en `TransactionDetailsDialog`) para que el proveedor pueda gestionar un `Error de Delivery`.
    *   **Meta:** Hacer que el ciclo de vida de una compra de producto sea completamente funcional.

*   **Paso 7: Reactivar el Mapa de Selección de Dirección.**
    *   **Tarea:** Descomentar y reparar el componente `MapPageContent.tsx`.
    *   **Tarea:** Asegurar que, al seleccionar una dirección, se retorne correctamente a la página de checkout con la información actualizada.
    *   **Meta:** Habilitar la funcionalidad de envío a terceros.

### **Sub-fase C: Pulido y Pruebas Pre-Lanzamiento**

*   **Paso 8: Implementar Manejo de Errores y Estados de Carga.**
    *   **Tarea:** Envolver las llamadas a las acciones en bloques `try...catch` en los componentes cliente.
    *   **Tarea:** Utilizar el `isSubmitting` o estados de carga locales para dar feedback visual al usuario (ej. `Loader2` en los botones).
    *   **Meta:** Mejorar la experiencia de usuario y la robustez de la aplicación.

*   **Paso 9: Auditoría de Responsividad.**
    *   **Tarea:** Revisar todas las páginas principales (`/`, `/login`, `/profile`, `/transactions`, `/messages`) y asegurar que el diseño sea completamente funcional y estéticamente agradable tanto en vista móvil como en escritorio.
    *   **Meta:** Garantizar una experiencia de usuario consistente en todas las plataformas.

*   **Paso 10: Pruebas de Flujo Completo (End-to-End).**
    *   **Tarea:** Realizar una prueba manual completa de los siguientes flujos:
        1.  Registro y configuración de un nuevo proveedor.
        2.  Publicación de un nuevo servicio/producto.
        3.  Un cliente encuentra el producto y lo añade al carrito.
        4.  El cliente realiza el checkout y el pago.
        5.  El proveedor gestiona la transacción hasta su finalización.
    *   **Meta:** Validar que el sistema funciona como un todo integrado antes del lanzamiento de prueba.

---
*Este documento se actualizará a medida que cada paso se complete, sirviendo como el registro oficial del progreso del proyecto.*