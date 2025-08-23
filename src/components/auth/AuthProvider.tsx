
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import type { User as CoraboUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateUser } from '@/lib/actions';


interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: CoraboUser | null; // This is now the definitive Corabo user profile
  isLoadingUser: boolean; // Single loading state for the whole auth process
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUser: (user: CoraboUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    serverFirebaseUser: FirebaseUser | null; // User object passed from server
};

export const AuthProvider = ({ children, serverFirebaseUser }: AuthProviderProps) => {
  const { toast } = useToast();
  
  // This state is now ONLY for the Corabo user profile.
  const [currentUser, setCurrentUser] = useState<CoraboUser | null>(null);
  
  // The Firebase user state is initialized directly from the server prop.
  // This is the key change to prevent hydration errors.
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(serverFirebaseUser);
  
  // A single, reliable loading state.
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // This effect runs ONCE when the provider mounts, or if the server-passed user changes.
  // It's responsible for fetching our app-specific user profile.
  useEffect(() => {
    const fetchCoraboUser = async (fUser: FirebaseUser) => {
        try {
            // Call the server action to get/create the user profile.
            const coraboUser = await getOrCreateUser({
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
        } finally {
            // Once we have a response (or error), the loading process is finished.
            setIsLoadingUser(false);
        }
    };
    
    if (serverFirebaseUser) {
        fetchCoraboUser(serverFirebaseUser);
    } else {
        // If there's no serverFirebaseUser, we are definitely logged out.
        setCurrentUser(null);
        setIsLoadingUser(false);
    }
  }, [serverFirebaseUser, toast]);

  // This second effect listens for CLIENT-SIDE auth changes (e.g., manual logout, token expiration).
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        // If user logs out on the client, ensure all state is cleared.
        setCurrentUser(null);
        setIsLoadingUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoadingUser(true); // Start loading on sign-in attempt
    try {
        const auth = getAuthInstance();
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        const idToken = await result.user.getIdToken();
        // Set the session cookie for server-side rendering
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        
        // Update the local firebaseUser state. This will trigger the
        // fetchCoraboUser effect to get the profile.
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
        setIsLoadingUser(false); // Stop loading on error
    }
  };

  const logout = async () => {
    setIsLoadingUser(true);
    try {
        const auth = getAuthInstance();
        await signOut(auth);
        await fetch('/api/auth/session', { method: 'DELETE' });
        // onAuthStateChanged will set firebaseUser to null, clearing all state.
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
