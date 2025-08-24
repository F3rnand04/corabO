# Plan de Pruebas de Regresión y Funcionalidad Integral de Corabo

**Objetivo:** Validar sistemáticamente la funcionalidad completa, la lógica de negocio, la integridad de los datos y la experiencia del usuario de la aplicación Corabo tras la refactorización a una arquitectura de Server Actions.

**Metodología:** Cada suite de pruebas debe ser ejecutada por un tester humano que siga los pasos descritos. El resultado esperado debe coincidir exactamente. Cualquier desviación se considera un fallo.

---

## Suite de Pruebas 1: Autenticación y Ciclo de Vida del Usuario

**Objetivo:** Garantizar que el pilar de la aplicación —el usuario— funcione sin fisuras.

| # | Caso de Prueba | Pasos a Seguir | Resultado Esperado |
| :-- | :--- | :--- | :--- |
| 1.1 | **Login Exitoso (Usuario Existente)** | 1. Navegar a `/login`. <br> 2. Hacer clic en "Ingresa con Google". <br> 3. Autenticar con una cuenta de usuario ya registrada. | El usuario es redirigido a la página principal (`/`). El feed de publicaciones se carga. No hay bucles ni errores. |
| 1.2 | **Registro y Setup Obligatorio (Nuevo Usuario)** | 1. Navegar a `/login`. <br> 2. Autenticar con una cuenta de Google **NUEVA**. | El usuario es redirigido **forzosamente** a la página `/initial-setup`. |
| 1.3 | **Completar Setup Inicial** | 1. En `/initial-setup`, rellenar todos los campos del formulario. <br> 2. Aceptar las políticas. <br> 3. Hacer clic en "Finalizar Registro". | Los datos se guardan. El usuario es redirigido a la página principal (`/`). El estado del usuario (`isInitialSetupComplete`) es `true`. |
| 1.4 | **Persistencia de Sesión** | 1. Iniciar sesión. <br> 2. Cerrar la pestaña del navegador. <br> 3. Volver a abrir la aplicación. | El usuario permanece logueado y es llevado directamente a la página principal (`/`), sin pasar por el login. |
| 1.5 | **Logout Exitoso** | 1. Desde cualquier página, abrir el menú y hacer clic en "Cerrar Sesión". | El usuario es deslogueado y redirigido a la página `/login`. |
| 1.6 | **Bloqueo de Rutas Protegidas** | 1. Estando deslogueado, intentar acceder directamente a `/profile` o `/transactions`. | El usuario es redirigido inmediatamente a `/login`. |
| 1.7 | **Bloqueo de Muro de Setup** | 1. Registrar un usuario nuevo pero **no** completar el setup. <br> 2. Intentar navegar a cualquier otra ruta (ej. `/`). | El usuario es siempre redirigido de vuelta a `/initial-setup`. |

---

## Suite de Pruebas 2: Gestión de Perfil y Verificación (Proveedor)

**Objetivo:** Validar que un proveedor pueda construir y gestionar su identidad comercial completamente.

| # | Caso de Prueba | Pasos a Seguir | Resultado Esperado |
| :-- | :--- | :--- | :--- |
| 2.1 | **Editar Detalles del Perfil** | 1. Navegar a `/profile-setup/details`. <br> 2. Modificar la especialidad, horarios y otros campos. <br> 3. Guardar los cambios. | Los datos se actualizan correctamente en Firestore. Al volver a visitar la página, los nuevos datos persisten. |
| 2.2 | **Verificación de Identidad Exitosa con IA** | 1. Navegar a `/profile-setup/verify-id`. <br> 2. Subir una imagen de un documento de identidad **válido** cuyos datos coincidan con el perfil. <br> 3. Hacer clic en "Verificar con IA". | La IA procesa el documento y devuelve un resultado exitoso. El estado del usuario se actualiza a `verified: true` y `idVerificationStatus: 'verified'`. |
| 2.3 | **Verificación de Identidad Fallida con IA** | 1. Subir una imagen de un documento cuyos datos **NO** coincidan. <br> 2. Hacer clic en "Verificar con IA". | La IA devuelve un resultado de no coincidencia. El estado del usuario se actualiza a `idVerificationStatus: 'pending'`. |
| 2.4 | **Visualización de Campos Especializados** | 1. Como proveedor, ir a la configuración de detalles. <br> 2. Seleccionar una categoría principal (ej. "Salud y Bienestar"). <br> 3. Verificar que se muestren los campos correspondientes (Nro. Licencia, Especialidades, etc.). | El componente de campos especializados se renderiza dinámicamente según la categoría seleccionada. |

---

## Suite de Pruebas 3: Contenido, Catálogo y Feed

**Objetivo:** Probar la capacidad de los proveedores para mostrar su trabajo y de los clientes para descubrirlo.

| # | Caso de Prueba | Pasos a Seguir | Resultado Esperado |
| :--| :--- | :--- | :--- |
| 3.1 | **Crear Publicación en Galería** | 1. Como proveedor, ir a `/profile`. <br> 2. Hacer clic en el botón (+) y elegir "Publicar en Galería". <br> 3. Subir una imagen y añadir una descripción. <br> 4. Publicar. | La nueva publicación aparece correctamente en la galería del perfil (`/profile/publications`) y en el feed principal (`/`). |
| 3.2 | **Crear Producto en Catálogo** | 1. Como proveedor, ir a `/profile`. <br> 2. Hacer clic en el botón (+) y elegir "Añadir Producto". <br> 3. Rellenar nombre, descripción, precio y subir imagen. <br> 4. Guardar. | El nuevo producto aparece correctamente en la pestaña de catálogo del perfil (`/profile/catalog`). |
| 3.3 | **Funcionalidad del Feed Principal** | 1. Navegar al feed principal (`/`). <br> 2. Hacer scroll hacia abajo. | Se cargan las publicaciones iniciales. Al hacer scroll, se deberían cargar más publicaciones de forma automática (scroll infinito). |
| 3.4 | **Interacción con Publicación** | 1. En el feed, dar "like" y dejar un comentario en una publicación. | El contador de likes se incrementa. El comentario aparece en la sección de comentarios de la publicación. |

---

## Suite de Pruebas 4: Comunicación y Negociación

**Objetivo:** Asegurar que el canal de comunicación y formalización de acuerdos sea robusto.

| # | Caso de Prueba | Pasos a Seguir | Resultado Esperado |
| :--| :--- | :--- | :--- |
| 4.1 | **Enviar y Recibir Mensajes** | 1. Desde el perfil de un proveedor, hacer clic en "Contactar". <br> 2. Enviar un mensaje. <br> 3. Iniciar sesión como el proveedor y revisar los mensajes. | El mensaje se envía y recibe en tiempo real. La conversación aparece en la lista de chats (`/messages`). |
| 4.2 | **Enviar Propuesta de Acuerdo** | 1. Como proveedor, dentro de un chat, crear y enviar una propuesta de acuerdo formal. | La propuesta aparece en el chat como un elemento especial. |
| 4.3 | **Aceptar Propuesta** | 1. Como cliente, hacer clic en "Revisar y Aceptar" en la propuesta recibida. | Se crea una nueva transacción en Firestore con el estado "Acuerdo Aceptado" o "Pendiente de Pago" según la suscripción del cliente. Ambas partes pueden verla en `/transactions`. |

---

## Suite de Pruebas 5: Ciclo de Vida Transaccional

**Objetivo:** Validar el flujo económico completo de la plataforma.

| # | Caso de Prueba | Pasos a Seguir | Resultado Esperado |
| :--| :--- | :--- | :--- |
| 5.1 | **Ciclo de Vida de un Servicio** | 1. Proveedor: Marcar un trabajo como "Finalizado". <br> 2. Cliente: Confirmar recepción, calificar y pagar. <br> 3. Proveedor: Confirmar la recepción del pago. | El estado de la transacción se actualiza correctamente en cada paso en Firestore y se refleja en la UI (`/transactions`). |
| 5.2 | **Compra de Producto (Carrito)** | 1. Cliente: Añadir productos de 2 proveedores diferentes al carrito. <br> 2. Abrir el popover del carrito. | El carrito agrupa correctamente los productos por proveedor, mostrando subtotales para cada uno. |
| 5.3 | **Checkout** | 1. Cliente: Hacer checkout para uno de los proveedores del carrito. <br> 2. Seleccionar método de entrega y de pago. <br> 3. Confirmar. | Se crea una transacción formal con el estado "Buscando Repartidor" (o similar). La lógica de `findDeliveryProvider` se activa en el backend. |

---

## Suite de Pruebas 6: Ecosistema de Confianza

**Objetivo:** Verificar los sistemas que construyen la reputación y seguridad.

| # | Caso de Prueba | Pasos a Seguir | Resultado Esperado |
| :--| :--- | :--- | :--- |
| 6.1 | **Cálculo de Reputación** | 1. Completar una transacción y calificar al proveedor. | El índice de efectividad y la reputación (estrellas) del proveedor se actualizan en su perfil. |
| 6.2 | **Flujo de Afiliación** | 1. Profesional: Solicitar afiliación a una empresa. <br> 2. Empresa (Admin): Navegar a `/admin` -> "Talento Asociado". <br> 3. Aprobar la solicitud. | La solicitud desaparece de la lista de pendientes. El perfil del profesional ahora muestra la insignia "Verificado por [Empresa]". |
| 6.3 | **Niveles de Credicora** | 1. Registrar un nuevo usuario. | El usuario inicia en el Nivel 1 de Credicora con el límite de crédito y condiciones correspondientes a su tipo (persona o empresa). |

---

## Suite de Pruebas 7: Sistema de Pagos y Monetización

**Objetivo:** Probar la lógica de negocio central de la aplicación.

| # | Caso de Prueba | Pasos a Seguir | Resultado Esperado |
| :--| :--- | :--- | :--- |
| 7.1 | **Gestión de Cajas (Empresa)** | 1. Empresa: Navegar a `/transactions/settings/cashier`. <br> 2. Crear una nueva caja con nombre y contraseña. | La nueva caja aparece en la lista. Se puede visualizar y descargar su código QR. |
| 7.2 | **Pago por QR** | 1. Cliente: Escanear el QR de una caja. <br> 2. Proveedor (`/show-qr`): Introducir el monto y confirmar. <br> 3. Cliente (`/payment/approval`): Ver el monto y proceder a pagar. <br> 4. Proveedor: Confirmar el pago. | La sesión QR avanza por todos los estados correctamente. Se crea la transacción de venta. |
| 7.3 | **Creación de Comisión** | 1. Completar un pago por QR. | Inmediatamente después de que la transacción de venta se marca como "Pagado", se debe crear automáticamente una **segunda transacción** en Firestore de tipo "Sistema", donde el proveedor es el deudor y Corabo es el acreedor, por el monto correcto de la comisión más el IVA. |
