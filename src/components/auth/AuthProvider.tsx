
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

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
  // This provider is now completely neutered. It does not manage auth state.
  // It simply provides a consistent context shape to prevent the app from crashing.
  const value: AuthContextType = {
    firebaseUser: null,
    isLoadingAuth: false, // FORCED to false to prevent loading spinners.
    logout: async () => { console.log("Logout no-op"); },
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
