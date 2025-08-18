# Manual de Funcionamiento del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento es una guía exhaustiva sobre la funcionalidad, lógica de negocio y flujos de usuario del prototipo Corabo. La aplicación ha evolucionado a una **plataforma web con una arquitectura moderna**, utilizando **Firebase para la autenticación y base de datos**, y **Genkit para la lógica de negocio del backend**, lo que la hace segura, escalable y lista para la colaboración en equipo.

---

## 2. Primeros Pasos: Inicio de Sesión y Configuración

El acceso y la personalización son claves en Corabo.

-   **Página de `/login`:** Al abrir la aplicación, serás dirigido a la página de inicio de sesión para acceder con tu cuenta de Google.
-   **Configuración Inicial (`/initial-setup`):** Tras iniciar sesión por primera vez, serás guiado a un formulario para completar tu perfil.
    -   **Selección de País:** Como primer paso, deberás seleccionar tu país. Esto adaptará los campos siguientes.
    -   **Nombre y Apellido:** Deberás ingresar tu nombre y apellido manualmente. El sistema ya no autocompleta esta información para evitar errores.
    -   **Documento de Identidad:** Se te solicitará tu número de documento de identidad, crucial para la verificación. El sistema validará que no esté en uso.
    -   **Botón de Salida:** Si te equivocaste de cuenta, ahora tienes un botón para **"Volver a la página de inicio"**, que cerrará tu sesión para que puedas ingresar con la cuenta correcta.
-   **Activación de Transacciones:** Para los proveedores, es **obligatorio** completar este registro. El banner "¡Activa tu registro!" te redirige a los pasos necesarios (`/initial-setup`, `/profile-setup/verify-id`, `/transactions/settings`) para que puedas completar tus datos y empezar a vender.

---

## 3. Guía Funcional de Pantallas y Componentes

### 3.1. Feed Principal (`/`)
La pantalla de inicio ahora presenta un diseño inmersivo de pantalla completa, similar a Instagram, para centrar la atención en el contenido visual.

### 3.2. Navegación Principal (`Footer.tsx`)
La barra de navegación inferior es el centro de control y su comportamiento es contextual.

-   **Botón Central (Dinámico):**
    -   **Para Clientes y en la mayoría de las páginas:** Es un icono de **Código QR** (`/show-qr`) para iniciar pagos rápidos.
    -   **Para Proveedores en su propio perfil (`/profile`):** Se convierte en un icono de **Subir (+)**. Al hacer clic, se abrirá un diálogo para que elijas si quieres añadir una **publicación a la galería** o un **nuevo producto** a tu catálogo.
-   **Botón Derecho (Dinámico):**
    -   **En la mayoría de las páginas:** Es tu **avatar de perfil** que te lleva a la ruta `/profile`, la cual redirige a `/profile/publications`.
    -   **En tu propio perfil (`/profile`):** Se transforma en un **engranaje de Ajustes** (`/profile-setup`).

### 3.3. Configuración de Perfil (`/profile` y `/profile/details`)
El perfil de un proveedor ahora tiene pestañas para una mejor organización. La navegación ha sido mejorada para ser más intuitiva.

-   **Pestañas del Perfil:** "Publicaciones", "Catálogo" y "Detalles", cada una en su propia ruta (`/profile/publications`, `/profile/catalog`, `/profile/details`).
-   **Pestaña de Detalles:** Desde aquí, los proveedores pueden editar sus datos de contacto y, más importante, añadir **información especializada** según su categoría principal (ej. "Alimentos y Bebidas", "Hogar y Reparaciones", "Belleza"). El sistema muestra formularios coherentes y específicos para cada categoría para enriquecer su perfil.

### 3.4. Perfil Público de un Proveedor (`/companies/[id]/page.tsx`)
La vista pública de un proveedor es dinámica y se adapta a su oferta.

-   **Vista de Servicios:** Muestra una galería de trabajos visual, con sus habilidades y oficios destacados como etiquetas para una fácil identificación.
-   **Vista de Catálogo:** Si ofrece productos, el perfil se transforma en una tienda con una cuadrícula de productos, precios y carrito de compras.
-   **Detalles Especializados:** Toda la información técnica o específica de la categoría (licencias, tipo de cocina, etc.) se muestra de forma clara para dar más confianza a los clientes.

### 3.5. Registro de Transacciones (`/transactions`) - ¡Nuevo Dashboard!
Esta sección es ahora el **Panel de Control Financiero** del proveedor.
-   **Gráficos Interactivos:** Muestra gráficos de líneas y de torta con tus ingresos, egresos y montos pendientes, permitiéndote tener una visión clara del rendimiento de tu negocio.
-   **Navegación Simplificada:** Accede rápidamente a tus listas de transacciones pendientes e historial completo.
-   **Incentivos a la Suscripción:** Incluye una tarjeta que destaca los beneficios de suscribirse para potenciar tu perfil.

### 3.6. Chat y Propuestas de Acuerdo (`/messages/[id]/page.tsx`)
El chat es la herramienta de negociación. Los proveedores pueden enviar "Propuestas de Acuerdo" que los clientes pueden aceptar para formalizar una transacción de forma segura.

---

## 4. Políticas Clave y Lógica de Negocio

-   **Activación Obligatoria:** Ningún proveedor puede ofertar si no ha completado la configuración y activación de transacciones.
-   **Límite de Cotizaciones (No Suscritos):** Un usuario no suscrito puede cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.
-   **Uso de Credicora:** Solo disponible para montos iguales o superiores a $20.
-   **Sistema de Reputación Dinámico:**
    -   **Efectividad:** Mide tu fiabilidad. Aumenta con cada transacción exitosa y disminuye con disputas.
    -   **Agilidad de Pago:** Mide qué tan rápido pagas una vez que se te solicita. Pagar en menos de 15 minutos te da una insignia verde y mejora tu reputación.
    -   **Inactividad:** Tu cuenta se pausará si no inicias sesión en 45 días para mantener la comunidad activa.

---

## 5. Instalación en Dispositivos Móviles (PWA)

La aplicación ahora se puede "instalar" en la pantalla de inicio de tu teléfono. Gracias a las últimas correcciones, al hacerlo, verás el **logo oficial de Corabo**, ofreciendo una experiencia de aplicación nativa.
