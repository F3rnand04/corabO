# Manual de Funcionamiento del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento es una guía exhaustiva sobre la funcionalidad, lógica de negocio y flujos de usuario del prototipo Corabo. La aplicación está diseñada como una plataforma de conexión robusta y segura, con una arquitectura centrada en componentes reutilizables (React, ShadCN/UI) y una lógica de negocio centralizada en `CoraboContext.tsx`.

---

## 2. Perfiles de Usuario y Flexibilidad de Roles

La plataforma es un ecosistema flexible donde los roles pueden evolucionar.

### 2.1. Flexibilidad y Límites
- **Cambio de Rol:** Un usuario puede empezar como Cliente y decidir convertirse en Proveedor (o viceversa). Sin embargo, para fomentar la estabilidad, la plataforma simula una restricción del mundo real: al intentar cambiar el tipo de perfil principal, se muestra una **advertencia** de que este cambio solo estaría permitido cada 6 meses en una versión de producción.
- **"Emprende por Hoy":** Esta funcionalidad actúa como una válvula de escape a la regla anterior, permitiendo a cualquier usuario probar una idea de negocio (servicio o producto) por 24 horas sin necesidad de alterar su perfil principal.

### 2.2. Pausar Perfil de Proveedor
- **Funcionalidad:** Los proveedores tienen la opción de **pausar su perfil** directamente desde sus ajustes.
- **Consecuencias:** Al pausar, el perfil del proveedor se vuelve **invisible** en las búsquedas del feed principal. Además, el sistema simula una **penalización en su reputación y efectividad**, reflejando el impacto negativo de no estar disponible para los clientes.
- **Reactivación:** El proveedor puede reactivar su perfil en cualquier momento para volver a ser visible.

---

## 3. Guía Funcional de Pantallas y Componentes

### 3.1. Navegación Principal: El Pie de Página Dinámico (`Footer.tsx`)
La barra de navegación inferior es el centro de control principal y su comportamiento es contextual. Consta de 5 botones:

1.  **Inicio (`/`):** Icono de casa. Te lleva al feed principal.
2.  **Videos (`/videos`):** Icono de "Play". Te lleva al feed de videos inmersivos.
3.  **Botón Central (Dinámico):**
    -   **En la mayoría de las páginas:** Es un icono de **Búsqueda** que te lleva a la página de exploración de categorías (`/search`).
    -   **En tu propio perfil (`/profile`):** Se convierte en un icono de **Subir (+)**.
        -   Si eres **Proveedor**, abre el diálogo para "Añadir Publicación" o "Añadir Producto".
        -   Si eres **Cliente**, te lleva a "Emprende por Hoy" para que crees tu publicación temporal.
4.  **Mensajes (`/messages`):** Icono de chat. Te lleva a tus conversaciones.
5.  **Botón Derecho (Dinámico):**
    -   **En la mayoría de las páginas:** Es tu **avatar de perfil**, un atajo para ir a `/profile`.
    -   **En tu propio perfil (`/profile`):** Se transforma en un **engranaje de Ajustes**, que te lleva a la página de configuración (`/profile-setup`).

**Nota sobre Headers:** El header principal se oculta en páginas con headers propios (chat) o de flujo completo. El **header de tu propio perfil es fijo** y permanece visible al hacer scroll.

### 3.2. Perfil del Proveedor (`/profile/page.tsx`)

- **Header Fijo:** El área con la información del perfil (avatar, nombre, reputación, etc.) se mantiene fija en la parte superior de la pantalla mientras te desplazas por la galería.
- **Botón "Gestionar Campañas":**
  - **Exclusivo para Proveedores:** Se ha añadido un botón "Gestionar Campañas" junto al de "Emprende por Hoy".
  - **Abre el `CampaignDialog`:** Inicia el flujo para crear una campaña publicitaria pagada para una publicación.
- **Botón "Emprende por Hoy":** Permite a los proveedores lanzar una oferta rápida de 24 horas por un costo fijo.

#### 3.2.1. Diálogo de Gestión de Campañas (`CampaignDialog`)
Este es un flujo de 4 pasos para que el proveedor autogestione su publicidad:
1.  **Selección de Publicación:** Elige una imagen o video de su galería para impulsar.
2.  **Configuración de Presupuesto:**
    -   **Niveles de Impulso:** Selecciona un plan (Básico, Avanzado, Premium) que define un costo diario y un alcance estimado.
    -   **Duración:** Define cuántos días durará la campaña (1-30).
3.  **Segmentación (Opcional):**
    -   Añade un costo extra para enfocar la campaña por **zona geográfica** o por **intereses** de los usuarios.
4.  **Revisión y Pago:**
    -   Muestra un resumen detallado del costo total.
    -   Aplica un **10% de descuento** si el proveedor está suscrito.
    -   Permite usar **Credicora** para financiar la campaña si el costo es de $20 o más.

### 3.3. Perfil Público de un Proveedor (`/companies/[id]/page.tsx`)
- **Botón de Mensaje Directo:** Se ha añadido un icono de **Enviar (`Send`)** junto al botón de guardar. Esto permite a los clientes iniciar una conversación de chat directamente con el proveedor desde su perfil, facilitando el primer contacto.

### 3.4. Carrito de Compras y Checkout (Componente Global)
- **Acceso:** Icono de carrito en el `Header` y en el perfil de proveedores de productos.
- **Funcionalidad del Popover:**
  - Muestra un resumen de los productos, permitiendo ajustar cantidades o eliminar artículos.
  - El botón **"Ver Pre-factura"** abre el diálogo de checkout.
- **Diálogo de Pre-factura (Checkout):**
  - **Cálculos Dinámicos:** Muestra subtotal, costo de envío (si se activa) y el total.
  - **Switch "Incluir Delivery":** Añade el costo de envío.
  - **Switch "Pagar con Credicora":**
    - Habilitado solo si el proveedor lo acepta y el monto es >= $20.
    - Al activarlo, recalcula el "Total a Pagar Hoy".
  - **Botón "Pagar Ahora":** Crea la transacción final.

---

## 4. Políticas Clave
- **Activación Obligatoria:** Ningún proveedor puede ofertar si no ha completado el flujo de configuración Y el de activación de transacciones.
- **Límite de Cotizaciones (No Suscritos):** Un usuario no suscrito puede cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.
- **Uso de Credicora:** La opción de financiar con Credicora (tanto para compras como para campañas) solo está disponible para montos iguales o superiores a $20.