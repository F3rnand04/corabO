
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import * as Actions from '@/lib/actions';
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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Start as true
  const { setCurrentUser, setIsLoadingUser } = useContext(CoraboContext)!;
  const { toast } = useToast();

  const syncCoraboUser = useCallback(async (user: FirebaseUser) => {
    setIsLoadingUser(true);
    try {
        const coraboProfile = await Actions.getOrCreateUser(user);
        setCurrentUser(coraboProfile);
    } catch (e) {
        console.error("Fatal error syncing user profile:", e);
        toast({ variant: 'destructive', title: "Error de Sincronización", description: "No se pudo cargar tu perfil de Corabo. Intenta recargar la página." });
        setCurrentUser(null);
    } finally {
        setIsLoadingUser(false);
    }
  }, [setIsLoadingUser, setCurrentUser, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuthInstance(), async (user) => {
        setFirebaseUser(user);
        if (user) {
            await syncCoraboUser(user);
        } else {
            setCurrentUser(null);
        }
        setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [syncCoraboUser, setCurrentUser]);


  const signInWithGoogle = async () => {
    setIsLoadingAuth(true);
    try {
        const auth = getAuthInstance();
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();
        
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        
        // After successful sign-in and session creation, force a reload
        // to ensure the server picks up the new session cookie and hydrates correctly.
        window.location.reload();

    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            console.error("Error signing in with Google:", error);
            toast({ variant: 'destructive', title: "Error de Inicio de Sesión", description: "No se pudo iniciar sesión con Google." });
        }
    } finally {
      // Don't set loading to false here, the reload will handle it.
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
        await signOut(getAuthInstance());
        await fetch('/api/auth/session', { method: 'DELETE' });
        setCurrentUser(null);
        // Force a reload on logout to clear all state and ensure clean hydration
        window.location.href = '/login'; 
    } catch (error) {
         console.error("Error signing out:", error);
    } finally {
        // isLoading will be reset by the page reload
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
