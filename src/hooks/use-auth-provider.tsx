
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { getOrCreateUser } from '@/lib/actions/auth.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { CoraboProvider } from '@/contexts/CoraboContext';
import type { FirebaseUserInput, User } from '@/lib/types';

// Interface for the Authentication Context
export interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// Create the Authentication Context
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// AuthProvider Component: Handles auth state and orchestrates data providers
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Effect for Firebase authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userPayload: FirebaseUserInput = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            phoneNumber: fbUser.phoneNumber,
            emailVerified: fbUser.emailVerified
        };
        // Get or create the user profile from Firestore
        const userProfile = await getOrCreateUser(userPayload);
        setCurrentUser(userProfile);
      } else {
        setFirebaseUser(null);
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Effect for handling client-side routing based on auth state
  useEffect(() => {
    if (isLoadingAuth) return;

    const isAuthPage = pathname === '/login';
    const isSetupPage = pathname === '/initial-setup';

    if (!currentUser && !isAuthPage) {
      router.push('/login');
    } else if (currentUser && !currentUser.isInitialSetupComplete && !isSetupPage) {
      router.push('/initial-setup');
    } else if (currentUser && currentUser.isInitialSetupComplete && (isAuthPage || isSetupPage)) {
      router.push('/');
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // Clear all local state on logout
      setCurrentUser(null);
      setFirebaseUser(null);
      router.push('/login');
    } catch (error: any) {
      console.error("Error during logout:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.' });
    }
  }, [toast, router]);

  const authContextValue: AuthContextValue = {
    currentUser,
    firebaseUser,
    isLoadingAuth,
    logout,
    setCurrentUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
        {/* The CoraboProvider is nested inside, so it only runs when a user is authenticated */}
        <CoraboProvider>
            {children}
        </CoraboProvider>
    </AuthContext.Provider>
  );
};
