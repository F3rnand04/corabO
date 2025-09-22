
// This file contains the shared Firebase configuration object.
// It is environment-agnostic and can be safely imported by both client and server modules.

// This function will parse the environment variable provided by Firebase App Hosting.
function getFirebaseConfig() {
  const config = process.env.FIREBASE_WEBAPP_CONFIG;
  if (!config) {
    throw new Error(
      "CRITICAL: Firebase web app config environment variable not set. This app requires FIREBASE_WEBAPP_CONFIG to be available."
    );
  }
  return JSON.parse(config);
}

export const firebaseConfig = getFirebaseConfig();
