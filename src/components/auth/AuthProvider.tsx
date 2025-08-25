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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { toast } = useToast();
  // IMPORTANT: We need syncCoraboUser from CoraboContext to bridge the auth gap.
  const { syncCoraboUser, clearCoraboUser } = useCorabo();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuthInstance(), (user) => {
        setFirebaseUser(user);
        setIsLoadingAuth(false);
        // When auth state changes (e.g., on initial load with a valid session),
        // sync the profile.
        if (user) {
          syncCoraboUser(user);
        } else {
          clearCoraboUser();
        }
    });

    return () => unsubscribe();
    // The dependency array is crucial. We want this to run only once and when the sync function is ready.
  }, [syncCoraboUser, clearCoraboUser]);


  const signInWithGoogle = useCallback(async (): Promise<void> => {
    setIsLoadingAuth(true);
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      
      // Create the session cookie on the server
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (!response.ok) {
          throw new Error('Failed to create server session.');
      }
      
      // CRITICAL FIX: Manually update firebaseUser state and trigger profile sync
      // immediately without waiting for onAuthStateChanged or reloading the page.
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
    setIsLoadingAuth(true);
    try {
        await signOut(getAuthInstance());
        await fetch('/api/auth/session', { method: 'DELETE' });
        setFirebaseUser(null);
        clearCoraboUser(); // Ensure Corabo user state is also cleared
    } catch (error) {
         console.error("Error signing out:", error);
         toast({ variant: 'destructive', title: "Error", description: "No se pudo cerrar la sesión."});
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