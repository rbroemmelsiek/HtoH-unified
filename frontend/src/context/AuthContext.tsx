"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";
import { firebaseFirestore } from "../lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import planGateway from "../services/planGateway/planGateway";

/** Sign-up tier: which sign-in methods are allowed. Extend later for paid tiers (e.g. email link). */
export type SignUpTier = "free" | "paid";

export interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  /** False when Firebase Auth is not configured (missing API key in .env.local). */
  isConfigured: boolean;
  /** Sign in with Google (popup). Available for free tier. */
  signInWithGoogle: () => Promise<void>;
  /** Sign in with redirect (fallback when popup is blocked). */
  signInWithRedirectFallback: () => Promise<void>;
  /** Clear auth state (useful for debugging / switching accounts). */
  resetAuthState: () => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentPlanId: (planId: string) => Promise<void>;
  /** Current tier; use to show/hide sign-in methods. */
  tier: SignUpTier;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  currentPlanId: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

interface AuthProviderProps {
  children: React.ReactNode;
  /** Default tier; can later be driven by config or feature flags. */
  defaultTier?: SignUpTier;
}

export function AuthProvider({ children, defaultTier = "free" }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier] = useState<SignUpTier>(defaultTier);

  const ensureUserDoc = useCallback(async (authUser: User): Promise<UserProfile> => {
    if (!firebaseFirestore) {
      return {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        currentPlanId: null,
      };
    }

    const userRef = doc(firebaseFirestore, "users", authUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: authUser.uid,
        email: authUser.email ?? null,
        displayName: authUser.displayName ?? null,
        photoURL: authUser.photoURL ?? null,
        createdAt: serverTimestamp(),
        currentPlanId: null,
      });
    }

    const latestUserSnap = userSnap.exists() ? userSnap : await getDoc(userRef);
    let currentPlanId = (latestUserSnap.data()?.currentPlanId as string | null | undefined) ?? null;
    if (!currentPlanId) {
      const newPlanId = await planGateway.createPlan(authUser.uid, "My Service Plan");
      await updateDoc(userRef, { currentPlanId: newPlanId });
      currentPlanId = newPlanId;
    }

    return {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
      photoURL: authUser.photoURL,
      currentPlanId,
    };
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setLoading(false);
        return;
      }
      void ensureUserDoc(u)
        .then((profile) => setUserProfile(profile))
        .catch((err) => {
          console.error("[Auth] Failed to ensure user doc:", err);
          setUserProfile(null);
        })
        .finally(() => setLoading(false));
    });
    return () => unsubscribe();
  }, [ensureUserDoc]);

  // Handle redirect result (when user returns from Google redirect).
  useEffect(() => {
    if (!firebaseAuth || loading) return;
    getRedirectResult(firebaseAuth).catch((err) => {
      console.error("[Auth] Redirect result error:", err);
    });
  }, [loading]);

  const signInWithGoogle = async () => {
    if (!firebaseAuth) throw new Error("Firebase Auth not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local.");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (err) {
      console.error("[Auth] Google sign-in error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithRedirectFallback = async () => {
    if (!firebaseAuth) throw new Error("Firebase Auth not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local.");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(firebaseAuth, provider);
    } catch (err) {
      console.error("[Auth] Redirect sign-in error:", err);
      throw err;
    }
  };

  const resetAuthState = async () => {
    if (!firebaseAuth) return;
    setLoading(true);
    try {
      await firebaseSignOut(firebaseAuth);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!firebaseAuth) return;
    await firebaseSignOut(firebaseAuth);
  };

  const setCurrentPlanId = async (planId: string) => {
    if (!user?.uid || !firebaseFirestore) return;
    const userRef = doc(firebaseFirestore, "users", user.uid);
    await updateDoc(userRef, { currentPlanId: planId });
    setUserProfile((prev) =>
      prev
        ? {
            ...prev,
            currentPlanId: planId,
          }
        : prev
    );
  };

  const value: AuthContextValue = {
    user,
    userProfile,
    loading,
    isConfigured: !!firebaseAuth,
    signInWithGoogle,
    signInWithRedirectFallback,
    resetAuthState,
    signOut,
    setCurrentPlanId,
    tier,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
