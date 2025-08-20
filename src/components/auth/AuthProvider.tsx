
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useRouter, usePathname } from "next/navigation";
import type { User } from '@/lib/types';
import { getOrCreateUser } from '@/ai/flows/auth-flow'; 
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoadingAuth: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoadingAuth(true);
      if (firebaseUser) {
        try {
          // Call the server action directly here. This is the correct pattern.
          const user = await getOrCreateUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          });
          
          if (user) {
            setCurrentUser(user as User);
          } else {
            throw new Error("User data could not be retrieved from the server.");
          }
        } catch (error) {
          console.error("Error fetching/creating user:", error);
          await signOut(auth); // Sign out if there's an error
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoadingAuth) return;

    const isPublicPage = ['/login', '/cashier-login', '/policies', '/terms', '/privacy', '/community-guidelines'].some(p => pathname.startsWith(p));
    
    if (!currentUser) {
      if (!isPublicPage) {
        router.replace('/login');
      }
    } else {
      if (!currentUser.isInitialSetupComplete && !pathname.startsWith('/initial-setup')) {
          router.replace('/initial-setup');
      } else if (currentUser.isInitialSetupComplete && (pathname === '/login' || pathname === '/initial-setup')) {
          router.replace('/');
      }
    }
  }, [currentUser, isLoadingAuth, pathname, router]);


  const signInWithGoogle = async () => {
    try {
        const auth = getAuthInstance();
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will handle the rest
    } catch (error: any) {
       if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Error signing in with Google:", error);
        toast({
          variant: "destructive",
          title: "Error de Inicio de Sesión",
          description: "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.",
        });
      }
    }
  };

  const logout = async () => {
    await signOut(getAuthInstance());
    setCurrentUser(null);
    router.push('/login');
  };

  const value = {
    currentUser,
    setCurrentUser,
    isLoadingAuth,
    signInWithGoogle,
    logout,
  };
  
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
