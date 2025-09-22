// This file contains the shared Firebase configuration object.
// It is environment-agnostic and can be safely imported by both client and server modules.

// This function will parse the environment variable provided by Firebase App Hosting.
export function getFirebaseConfig() {
  const config = typeof window === 'undefined' 
    ? process.env.FIREBASE_WEBAPP_CONFIG // Server-side
    : process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG; // Client-side

  if (!config) {
    throw new Error(
      "CRITICAL: Firebase web app config environment variable not set. This app requires FIREBASE_WEBAPP_CONFIG (server) or NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG (client) to be available."
    );
  }
  return JSON.parse(config);
}
