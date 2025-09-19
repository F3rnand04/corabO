'use client';

import { useContext } from 'react';
import { AuthContext } from './use-auth';

// This hook is now a simple alias for useAuth.
// It's kept for backward compatibility in case some components are still using it.
export const useCorabo = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCorabo must be used within an AuthProvider');
  }
  return context;
};
