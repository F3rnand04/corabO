
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
            // Only sync if the corabo user isn't loaded yet to avoid re-syncs
            if (!currentUser) {
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
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();
        
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        
        // After setting the cookie, we trigger a reload to ensure the server-side
        // rendering picks up the new session state. This is a robust pattern.
        window.location.reload();
        
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            console.error("Error signing in with Google:", error);
            toast({ variant: 'destructive', title: "Error de Inicio de Sesión", description: "No se pudo iniciar sesión con Google." });
        }
        setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
        await signOut(getAuthInstance());
        await fetch('/api/auth/session', { method: 'DELETE' });
        clearCoraboUser();
        window.location.href = '/login'; 
    } catch (error) {
         console.error("Error signing out:", error);
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
