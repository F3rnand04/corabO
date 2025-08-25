
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';

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
  const { syncCoraboUser, clearCoraboUser, currentUser } = useCorabo();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuthInstance(), async (user) => {
        setFirebaseUser(user);
        if (user) {
            // This is the key: sync the Corabo user profile whenever the Firebase user state changes.
            // The CoraboContext will handle the logic of fetching or creating.
            if (!currentUser || currentUser.id !== user.uid) {
               await syncCoraboUser(user);
            }
        } else {
            clearCoraboUser();
        }
        setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [syncCoraboUser, clearCoraboUser, currentUser]);


  const signInWithGoogle = async () => {
    setIsLoadingAuth(true);
    try {
        const auth = getAuthInstance();
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // The onAuthStateChanged listener will handle the rest of the logic,
        // so we don't need to do anything else here.
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            console.error("Error signing in with Google:", error);
            toast({ variant: 'destructive', title: "Error de Inicio de Sesión", description: "No se pudo iniciar sesión con Google." });
        }
        setIsLoadingAuth(false); // Ensure loading is stopped on error
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
        await signOut(getAuthInstance());
        // The onAuthStateChanged listener will handle clearing the user state.
    } catch (error) {
         console.error("Error signing out:", error);
    } finally {
        window.location.href = '/login'; // Force a full redirect to clear all state
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
