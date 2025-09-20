'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './use-auth-provider';

// This is the clean, focused hook for authentication.
// Components will use this to get user data and auth status.
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
