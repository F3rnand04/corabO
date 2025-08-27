
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { onIdTokenChanged } from 'firebase/auth';

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
  
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
      
      const idToken = user ? await user.getIdToken() : null;
      // This fetch is a "fire and forget" call to update the session cookie on the server.
      // We don't need to block rendering for it.
      // This also handles logout by sending a null token.
      fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      }).catch(error => {
          // It's good to log this error, but we don't need to show it to the user.
          console.error("Failed to sync session cookie:", error);
      });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // This effect should only run once on mount.

  const logout = async () => {
    const auth = getAuthInstance();
    await auth.signOut(); // This will trigger onIdTokenChanged, setting user to null.
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
