
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useRouter } from "next/navigation";
import type { User } from '@/lib/types';
import type { FirebaseUserInput } from '@/ai/flows/auth-flow';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoadingAuth: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    getOrCreateUser: (user: FirebaseUserInput) => Promise<any>;
};

export const AuthProvider = ({ children, getOrCreateUser }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const { toast } = useToast();


  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const user = await getOrCreateUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          });
          if (user) {
            setCurrentUser(user as User);
          } else {
            throw new Error("User data could not be retrieved from the server.");
          }
        } catch (error) {
          console.error("Error fetching/creating user:", error);
          toast({
            variant: "destructive",
            title: "Error de Servidor",
            description: "No se pudo obtener la información de tu perfil. Inténtalo más tarde.",
          });
          await signOut(auth);
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [getOrCreateUser, toast]);

  const signInWithGoogle = async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(getAuthInstance());
    setCurrentUser(null);
    router.push('/login');
  };

  const value = {
    currentUser,
    setCurrentUser,
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
