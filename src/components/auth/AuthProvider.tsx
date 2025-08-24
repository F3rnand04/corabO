
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import * as Actions from '@/lib/actions';
import type { User } from '@/lib/types';
import { CoraboContext } from '@/contexts/CoraboContext';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: User | null; // currentUser is now managed here
  isLoadingAuth: boolean; 
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    serverFirebaseUser: FirebaseUser | null; 
};

export const AuthProvider = ({ children, serverFirebaseUser }: AuthProviderProps) => {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(serverFirebaseUser);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // This effect synchronizes the client-side auth state with Firebase's own state manager.
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // If Firebase user exists, fetch or create the corresponding Corabo user profile
        try {
            const coraboUser = await Actions.getOrCreateUser({
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
            });
            setCurrentUser(coraboUser as User);
        } catch (error) {
            console.error("Failed to fetch/create Corabo user on auth change:", error);
            toast({ variant: "destructive", title: "Error de Perfil", description: "No se pudo cargar tu perfil de Corabo." });
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [toast]);

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
        
        // The onAuthStateChanged listener above will handle setting firebaseUser and currentUser
        
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          console.error("Error signing in with Google:", error);
           toast({
              variant: "destructive",
              title: "Error de Inicio de Sesión",
              description: "No se pudo iniciar sesión con Google.",
           });
        }
        setIsLoadingAuth(false); // Ensure loading is false on error
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
        const auth = getAuthInstance();
        await signOut(auth);
        await fetch('/api/auth/session', { method: 'DELETE' });
        setFirebaseUser(null);
        setCurrentUser(null);
    } catch (error) {
         console.error("Error signing out:", error);
    } finally {
        setIsLoadingAuth(false);
    }
  };
  
  const value = {
    firebaseUser,
    currentUser,
    isLoadingAuth,
    signInWithGoogle,
    logout,
  };
  
  return (
      <CoraboContext.Provider value={value as any}>
        {children}
      </CoraboContext.Provider>
  )
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Re-export CoraboContext's useCorabo hook for convenience
export const useCorabo = () => {
    const context = useContext(CoraboContext);
     if (context === undefined) {
        throw new Error('useCorabo must be used within a CoraboProvider');
    }
    return context;
}
