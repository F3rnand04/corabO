"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { onIdTokenChanged, getRedirectResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { clearSessionCookie, createSessionCookie } from '@/lib/actions/auth.actions';

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

    // First, process the redirect result to capture the user from Google's redirect.
    // This is crucial to run before the onIdTokenChanged listener is fully relied upon.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
            // User has successfully signed in through redirect.
            // onIdTokenChanged will handle the rest.
             toast({
              title: "¡Bienvenido de vuelta!",
              description: "Has iniciado sesión correctamente.",
            });
        }
      })
      .catch((error) => {
        // Handle errors here if necessary, such as network issues.
        console.error("Error getting redirect result:", error);
        toast({
          variant: "destructive",
          title: "Error de Autenticación",
          description: "No se pudo completar el inicio de sesión. Por favor, inténtalo de nuevo."
        });
      })
      .finally(() => {
        // Now, set up the primary listener.
        const unsubscribe = onIdTokenChanged(auth, async (user) => {
          setFirebaseUser(user);
          setIsLoadingAuth(false);
          
          const idToken = user ? await user.getIdToken() : null;
          if (idToken) {
            await createSessionCookie(idToken);
          } else {
            await clearSessionCookie();
          }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
      });
  }, [toast]);

  const logout = async () => {
    const auth = getAuthInstance();
    await auth.signOut(); // This will trigger onIdTokenChanged, setting the user to null.
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
