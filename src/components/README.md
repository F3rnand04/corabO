# /src/components

This directory houses all of the application's reusable React components, organized by functionality to maintain a clean and scalable project.

## Structure

-   **`/` (Root):** Contains high-level or very generic components used across multiple parts of the application.
    -   `Footer.tsx`: The main navigation footer.
    -   `Header.tsx`: The main application header.
    -   `UserProfilePage.tsx`: The primary component that renders a user's profile, reused for one's own profile and for viewing others' profiles.
    -   ... and other global components.

-   **`/admin`**: Components specific to the Administration Panel.
    -   `UserManagementTab.tsx`: Table and logic for managing users.
    -   `PaymentVerificationTab.tsx`: Interface for verifying payments.
    -   ... and other tabs and dialogs for the panel.

-   **`/profile-setup`**: Components for the multi-step profile setup flows (both for personal and company providers).

-   **`/ui`**: Contains the UI library components (from shadcn/ui). These are "primitive" and styled components (Button, Card, Input, etc.) used to build more complex components. **They must not contain business logic.**

-   **`/feed`**: Components related to the main content feed.
    - `FeedView.tsx`: The main component that fetches and displays the paginated list of publications.
