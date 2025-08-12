# Manual de Funcionamiento del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento es una guía exhaustiva sobre la funcionalidad, lógica de negocio y flujos de usuario del prototipo Corabo. La aplicación ha evolucionado a una **plataforma web con una arquitectura moderna**, utilizando **Firebase para la autenticación y base de datos**, y **Genkit para la lógica de negocio del backend**, lo que la hace segura, escalable y lista para la colaboración en equipo.

---

## 2. Primeros Pasos: Inicio de Sesión y Configuración

El acceso y la personalización son claves en Corabo.

-   **Página de `/login`:** Al abrir la aplicación, serás dirigido a la página de inicio de sesión para acceder con tu cuenta de Google.
-   **Configuración de Perfil (`/profile-setup`):** Tras iniciar sesión por primera vez, serás guiado a través de un asistente de 6 pasos para configurar tu perfil.
    -   **Paso 1: Cliente vs. Proveedor:** La elección más importante. Si quieres ofrecer productos o servicios, debes elegir **"Proveedor"**.
    -   **Paso 5: ¿Productos o Servicios?:** Si eres proveedor, aquí defines si tu oferta principal son **productos** (lo que transformará tu perfil en un catálogo) o **servicios** (que mostrará una galería de trabajos).
-   **Activación de Transacciones:** Para los proveedores, es **obligatorio** activar el registro de transacciones desde la sección de ajustes (`/transactions/settings`) para poder recibir pagos y gestionar acuerdos.

---

## 3. Guía Funcional de Pantallas y Componentes

### 3.1. Navegación Principal (`Footer.tsx`)
La barra de navegación inferior es el centro de control. Su comportamiento es contextual.

-   **Botón Central (Dinámico):**
    -   **En la mayoría de las páginas:** Es un icono de **Búsqueda** (`/search`).
    -   **En tu propio perfil (`/profile`):** Se convierte en un icono de **Subir (+)**. Al hacer clic, si ofreces tanto productos como servicios, se abrirá un diálogo para que elijas qué añadir; de lo contrario, te llevará directamente al formulario de carga correspondiente.
-   **Botón Derecho (Dinámico):**
    -   **En la mayoría de las páginas:** Es tu **avatar de perfil** (`/profile`).
    -   **En tu propio perfil (`/profile`):** Se transforma en un **engranaje de Ajustes** (`/profile-setup`).

### 3.2. Perfil Público de un Proveedor (`/companies/[id]/page.tsx`)
Esta es la vista que tienen los clientes de un proveedor. Su diseño **cambia radicalmente** según el tipo de oferta del proveedor.

-   **Si el Proveedor ofrece `servicios` (`offerType: 'service'`):**
    -   Se muestra una **Vista de Galería**.
    -   Presenta una **imagen destacada grande** y una cuadrícula de miniaturas debajo.
    -   Las acciones principales son **Enviar Mensaje Directo (`Send`)** y **Agendar Cita (`Calendar`)**.
    -   Las estadísticas muestran "Publicaciones" y "Trabajos Realizados".

-   **Si el Proveedor ofrece `productos` (`offerType: 'product'`):**
    -   Se muestra una **Vista de Catálogo**.
    -   El título principal es "Catálogo de Productos".
    -   El contenido es una **cuadrícula de productos**, cada uno con su precio y un botón para añadir al carrito.
    -   La acción principal es el **Carrito de Compras (`ShoppingCart`)** en la cabecera.
    -   Las estadísticas muestran "Publicaciones" y "Productos".

-   **Interacciones Comunes:**
    -   **Guardar Contacto (`Bookmark`):** El icono se rellena al guardar.
    -   **Reportar (`Flag`):** Disponible en cada publicación para mantener la seguridad.

### 3.3. Perfil Propio del Usuario (`/profile/page.tsx`)
Esta página también se adapta a tu tipo de perfil (`offerType`). Las pestañas "Publicaciones" y "Catálogo" ahora son enlaces de navegación que te llevan a `profile/publications` y `profile/catalog` respectivamente. Las estadísticas y el contenido se ajustan para mostrar "Productos" o "Trabajos Realizados" según corresponda.

### 3.4. Chat y Propuestas de Acuerdo (`/messages/[id]/page.tsx`)
El chat es la herramienta de negociación. Los proveedores pueden enviar "Propuestas de Acuerdo" que los clientes pueden aceptar para formalizar una transacción de forma segura a través de los flujos de Genkit en el backend.

---

## 4. Políticas Clave y Lógica de Negocio

-   **Activación Obligatoria:** Ningún proveedor puede ofertar si no ha completado la configuración y activación de transacciones.
-   **Límite de Cotizaciones (No Suscritos):** Un usuario no suscrito puede cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.
-   **Uso de Credicora:** Solo disponible para montos iguales o superiores a $20.
