# /src/hooks

This directory contains React custom hooks that encapsulate reusable logic and complex state management, keeping components clean and focused on the UI.

## Main Hooks

-   **`use-auth-provider.tsx`**:
    -   **Purpose:** This is the **single source of truth** for all global application state, including authentication and real-time data. It centralizes state management to ensure consistency and performance.
    -   **Key Functionality:**
        -   Manages the authentication state (`currentUser`, `firebaseUser`, `isLoadingAuth`).
        -   Establishes real-time listeners for all necessary Firestore collections (`users`, `transactions`, `publications`, `conversations`, etc.) **only after** a user is successfully authenticated.
        -   Provides the data from these listeners to the entire application via the `useAuth` hook.
        -   Handles client-side routing logic based on the user's authentication and profile completion status.
    -   **Usage:** It provides the `AuthProvider` that wraps the entire application in `layout.tsx`. Any component within this provider can use the `useAuth()` hook to access both user data and global application data.

-   **`useToast.ts`**:
    -   **Purpose:** Provides a standardized and simple way to display "toast" notifications (pop-up messages) throughout the application.

-   **`use-mobile.ts`**:
    -   **Purpose:** A simple hook to detect if the user is on a mobile device, allowing for conditional rendering of components.
