# Flujogramas de Procesos de Corabo

Este documento contiene los flujogramas que describen los principales procesos y la lógica de negocio de la aplicación Corabo, ahora con una arquitectura Cliente-Servidor utilizando Firebase y Genkit.

---

## 1. Flujo General de Autenticación y Acceso

Describe el viaje inicial de un usuario para acceder a la aplicación.

```mermaid
graph TD
    A[Usuario abre la App] --> B{¿Usuario autenticado?};
    B -- No --> C[Redirigido a /login];
    C --> D[Usuario hace clic en 'Iniciar Sesión con Google'];
    D --> E[Popup de Firebase Authentication];
    E --> F{¿Autenticación exitosa?};
    F -- Sí --> G[Redirigido a la página principal '/'];
    G --> H[CoraboContext se suscribe a los datos de Firestore del usuario];
    H --> I[App lista para usar];
    F -- No --> J[Muestra error en la página de login];
    B -- Sí --> G;
```

---

## 2. Flujo del Cliente (Comprador) con Backend

Describe el viaje de un cliente en la nueva arquitectura.

```mermaid
graph TD
    A[Inicio: Cliente en el Feed Principal] --> B[Encuentra Proveedor y hace clic en Mensaje Directo];
    B --> C[Se abre la pantalla de Chat /messages/[id]];
    C --> D[Cliente y Proveedor negocian];
    D --> E[**Proveedor** envía una 'Propuesta de Acuerdo' desde el chat];
    
    subgraph "Lógica de Backend (Genkit)"
        direction LR
        E --> F_FE[El Frontend llama al flujo `sendMessageFlow` en Genkit];
        F_FE --> G_BE[Genkit guarda la propuesta en el mensaje dentro de Firestore];
    end

    G_BE --> H_CLIENT[El cliente ve la cápsula de propuesta en el chat];
    H_CLIENT --> I_ACCEPT[Cliente hace clic en 'Revisar y Aceptar'];
    
    subgraph "Lógica de Backend (Genkit)"
        direction LR
        I_ACCEPT --> J_FE[El Frontend llama al flujo `acceptProposalFlow` en Genkit];
        J_FE --> K_BE[Genkit valida la acción y crea una nueva **Transacción** en Firestore];
    end

    K_BE --> L_FINAL[Se crea el Compromiso de Pago];
    L_FINAL --> M_END[<B>Transacción Formalizada</B>];
```

---

## 3. Flujo de Pago: Suscrito vs. No Suscrito

*Este flujo no cambia en su lógica de negocio, pero ahora las actualizaciones de estado de la transacción son manejadas por el backend.*

```mermaid
graph TD
    A[Cliente y Proveedor aceptan un Acuerdo de Servicio] --> B[Se crea una transacción con estado 'Acuerdo Aceptado'];
    B --> C{¿El CLIENTE está suscrito y verificado?};

    C -- Sí (Suscrito) --> D[El Proveedor realiza el trabajo/servicio];
    D --> E[El Cliente confirma la recepción del servicio];
    E --> F[El Cliente procede a la pantalla de calificación y PAGO];
    F --> G[El Proveedor confirma el pago];
    G --> H[<B>Transacción Finalizada</B>];

    C -- No (No Suscrito) --> I[Estado de la transacción cambia a 'Finalizado - Pendiente de Pago'];
    I --> J[El sistema solicita al Cliente que PAGUE POR ADELANTADO];
    J --> K{Cliente realiza el pago?};
    K -- Sí --> L[Proveedor recibe notificación de pago y realiza el trabajo];
    K -- No --> M[La transacción permanece pendiente de pago];
    L --> G;
```

---

## 4. Flujo de Campaña Publicitaria (con Backend)

Detalla el nuevo flujo de creación de campañas, ahora gestionado por Genkit.

```mermaid
graph TD
    A[Proveedor en su perfil hace clic en 'Gestionar Campañas'] --> B[Se abre el `CampaignDialog`];
    B --> C[Configura campaña (presupuesto, duración, etc.)];
    C --> D[Hace clic en 'Confirmar y Proceder al Pago'];
    
    subgraph "Lógica de Frontend/Backend"
        direction LR
        D --> E_FE[Frontend llama al flujo `createCampaignFlow` de Genkit];
        E_FE --> F_BE[**Genkit (Backend)** recibe los datos];
        F_BE --> G_BE[Calcula costos, aplica descuentos];
        G_BE --> H_BE[Crea el documento de la Campaña en Firestore con estado 'pending_payment'];
        H_BE --> I_BE[Crea una **Transacción de Sistema** en Firestore para el pago de la campaña];
    end

    I_BE --> J[Usuario es redirigido a la pantalla de pago de la transacción];
    J --> K[Usuario paga la transacción];
    K --> L[Sistema actualiza el estado de la campaña a 'active'];
    L --> M[<B>Campaña Publicitaria Activa</B>];
```