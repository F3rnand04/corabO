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

// --- Mock User for Development Bypass ---
const mockFirebaseUser = {
    uid: 'dev-user-bypass',
    email: 'dev@corabo.app',
    displayName: 'Dev User',
    photoURL: 'https://i.pravatar.cc/150?u=dev-user-bypass',
    emailVerified: true,
    // Add other required properties of Firebase User with dummy values
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({ token: 'mock-token', expirationTime: '', authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
    reload: async () => {},
    toJSON: () => ({}),
    providerId: 'password',
    phoneNumber: null
} as unknown as FirebaseUser;
// --- End Mock User ---


export const AuthProvider = ({ children, serverFirebaseUser }: AuthProviderProps) => {
  // Use the mock user to bypass real authentication
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(mockFirebaseUser);
  // Set isLoadingAuth to false immediately
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const router = useRouter();
  
  // The original useEffect for onIdTokenChanged is commented out to prevent real auth checks
  /*
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
      
      const idToken = user ? await user.getIdToken() : null;
      fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      }).catch(error => {
          console.error("Failed to sync session cookie:", error);
      });
    });

    return () => unsubscribe();
  }, []);
  */

  const logout = async () => {
    // When logging out in this mock environment, we can just clear the user and redirect.
    setFirebaseUser(null);
    setIsLoadingAuth(true); // Simulate loading state on logout
    await fetch('/api/auth/session', { // Clear server session cookie
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: null }),
      });
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
