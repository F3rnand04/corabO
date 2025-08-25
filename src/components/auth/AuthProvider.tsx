
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const { syncCoraboUser } = useCorabo();

  useEffect(() => {
    // This now just syncs the user profile on initial load if a user exists
    // and sets loading to false. The real auth state is managed externally.
    syncCoraboUser(serverFirebaseUser);
    setIsLoadingAuth(false);
  }, [serverFirebaseUser, syncCoraboUser]);

  const logout = async () => {
    // Logout logic will be re-implemented with the new auth method.
    toast({ title: "Cerrar Sesión", description: "La función de cierre de sesión se implementará con el nuevo sistema."});
  };
  
  const value = {
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
