// This file contains the shared Firebase configuration object.
// It is environment-agnostic and can be safely imported by both client and server modules.

const config = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;

if (!config) {
  throw new Error(
    "CRITICAL: Firebase web app config environment variable not set. This app requires NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG to be available."
  );
}

export const firebaseConfig = JSON.parse(config);
