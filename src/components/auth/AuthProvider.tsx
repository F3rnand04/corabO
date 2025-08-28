
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { clearSessionCookie, createSessionCookie } from '@/lib/actions/auth.actions';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  isLoadingAuth: boolean;
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
  const router = useRouter();
  
  useEffect(() => {
    const auth = getAuthInstance();

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
      
      const idToken = user ? await user.getIdToken() : null;
      if (idToken) {
        await createSessionCookie(idToken);
      } else {
        await clearSessionCookie();
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    const auth = getAuthInstance();
    await auth.signOut();
    // After signing out, the onIdTokenChanged listener will fire, clearing the cookie.
    // We then explicitly navigate to the login page.
    router.push('/login');
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
