"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type MultiFactorResolver,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  MfaRequiredError,
  isMfaRequiredError,
  mfaResolverFrom,
  resolveMfaSignIn,
} from "@/lib/account";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  resolveMfa: (resolver: MultiFactorResolver, code: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        try {
          await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        } catch (error) {
          if (isMfaRequiredError(error)) {
            throw new MfaRequiredError(mfaResolverFrom(error));
          }
          throw error;
        }
      },
      resolveMfa: async (resolver, code) => {
        await resolveMfaSignIn(resolver, code);
      },
      signUp: async (email, password) => {
        const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        try {
          await sendEmailVerification(credential.user);
        } catch {
          // The user can request another verification email from the account page.
        }
      },
      signInWithGoogle: async () => {
        await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      },
      signOut: async () => {
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
