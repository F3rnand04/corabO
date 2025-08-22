
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';

// Este contexto ahora solo se preocupa por el estado de Firebase Auth.
// No sabe nada sobre el perfil de usuario de Corabo.
interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  isLoadingAuth: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Comienza en true

  useEffect(() => {
    const auth = getAuthInstance();
    // onAuthStateChanged devuelve el "unsubscribe"
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false); // La carga termina cuando se recibe el primer estado
    });

    // Limpia el listener al desmontar el componente
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // El listener onAuthStateChanged se encargará de actualizar el estado
  };

  const logout = async () => {
    const auth = getAuthInstance();
    await signOut(auth);
    setFirebaseUser(null);
  };

  const value = {
    firebaseUser,
    isLoadingAuth,
    signInWithGoogle,
    logout,
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
