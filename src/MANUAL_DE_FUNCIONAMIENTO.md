# Manual de Funcionamiento del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento es una guía exhaustiva sobre la funcionalidad, lógica de negocio y flujos de usuario del prototipo Corabo. La aplicación ha evolucionado a una **plataforma web con una arquitectura moderna**, utilizando **Firebase para la autenticación y base de datos**, y **Genkit para la lógica de negocio del backend**, lo que la hace segura, escalable y lista para la colaboración en equipo.

---

## 2. Primeros Pasos: Inicio de Sesión y Configuración

El acceso y la personalización son claves en Corabo.

-   **Página de `/login`:** Al abrir la aplicación, serás dirigido a la página de inicio de sesión para acceder con tu cuenta de Google.
-   **Configuración Inicial (`/initial-setup`):** Tras iniciar sesión por primera vez, serás guiado a un formulario para completar tu perfil.
    -   **Selección de País:** Como primer paso, deberás seleccionar tu país. Esto adaptará los campos siguientes.
    -   **Nombre y Apellido:** Deberás ingresar tu nombre y apellido manualmente. La aplicación ya no infiere estos datos de tu cuenta de Google para asegurar que la información sea la que tú deseas.
    -   **Documento de Identidad:** Se te solicitará tu número de documento de identidad (ej. Cédula, DNI, CURP), el cual es crucial para la verificación.
-   **Activación de Transacciones:** Para los proveedores, es **obligatorio** completar este registro inicial. El banner "¡Activa tu registro!" ahora te redirige correctamente a esta pantalla (`/initial-setup`) para que puedas completar tus datos y empezar a vender.

---

## 3. Guía Funcional de Pantallas y Componentes

### 3.1. Feed Principal (`/`)
La pantalla de inicio ahora presenta un diseño inmersivo de pantalla completa, similar a Instagram, para centrar la atención en el contenido visual. Las publicaciones ocupan todo el ancho de la pantalla, sin márgenes laterales, creando una experiencia de navegación más fluida y moderna.

### 3.2. Navegación Principal (`Footer.tsx`)
La barra de navegación inferior es el centro de control y su comportamiento es contextual.

-   **Botón Central (Dinámico):**
    -   **Para Clientes y en la mayoría de las páginas:** Es un icono de **Código QR** (`/show-qr`) para iniciar pagos rápidos.
    -   **Para Proveedores en su propio perfil (`/profile`):** Se convierte en un icono de **Subir (+)**. Al hacer clic, se abrirá un diálogo para que elijas si quieres añadir una **publicación a la galería** o un **nuevo producto** a tu catálogo.
-   **Botón Derecho (Dinámico):**
    -   **En la mayoría de las páginas:** Es tu **avatar de perfil** (`/profile`).
    -   **En tu propio perfil (`/profile`):** Se transforma en un **engranaje de Ajustes** (`/profile-setup`).

### 3.3. Configuración de Perfil (`/profile-setup/page.tsx`)
El asistente de configuración ha sido corregido para evitar errores y permitir un flujo lógico y sin interrupciones, independientemente del estado de tu cuenta.

-   **Paso 1: Cliente vs. Proveedor:** La elección más importante. Si quieres ofrecer productos o servicios, debes elegir **"Proveedor"**.
-   **Paso 5: ¿Productos o Servicios?:** Si eres proveedor, aquí defines si tu oferta principal son **productos** (lo que transformará tu perfil en un catálogo) o **servicios** (que mostrará una galería de trabajos).

### 3.4. Perfil Público de un Proveedor (`/companies/[id]/page.tsx`)
Esta es la vista que tienen los clientes de un proveedor, la cual se ha estabilizado para evitar errores de carga. Su diseño **cambia radicalmente** según el tipo de oferta del proveedor.

-   **Si el Proveedor ofrece `servicios` (`offerType: 'service'`):** Se muestra una **Vista de Galería** con una imagen destacada grande y una cuadrícula de publicaciones. Las acciones principales son **Enviar Mensaje Directo** y **Agendar Cita**.
-   **Si el Proveedor ofrece `productos` (`offerType: 'product'`):** Se muestra una **Vista de Catálogo** con una cuadrícula de productos, precios y un botón para añadir al carrito. La acción principal es el **Carrito de Compras**.

### 3.5. Chat y Propuestas de Acuerdo (`/messages/[id]/page.tsx`)
El chat es la herramienta de negociación. Los proveedores pueden enviar "Propuestas de Acuerdo" que los clientes pueden aceptar para formalizar una transacción de forma segura a través de los flujos de Genkit en el backend.

---

## 4. Políticas Clave y Lógica de Negocio

-   **Activación Obligatoria:** Ningún proveedor puede ofertar si no ha completado la configuración y activación de transacciones.
-   **Límite de Cotizaciones (No Suscritos):** Un usuario no suscrito puede cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.
-   **Uso de Credicora:** Solo disponible para montos iguales o superiores a $20.

---

## 5. Instalación en Dispositivos Móviles (PWA)

La aplicación ahora se puede "instalar" en la pantalla de inicio de tu teléfono. Gracias a las últimas correcciones, al hacerlo, verás el **logo oficial de Corabo**, ofreciendo una experiencia de aplicación nativa.