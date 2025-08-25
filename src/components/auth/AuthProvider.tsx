
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import * as Actions from '@/lib/actions';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  isLoadingAuth: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    serverFirebaseUser: FirebaseUser | null; 
};

// Este componente ahora es más simple. Su responsabilidad principal es:
// 1. Recibir el estado del usuario desde el servidor (serverFirebaseUser).
// 2. Mantener ese estado sincronizado.
// 3. Proveer las funciones de login/logout que interactúan con la API de sesión.
export const AuthProvider = ({ children, serverFirebaseUser }: AuthProviderProps) => {
  const { toast } = useToast();
  // El estado inicial del usuario se establece directamente desde la propiedad del servidor.
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(serverFirebaseUser);
  // isLoadingAuth ahora solo refleja el proceso de login/logout, no la carga inicial.
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Este efecto sincroniza el estado del cliente con el del servidor.
  useEffect(() => {
    setFirebaseUser(serverFirebaseUser);
  }, [serverFirebaseUser]);

  const signInWithGoogle = async () => {
    setIsLoadingAuth(true);
    try {
        const auth = getAuthInstance();
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        const idToken = await result.user.getIdToken();
        // Llama a nuestra API route para crear la cookie de sesión.
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        
        // Actualizamos el estado local para reflejar el login inmediatamente.
        setFirebaseUser(result.user);

    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          console.error("Error signing in with Google:", error);
           toast({
              variant: "destructive",
              title: "Error de Inicio de Sesión",
              description: "No se pudo iniciar sesión con Google.",
           });
        }
    } finally {
      // La recarga de la página post-login ahora es manejada por el router o un refresh.
      // Esto asegura que el RootLayout del servidor lea la nueva cookie.
      window.location.reload();
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
        const auth = getAuthInstance();
        await signOut(auth);
        // Llama a nuestra API route para destruir la cookie.
        await fetch('/api/auth/session', { method: 'DELETE' });
        setFirebaseUser(null);
    } catch (error) {
         console.error("Error signing out:", error);
    } finally {
        setIsLoadingAuth(false);
    }
  };
  
  const value = {
    firebaseUser,
    isLoadingAuth,
    signInWithGoogle,
    logout,
  };
  
  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  )
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
