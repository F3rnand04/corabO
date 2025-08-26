'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { onIdTokenChanged, signOut } from 'firebase/auth';
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
      // Send the token to the server to set a session cookie
      // This is crucial for keeping the server and client in sync
      fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      }).catch(error => {
          // It's not critical if this fails during development, but good to know.
          console.error("Failed to sync session cookie:", error);
      });
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    const auth = getAuthInstance();
    await signOut(auth);
    // The onIdTokenChanged listener will handle setting user to null and clearing the cookie.
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
