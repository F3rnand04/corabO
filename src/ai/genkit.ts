/**
 * @fileOverview Central Genkit Schemas and Types.
 *
 * This file is now designed to be environment-agnostic. It should only
 * export types, schemas, or simple configurations that are safe to import
 * in both client and server components.
 *
 * It MUST NOT initialize any plugins (like `googleAI()` or `firebase()`)
 * to prevent server-side code from leaking into the client bundle.
 * The actual Genkit instance is configured and initialized in `src/lib/actions.ts`.
 */

// This file is currently empty as all initialization logic has been moved
// to the server-side actions file to fix build errors.
// It is kept for future use if shared types or schemas are needed.

export {};
