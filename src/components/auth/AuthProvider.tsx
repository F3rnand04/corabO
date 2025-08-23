
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { getOrCreateUserFlow } from '@/ai/flows/auth-flow';
import type { User as CoraboUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: CoraboUser | null;
  isLoadingUser: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUser: (user: CoraboUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    serverFirebaseUser: FirebaseUser | null;
};

export const AuthProvider = ({ children, serverFirebaseUser }: AuthProviderProps) => {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(serverFirebaseUser);
  const [currentUser, setCurrentUser] = useState<CoraboUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const fetchCoraboUser = useCallback(async (fUser: FirebaseUser | null) => {
    if (fUser) {
        try {
            const coraboUser = await getOrCreateUserFlow({
                uid: fUser.uid,
                displayName: fUser.displayName,
                email: fUser.email,
                photoURL: fUser.photoURL,
                emailVerified: fUser.emailVerified,
            });
            setCurrentUser(coraboUser as CoraboUser);
        } catch (error) {
            console.error("Failed to fetch or create Corabo user:", error);
            toast({
                variant: "destructive",
                title: "Error de Cuenta",
                description: "No pudimos cargar los datos de tu perfil de Corabo.",
            });
            setCurrentUser(null);
        }
    } else {
        setCurrentUser(null);
    }
    setIsLoadingUser(false);
  }, [toast]);


  useEffect(() => {
    if (serverFirebaseUser && !currentUser) {
        fetchCoraboUser(serverFirebaseUser);
    } else {
        setIsLoadingUser(false);
    }

    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setFirebaseUser(user);
        if (!user) {
            setCurrentUser(null);
            setIsLoadingUser(false);
        } else if (user.uid !== currentUser?.id) {
            setIsLoadingUser(true);
            await fetchCoraboUser(user);
        }
    });

    return () => unsubscribe();
  }, [serverFirebaseUser, fetchCoraboUser, currentUser]);

  const signInWithGoogle = async () => {
    setIsLoadingUser(true);
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
        // onAuthStateChanged will handle fetching the Corabo user
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          console.error("Error signing in with Google:", error);
           toast({
              variant: "destructive",
              title: "Error de Inicio de Sesión",
              description: "No se pudo iniciar sesión con Google.",
           });
        }
        setIsLoadingUser(false);
    }
  };

  const logout = async () => {
    setIsLoadingUser(true);
    try {
        const auth = getAuthInstance();
        await signOut(auth);
        setCurrentUser(null);
        setFirebaseUser(null);
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
         console.error("Error signing out:", error);
    } finally {
        setIsLoadingUser(false);
    }
  };
  
  const value = {
    firebaseUser,
    currentUser,
    isLoadingUser,
    signInWithGoogle,
    logout,
    setCurrentUser,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
