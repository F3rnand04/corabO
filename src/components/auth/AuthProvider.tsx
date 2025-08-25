
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext'; 

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

export const AuthProvider = ({ children, serverFirebaseUser }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(serverFirebaseUser);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const { toast } = useToast();
  const { syncCoraboUser } = useCorabo();

  // The onAuthStateChanged listener is no longer needed because the server-side
  // session check in RootLayout is now the source of truth. signIn and logout
  // will now manually trigger the profile sync.

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    setIsLoadingAuth(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (!response.ok) {
          throw new Error('Failed to create server session.');
      }
      
      // Explicitly set the user and trigger profile sync
      setFirebaseUser(result.user);
      await syncCoraboUser(result.user);
      
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            console.error("Error signing in with Google:", error);
            toast({ variant: 'destructive', title: "Error de Inicio de Sesión", description: "No se pudo iniciar sesión con Google." });
        }
    } finally {
        setIsLoadingAuth(false);
    }
  }, [toast, syncCoraboUser]);

  const logout = async () => {
    try {
        await signOut(getAuthInstance());
        await fetch('/api/auth/session', { method: 'DELETE' });
        // Explicitly clear the user and profile
        setFirebaseUser(null);
        await syncCoraboUser(null);
    } catch (error) {
         console.error("Error signing out:", error);
         toast({ variant: 'destructive', title: "Error", description: "No se pudo cerrar la sesión."});
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
