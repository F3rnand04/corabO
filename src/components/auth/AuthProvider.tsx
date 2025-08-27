
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { onIdTokenChanged, getRedirectResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    serverFirebaseUser: FirebaseUser | null;
};

export const AuthProvider = ({ children, serverFirebaseUser }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(serverFirebaseUser);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const auth = getAuthInstance();

    // Primero, procesa el resultado de la redirección para capturar el usuario
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
            // Usuario ha iniciado sesión exitosamente a través de la redirección.
            // onIdTokenChanged se encargará del resto.
        }
      })
      .catch((error) => {
        // Manejar errores aquí si es necesario, como problemas de red.
        console.error("Error getting redirect result:", error);
        toast({
          variant: "destructive",
          title: "Error de Autenticación",
          description: "No se pudo completar el inicio de sesión. Por favor, inténtalo de nuevo."
        });
      })
      .finally(() => {
         // onIdTokenChanged se ejecutará de todas formas. Aquí nos aseguramos de que el estado de carga
         // se actualice correctamente después de intentar obtener el resultado de la redirección.
         // En el caso de que no haya redirección, el listener de abajo se encargará.
      });


    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
      
      const idToken = user ? await user.getIdToken() : null;
      // Actualiza la cookie de sesión en el servidor. Esto es "fire-and-forget".
      fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      }).catch(error => {
          console.error("Failed to sync session cookie:", error);
      });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  const logout = async () => {
    const auth = getAuthInstance();
    await auth.signOut(); // Esto activará onIdTokenChanged, poniendo el usuario a null.
  };
  
  const value: AuthContextType = {
    firebaseUser,
    isLoadingAuth,
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
