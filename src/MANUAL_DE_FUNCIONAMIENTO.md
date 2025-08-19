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
    -   **Tipo de Proveedor:** Si te registras como "Proveedor", podrás elegir entre "Profesional Independiente" o "Empresa". Esta elección es importante, ya que determina los beneficios y niveles de `Credicora` a los que podrás acceder.
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
    -   **En tu propio perfil (`/profile`):** Se transforma en un **engranaje de Ajustes** (`/profile/details`).

### 3.3. Configuración de Perfil (`/profile` y `/profile/details`)
El perfil de un proveedor ahora tiene pestañas para una mejor organización. La navegación ha sido mejorada para ser más intuitiva.

-   **Pestañas del Perfil:** "Publicaciones", "Catálogo" (si aplica) y "Detalles", cada una en su propia ruta (`/profile/publications`, `/profile/catalog`, `/profile/details`).
-   **Pestaña de Detalles:** Desde aquí, los proveedores pueden editar sus datos de contacto y, más importante, añadir **información especializada** según su categoría principal (ej. "Alimentos y Bebidas", "Hogar y Reparaciones", "Belleza"). El sistema muestra formularios coherentes y específicos para cada categoría para enriquecer su perfil.

### 3.4. Perfil Público de un Proveedor (`/companies/[id]/page.tsx`)
La vista pública de un proveedor es dinámica y se adapta a su oferta.

-   **Vista de Servicios:** Muestra una galería de trabajos visual, con sus habilidades y oficios destacados como etiquetas para una fácil identificación.
-   **Vista de Catálogo:** Si ofrece productos, el perfil se transforma en una tienda con una cuadrícula de productos, precios y carrito de compras.
-   **Detalles Especializados:** Toda la información técnica o específica de la categoría (licencias, tipo de cocina, etc.) se muestra de forma clara para dar más confianza a los clientes.
-   **Afiliaciones:** Si un profesional está verificado por una empresa, el logo y nombre de la empresa aparecerán en su perfil, añadiendo una capa extra de confianza.

### 3.5. Registro de Transacciones (`/transactions`) - ¡Nuevo Dashboard!
Esta sección es ahora el **Panel de Control Financiero** del proveedor.
-   **Gráficos Interactivos:** Muestra gráficos de líneas y de torta con tus ingresos, egresos y montos pendientes, permitiéndote tener una visión clara del rendimiento de tu negocio.
-   **Navegación Simplificada:** Accede rápidamente a tus listas de transacciones pendientes e historial completo.
-   **Progreso de Credicora:** Visualiza tu nivel actual y tu progreso para alcanzar el siguiente.
-   **Incentivos a la Suscripción:** Incluye una tarjeta que destaca los beneficios de suscribirse para potenciar tu perfil.

### 3.6. Gestión de Cajas y Puntos de Venta
Para los usuarios de tipo "Empresa", la sección de Ajustes de Transacciones (`/transactions/settings`) ahora incluye una opción para **"Gestión de Cajas"**.
-   **Crear Cajas:** Puedes crear múltiples puntos de venta (ej: "Barra", "Piso de Venta"), cada uno con su propio nombre y contraseña numérica.
-   **Generar y Descargar QR:** Cada caja genera un código QR único. Puedes visualizarlo y descargarlo como una imagen PNG en formato **media carta**, ideal para imprimir y colocar en tu punto de venta físico. Esto permite a los clientes escanear y pagar directamente a esa caja específica.
-   **Seguimiento:** En los detalles de cada caja, puedes ver un historial de todas las transacciones realizadas a través de ella.

### 3.7. Panel de Administración (`/admin`)
Para usuarios con rol de "admin", esta sección permite gestionar la plataforma.
-   **Gestión de Usuarios:** Ver, activar o desactivar usuarios.
-   **Verificación de Documentos:** Revisar y aprobar manualmente las verificaciones de identidad.
-   **Verificación de Pagos:** Confirmar los pagos de campañas y suscripciones para activarlos.
-   **Gestión de Afiliaciones (para Empresas):** Si el admin es una empresa, puede gestionar las solicitudes de afiliación de profesionales.

### 3.8. Chat y Propuestas de Acuerdo (`/messages/[id]/page.tsx`)
El chat es la herramienta de negociación. Los proveedores pueden enviar "Propuestas de Acuerdo" que los clientes pueden aceptar para formalizar una transacción de forma segura.

---

## 4. Políticas Clave y Lógica de Negocio

-   **Activación Obligatoria:** Ningún proveedor puede ofertar si no ha completado la configuración y activación de transacciones.
-   **Límite de Cotizaciones (No Suscritos):** Un usuario no suscrito puede cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.
-   **Credicora para Empresas:** Existen niveles de Credicora separados y con mayores beneficios para usuarios de tipo "Empresa".
-   **Sistema de Reputación Dinámico:**
    -   **Efectividad:** Mide tu fiabilidad. Aumenta con cada transacción exitosa y disminuye con disputas.
    -   **Agilidad de Pago:** Mide qué tan rápido pagas una vez que se te solicita. Pagar en menos de 15 minutos te da una insignia verde y mejora tu reputación.
    -   **Inactividad:** Tu cuenta se pausará si no inicias sesión en 45 días para mantener la comunidad activa.
-   **Modelo de Comisión de Credicora:**
    -   **Gratis para el Cliente:** El uso de Credicora no tiene costo para el cliente. El monto que paga es el precio de la venta.
    -   **Compromiso del Proveedor:** La comisión de servicio es asumida por el proveedor que acepta el pago con Credicora. Esta comisión (4% para profesionales, 6% para empresas, con descuentos por suscripción) se convierte en un nuevo compromiso de pago del proveedor hacia Corabo.

---

## 5. Instalación en Dispositivos Móviles (PWA)

La aplicación ahora se puede "instalar" en la pantalla de inicio de tu teléfono. Gracias a las últimas correcciones, al hacerlo, verás el **logo oficial de Corabo**, ofreciendo una experiencia de aplicación nativa.

    