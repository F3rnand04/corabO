
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  isLoadingAuth: boolean;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
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
    const unsubscribe = onAuthStateChanged(getAuthInstance(), (user) => {
        setFirebaseUser(user);
        setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);


  const signInWithGoogle = useCallback(async (): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true);
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (!response.ok) {
          throw new Error('Failed to create session cookie.');
      }
      
      // The onAuthStateChanged listener will update the state.
      // We return the user object so the caller can use it immediately without waiting for the listener.
      setFirebaseUser(result.user);
      setIsLoadingAuth(false);
      return result.user;
      
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            console.error("Error signing in with Google:", error);
            toast({ variant: 'destructive', title: "Error de Inicio de Sesión", description: "No se pudo iniciar sesión con Google." });
        }
        setIsLoadingAuth(false);
        throw error;
    }
  }, [toast]);

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
        await signOut(getAuthInstance());
        await fetch('/api/auth/session', { method: 'DELETE' });
        setFirebaseUser(null);
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
