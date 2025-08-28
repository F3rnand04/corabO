
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { clearSessionCookie } from '@/lib/actions/auth.actions';

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

    // onIdTokenChanged is the recommended listener for session management.
    // It fires when the user signs in, signs out, or the token is refreshed.
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
      
      // If the user logs out on the client, ensure the server-side session is cleared.
      if (!user) {
        await clearSessionCookie();
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    const auth = getAuthInstance();
    await auth.signOut();
    // The onIdTokenChanged listener will fire, clearing the cookie and updating the state.
    // The AppLayout component will then handle the redirection.
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
