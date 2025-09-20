'use client';

import { useContext } from 'react';
import { CoraboContext, type CoraboContextValue } from '@/contexts/CoraboContext';

// This is the clean, focused hook for application data.
// Components will use this to get all non-auth data.
export const useCorabo = (): CoraboContextValue => {
  const context = useContext(CoraboContext);
  if (context === undefined) {
    throw new Error('useCorabo must be used within a CoraboProvider');
  }
  return context;
};
