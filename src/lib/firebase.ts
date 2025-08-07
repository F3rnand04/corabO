
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "corabo-demo",
  "appId": "1:220291714642:web:3aca123e39a92f16c0998b",
  "storageBucket": "corabo-demo.firebasestorage.app",
  "apiKey": "AIzaSyAOZ9eRQz1Sry6pdLNwCVZ3QNsr1pZgHnQ",
  // Forzamos el dominio de autenticación para que coincida con el dominio de despliegue
  "authDomain": "studio--corabo-demo.us-central1.hosted.app", 
  "measurementId": "",
  "messagingSenderId": "220291714642"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();


export { app, auth, db, provider };
