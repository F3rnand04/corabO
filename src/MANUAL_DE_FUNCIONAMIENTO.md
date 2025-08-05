# Manual de Funcionamiento del Prototipo Corabo

## 1. Visión General y Arquitectura

Este documento es una guía exhaustiva sobre la funcionalidad, lógica de negocio y flujos de usuario del prototipo Corabo. La aplicación está diseñada como una plataforma de conexión robusta y segura, con una arquitectura centrada en componentes reutilizables (React, ShadCN/UI) y una lógica de negocio centralizada en `CoraboContext.tsx`.

---

## 2. Perfiles de Usuario: Roles y Capacidades

La plataforma distingue varios tipos de perfiles para crear un ecosistema equilibrado.

### 2.1. Cliente (Persona Natural)
- **Función Principal:** Buscar, cotizar y comprar productos o servicios.
- **Capacidades Clave:**
  - Navegar por el feed de servicios y empresas.
  - Añadir productos al carrito de compras global.
  - Solicitar cotizaciones.
  - Iniciar chats y negociar con proveedores.
  - Agendar citas a través del perfil del proveedor.
  - Utilizar el sistema **CrediCora** para financiar compras.
  - Suscribirse para obtener la insignia de "Verificado" y mayor seguridad.

### 2.2. Proveedor Profesional (Servicios)
- **Función Principal:** Ofrecer servicios y gestionar su reputación.
- **Flujo Obligatorio:** Debe completar la **configuración de perfil** y **activar su registro de transacciones** para poder ser visible y ofertar en la plataforma.
- **Capacidades Clave:**
  - Gestionar su galería de publicaciones (su portafolio visual).
  - Establecer una "Promoción del Día" para destacar una publicación.
  - Enviar "Propuestas de Acuerdo" formales a través del chat.
  - Gestionar su agenda y aceptar solicitudes de citas.
  - Recibir y confirmar pagos a través del módulo de transacciones.
  - Puede ser reclasificado a "Empresa de Servicios" si su volumen de transacciones es muy alto.

### 2.3. Proveedor de Productos (y su transición a "Empresa")
- **Función Principal:** Vender productos físicos.
- **Clasificación Automática a "Empresa":** Este es un punto clave. Un proveedor de productos es **reclasificado automáticamente como "Empresa"** si cumple con criterios de alto volumen sostenido:
  - **Criterio:** Realizar **5 o más ventas diarias durante 30 días consecutivos**.
  - **Consecuencia:** Al intentar renovar o adquirir una suscripción, el sistema le ofrecerá únicamente el **Plan Empresarial**, acorde a su escala de operaciones.

---

## 3. Sistema de Confianza y Crecimiento

### 3.1. CrediCora: El Motor de Financiación Inteligente
CrediCora no es solo un sistema de crédito, es una herramienta de crecimiento.

#### Niveles de Crédito y Beneficios
| Nivel | Nombre | Límite (USD) | % Pago Inicial | Cuotas |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Alfa | $150 | 60% | 3 |
| 2 | Delta | $200 | 50% | 6 |
| 3 | Lambda | $300 | 40% | 9 |
| 4 | Sigma | $600 | 30% | 12 |
| 5 | Omega | $1000 | 0% | 18 |

- **Progresión:** Los usuarios avanzan de nivel manteniendo un historial de pagos puntual, alta efectividad y buenas calificaciones.
- **Lógica de "Ayuda" para Compras Grandes:** Si una compra supera el límite de crédito del usuario, CrediCora no la bloquea. En su lugar:
  1. Calcula el **monto máximo que puede financiar** (ej: 40% de $150 = $60 para Nivel 1).
  2. **Resta esa "ayuda"** del total de la compra.
  3. El cliente paga el monto restante como **pago inicial**.
  4. Los $60 financiados se dividen en las cuotas correspondientes a su nivel.
- **Comisión al Proveedor:** Por cada venta realizada con CrediCora, se genera automáticamente una transacción de sistema que representa una **comisión del 4.99%** para la plataforma, que el proveedor deberá saldar.

### 3.2. Flujo de Suscripción Segura
1.  **Inicio:** El usuario selecciona un plan (mensual/anual) y hace clic en "Suscribirme ahora".
2.  **Creación de Compromiso:** La acción **no activa la suscripción**. En su lugar, crea una transacción de sistema (un compromiso de pago) por el valor del plan.
3.  **Redirección a Pago:** El usuario es redirigido a la página de pago para saldar este compromiso.
4.  **Mensaje de Verificación:** Una vez confirmado el pago, el sistema envía un **DM personalizado** al usuario solicitando la carga de documentos para una revisión manual.
5.  **Activación de Insignia:** La insignia de "Verificado" solo se activa (simuladamente) tras este proceso.

---

## 4. Guía Funcional de Pantallas y Componentes

### 4.1. Carrito de Compras y Checkout (Componente Global)
- **Acceso:** Icono de carrito en el `Header` y en el perfil de proveedores de productos.
- **Funcionalidad del Popover:**
  - Muestra un resumen de los productos, permitiendo ajustar cantidades o eliminar artículos.
  - El botón **"Ver Pre-factura"** abre el diálogo de checkout.
- **Diálogo de Pre-factura (Checkout):**
  - **Cálculos Dinámicos:** Muestra subtotal, costo de envío (si se activa) y el total.
  - **Switch "Incluir Delivery":** Añade el costo de envío. Si el proveedor solo trabaja con delivery, este switch está activado y deshabilitado.
  - **Switch "Pagar con Credicora":**
    - Habilitado solo si el proveedor lo acepta.
    - Al activarlo, recalcula el "Total a Pagar Hoy" aplicando la lógica de "ayuda" de CrediCora. Muestra el detalle de las cuotas futuras.
  - **Botón "Pagar Ahora":** Crea la transacción final con estado "Finalizado - Pendiente de Pago" y redirige a la página de pago.

### 4.2. Registro de Transacciones (`/transactions`)
Es el centro financiero del usuario.
- **Panel Principal (Resumen):**
  - **Gráficos:** Muestra gráficos de Ingresos vs. Egresos (líneas o tarta).
  - **Tarjeta CrediCora:** Muestra el nivel actual (Alfa, Delta, etc.), el límite de crédito y el disponible. El ojo permite ocultar/mostrar cifras.
  - **Calendario de Agenda:** El icono de calendario abre un popover con un calendario que resalta los días con compromisos de pago o tareas pendientes.
  - **Botones de Acción:**
    - `Lista de Pendientes`: Muestra transacciones que requieren una acción (ej. cotizaciones por enviar, pagos por confirmar).
    - `Transacciones`: Muestra el historial completo de operaciones finalizadas.
    - `Compromisos de Pagos`: Muestra todas las cuotas y pagos futuros.
- **Diálogo de Detalles de Transacción (`TransactionDetailsDialog`):**
  - Se abre al hacer clic en cualquier transacción de las listas.
  - Muestra todos los detalles de la operación.
  - **Lógica de Acciones Contextuales:** Los botones de acción en el pie del diálogo cambian según el estado de la transacción y el rol del usuario (ej: "Enviar Cotización", "Aceptar Propuesta", "Confirmar Pago").

### 4.3. Flujo de Reporte de Pagos de Terceros
- **Activación:** Cuando un proveedor abre una transacción con estado "Pago Enviado - Esperando Confirmación".
- **Diálogo Intermedio:** Se presenta un diálogo que le pregunta si el pago fue enviado por el titular o un tercero.
- **Botón "Reportar Pago de Tercero":** Si lo presiona, la transacción se marca internamente y muestra un ícono `(!)` en el historial. El flujo de pago continúa, pero la advertencia queda registrada.
- **Botón "Confirmar Pago del Titular":** Si presiona este, la transacción se confirma sin ninguna marca.

### 4.4. Ajustes de Perfil (`/profile-setup`)
Flujo obligatorio para proveedores.
- **Paso 1: Tipo de Perfil:** Elige entre Cliente, Servicio (Profesional) o Empresa.
- **Paso 2: Nombre de Usuario:** Valida la disponibilidad en tiempo real.
- **Paso 3: Categoría:** Selección de una o más áreas de especialización.
- **Paso 4: Detalles Generales:** Validación de email y teléfono.
- **Paso 5: Detalles Específicos (Proveedores):**
  - `Ofrezco principalmente`: Define si su oferta es de "Servicios" o "Productos".
  - `Opciones de Pago`: Activa/Desactiva la aceptación de **CrediCora**. Define un costo fijo por cita si aplica.
  - `Ubicación y Cobertura`: Define si tiene local físico, la dirección y el radio de acción.
  - `Horarios de Atención`: Configuración detallada por día.
- **Paso 6: Revisión y Redirección:**
  - Muestra un resumen de toda la información.
  - Al finalizar, **redirige obligatoriamente al proveedor a la página de activación de transacciones (`/transactions/settings`)**.

### 4.5. Políticas Clave
- **Activación Obligatoria:** Ningún proveedor puede ofertar si no ha completado el flujo de configuración Y el de activación de transacciones. Esto elimina la necesidad de advertir a los clientes sobre proveedores "no activos".
- **Límite de Cotizaciones (No Suscritos):** Un usuario no suscrito puede cotizar el mismo producto/servicio a un máximo de 3 proveedores distintos por día. Al intentar con un cuarto, se le invitará a suscribirse.