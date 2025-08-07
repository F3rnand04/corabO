# Manual de Funcionamiento del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento es una guía exhaustiva sobre la funcionalidad, lógica de negocio y flujos de usuario del prototipo Corabo. La aplicación ha evolucionado a una **plataforma web con una arquitectura moderna**, utilizando **Firebase para la autenticación y base de datos**, y **Genkit para la lógica de negocio del backend**, lo que la hace segura, escalable y lista para la colaboración en equipo.

---

## 2. Primeros Pasos: Inicio de Sesión

Al ser una aplicación con datos reales y personalizados, el primer paso siempre es la autenticación.

-   **Página de `/login`:** Al abrir la aplicación por primera vez, serás dirigido a la página de inicio de sesión.
-   **Autenticación con Google:** Deberás usar el botón "Iniciar Sesión con Google" para acceder. Esto utiliza el sistema seguro de Firebase Authentication.
-   **Creación Automática de Perfil:** Si es tu primera vez, se creará un perfil básico de tipo "Cliente" en nuestra base de datos Firestore, usando los datos de tu cuenta de Google. Ya podrás empezar a explorar.

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

### 3.2. Perfil Público de un Proveedor (`/companies/[id]/page.tsx`)
- **Botón de Mensaje Directo (Recién Añadido):** Ahora, cada `ProviderCard` en el feed principal incluye un icono de **Enviar (`Send`)**. Esto permite a los clientes iniciar una conversación de chat directamente con el proveedor desde el feed, sin necesidad de navegar a la página de perfil, agilizando enormemente el primer contacto.
- **Feedback Visual al Guardar Contacto:** El icono de **Guardar (`Bookmark`)** ahora se rellena con el color primario de la aplicación cuando el contacto ha sido guardado, proporcionando una confirmación visual inmediata y persistente.

### 3.3. Chat y Propuestas de Acuerdo (`/messages/[id]/page.tsx`)
El chat ahora es una herramienta de negociación segura, conectada al backend.
- **Flujo de Propuesta:** Cuando un proveedor envía una "Propuesta de Acuerdo", la lógica se ejecuta en un flujo de Genkit.
- **Aceptación Segura:** Cuando el cliente acepta, otro flujo de Genkit se encarga de crear la transacción formal en la base de datos Firestore. Esto evita que la lógica de creación de compromisos pueda ser alterada desde el navegador.

### 3.4. Gestión de Campañas (`CampaignDialog`)
El flujo de creación de campañas publicitarias también ha sido migrado al backend.
1.  **Configuración en el Cliente:** El proveedor sigue configurando su campaña (presupuesto, duración, etc.) en el diálogo.
2.  **Creación en el Servidor:** Al confirmar, se llama a un flujo de Genkit que realiza todos los cálculos y crea de forma segura tanto la campaña como la transacción de pago asociada en Firestore.

---

## 4. Políticas Clave
- **Activación Obligatoria:** Ningún proveedor puede ofertar si no ha completado el flujo de configuración Y el de activación de transacciones.
- **Límite de Cotizaciones (No Suscritos):** Un usuario no suscrito puede cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día.
- **Uso de Credicora:** La opción de financiar con Credicora solo está disponible para montos iguales o superiores a $20.