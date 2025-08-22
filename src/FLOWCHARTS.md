# Flujogramas de Procesos de Corabo

Este documento contiene los flujogramas que describen los principales procesos y la lógica de negocio de la aplicación Corabo, ahora con una arquitectura Cliente-Servidor utilizando Firebase y Genkit.

---

## 1. Flujo General de Autenticación y Acceso (Arquitectura Estable)

Describe el viaje inicial de un usuario, ahora con verificación en el servidor para evitar errores de hidratación.

```mermaid
graph TD
    A[Usuario abre la App] --> B{RootLayout (Server Component)};
    B -- "1. Lee cookie de sesión" --> C{¿Cookie válida?};
    C -- Sí --> D[Firebase Admin verifica la cookie];
    D -- "OK" --> E[Obtiene Firebase User en Servidor];
    C -- No --> F[serverFirebaseUser = null];
    
    subgraph "Renderizado del Servidor"
        E --> G[Pasa serverFirebaseUser como prop];
        F --> G;
    end
    
    G --> H[Cliente recibe HTML y AuthProvider se inicializa con serverFirebaseUser];
    H --> I{CoraboProvider: ¿Hay usuario?};
    I -- Sí --> J[getOrCreateUser flow obtiene el perfil de Corabo];
    I -- No --> K[App espera en estado no autenticado];
    
    J --> L{AppLayout: ¿Setup completo?};
    L -- Sí --> M[Usuario navega por la app];
    L -- No --> N[Redirigido a /initial-setup];
    K --> O[Usuario ve /login];
```

---

## 2. Flujo de Configuración de Perfil y Especialización

Describe cómo un proveedor configura su perfil y cómo se muestran detalles específicos según su categoría.

```mermaid
graph TD
    A[Proveedor accede a Configuración /profile/details] --> B{Lee Categoría Principal del Perfil};
    
    subgraph "Lógica de Formulario Dinámico (/profile/details)"
      direction LR
      B -- "Salud y Bienestar" --> D_Health[Renderiza <HealthFields />];
      B -- "Hogar y Reparaciones" --> D_Home[Renderiza <HomeRepairFields />];
      B -- "Alimentos y Restaurantes" --> D_Food[Renderiza <FoodAndRestaurantFields />];
      B -- "Transporte y Asistencia" --> D_Transport[Renderiza <TransportFields />];
      B -- "Belleza" --> D_Beauty[Renderiza <BeautyFields />];
      B -- "Automotriz y Repuestos" --> D_Auto[Renderiza <AutomotiveFields />];
      B -- "Otros" --> D_General[Renderiza <GeneralProviderFields />];
    end
    
    subgraph "Guardado de Datos"
      D_Health --> E[Usuario llena el formulario y guarda];
      D_Home --> E;
      D_Food --> E;
      D_Transport --> E;
      D_Beauty --> E;
      D_Auto --> E;
      D_General --> E;
      E --> F_FE[Frontend llama a la acción `updateFullProfile`];
      F_FE --> G_BE[Acción de Servidor llama al flujo de Genkit];
      G_BE --> H[Flow actualiza el documento del usuario en Firestore];
      H --> I[Datos especializados persisten en `profileSetupData.specializedData`];
    end
```


---

## 3. Flujo del Cliente (Compra de Producto) con Backend y Carrito Multi-Proveedor

Describe el viaje de un cliente en la nueva arquitectura al comprar un producto.

```mermaid
graph TD
    A[Inicio: Cliente en Perfil de Proveedor] --> B[Añade productos al carrito];
    B --> C[Abre el Carrito (Popover)];
    C --> D[Renderiza `MultiProviderCart` agrupando por proveedor];
    D --> D1[Cliente hace clic en 'Ver Prefactura' para Proveedor A];
    D1 --> E[Se abre `CheckoutAlertDialogContent` con productos de Proveedor A];
    
    subgraph "Selección de Entrega"
      direction TB
      E --> F{Elige método de entrega};
      F -- "Mi dirección" --> G[Usa dirección guardada];
      F -- "Mi ubicación actual (GPS)" --> H[Usa GPS del teléfono];
      F -- "Enviar a otra dirección" --> I[Pide datos de destinatario];
      I --> J[Redirige a /map];
      J --> K[Usuario selecciona ubicación y confirma];
      K --> E[Vuelve al diálogo de pre-factura con dirección y datos de 3ro actualizados];
    end
    
    subgraph "Confirmación y Pago"
      G --> L[Se actualiza el costo de envío];
      H --> L;
      K --> L;
      L --> M{¿Usa Credicora?};
      M -- Sí --> N[Calcula pago inicial y cuotas según nivel de Credicora];
      M -- No --> O[Muestra total a pagar];
      N --> P[Cliente hace clic en 'Pagar Ahora'];
      O --> P;
    end

    subgraph "Lógica de Backend (Acción y Flujo)"
      direction LR
      P --> Q_FE[Frontend llama a la acción `checkout` para Proveedor A];
      Q_FE --> R_BE[Acción de Servidor llama al flujo de Genkit];
      R_BE --> S_BE{¿Se requiere delivery?};
      S_BE -- Sí --> T_BE[Flow llama al `findDeliveryProviderFlow` para buscar repartidor];
      S_BE -- No --> U_BE[Flow actualiza tx a 'Listo para Retirar'];
    end
    
    subgraph "Lógica de Falla de Delivery"
        T_BE -- Falla --> W[Flow actualiza tx a 'Error de Delivery'];
        W --> X[Flow envía notificación a Proveedor A];
        X --> Y[Proveedor A ve opciones: Reintentar, Asignar propio, Convertir a Retiro];
    end
    
    T_BE -- Éxito --> V_FINAL[<B>Transacción Formalizada</B>];
    U_BE --> V_FINAL;

```

---

## 4. Flujo de Afiliación (Empresa - Profesional)

Describe cómo un profesional se afilia a una empresa.

```mermaid
graph TD
    A[Profesional visita perfil de Empresa] --> B[Hace clic en 'Solicitar Afiliación'];
    B --> C_FE[Frontend llama a la acción `requestAffiliation`];
    C_FE --> D_BE[Acción de Servidor llama al flow];
    D_BE --> E_BE[Flow crea documento 'pending' y envía notificación];
    
    subgraph Panel de Admin de la Empresa
        F[Empresa accede a /admin] --> G[Ve la solicitud en la pestaña 'Afiliaciones'];
        G --> H{¿Aprobar?};
        H -- Sí --> I_APPROVE[Llama a la acción `approveAffiliation`];
        H -- No --> J_REJECT[Llama a la acción `rejectAffiliation`];
    end
    
    subgraph Lógica de Backend (Aprobación)
      I_APPROVE --> K_BE[Acción de Servidor llama al flow de aprobación];
      K_BE --> L_BE[Flow actualiza estado a 'approved' y actualiza el perfil del Profesional];
    end
    
    L_BE --> M[Profesional ahora muestra "Verificado por [Empresa]"];
    
```

---

## 5. Flujo de Campaña Publicitaria (con Backend)

Detalla el nuevo flujo de creación de campañas, ahora gestionado por `actions.ts`.

```mermaid
graph TD
    A[Proveedor en su perfil hace clic en 'Gestionar Campañas'] --> B[Se abre el `CampaignDialog`];
    B --> C[Configura campaña (presupuesto, duración, etc.)];
    C --> D[Hace clic en 'Confirmar y Proceder al Pago'];
    
    subgraph "Lógica de Frontend/Backend"
      direction LR
      D --> E_FE[Frontend llama a la acción `createCampaign`];
      E_FE --> F_BE[**Acción de Servidor** recibe los datos];
      F_BE --> G_BE[Llama al `createCampaignFlow` de Genkit];
      G_BE --> H_BE[Flow calcula costos y crea documentos en Firestore ('pending_payment')];
    end

    H_BE --> J[Usuario es redirigido a la pantalla de pago de la transacción];
    J --> K[Usuario paga la transacción];
    
    subgraph "Lógica de Notificación del Backend"
      direction LR
      K --> L_VERIFY[Admin verifica el pago en el panel];
      L_VERIFY --> M_UPDATE[Acción de Admin actualiza campaña a 'active'];
      M_UPDATE --> N_NOTIFY[Acción de Admin llama a la acción `sendNewCampaignNotifications`];
      N_NOTIFY --> O_END[Usuarios relevantes reciben la notificación];
    end
    
    O_END --> P_FINAL[<B>Campaña Publicitaria Activa y Notificada</B>];

```
