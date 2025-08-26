
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getOrCreateUser } from '@/lib/actions/user.actions';
import type { FirebaseUserInput } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoadingAuth(true);
      if (user) {
        setFirebaseUser(user);
        const userData: FirebaseUserInput = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            phoneNumber: user.phoneNumber,
            emailVerified: user.emailVerified,
        };
        // Ensure user document exists before proceeding
        await getOrCreateUser(userData);
      } else {
        setFirebaseUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    const auth = getAuthInstance();
    await signOut(auth);
    setFirebaseUser(null);
    router.push('/login'); // Redirect to login on logout
  };
  
  const value: AuthContextType = {
    firebaseUser,
    isLoadingAuth,
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
