"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
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
  authError: string | null;
  /** False when Firebase Auth is not configured (missing API key in .env.local). */
  isConfigured: boolean;
  /** Sign in with Google. Uses popup first with redirect fallback. */
  signInWithGoogle: () => Promise<void>;
  /** Explicit redirect sign-in action (same underlying flow). */
  signInWithRedirectFallback: () => Promise<void>;
  /** Clear auth state (useful for debugging / switching accounts). */
  resetAuthState: () => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentPlanId: (planId: string) => Promise<void>;
  /** Current tier; use to show/hide sign-in methods. */
  tier: SignUpTier;
  clearAuthError: () => void;
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
  const [authError, setAuthError] = useState<string | null>(null);

  const REDIRECT_PENDING_KEY = "htoh_auth_redirect_pending";

  const formatAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code ?? "";
    const msg = (err as Error)?.message ?? String(err ?? "");

    if (code.includes("auth/unauthorized-domain")) {
      return "This host is not authorized in Firebase Authentication. Add localhost (or your current host) to Authorized domains.";
    }
    if (code.includes("auth/popup-closed-by-user") || code.includes("auth/cancelled-popup-request")) {
      return "Sign-in was canceled before completion.";
    }
    if (code.includes("auth/network-request-failed")) {
      return "Network error during sign-in. Check connection and try again.";
    }
    if (code.includes("auth/configuration-not-found")) {
      return "Google sign-in provider is not enabled in Firebase Authentication settings.";
    }
    return msg || "Sign-in failed. Please try again.";
  };

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
    if (currentPlanId) {
      try {
        await planGateway.fetch('load', {
          planId: currentPlanId,
          uid: authUser.uid,
        });
      } catch (error) {
        const replacementPlanId = await planGateway.createPlan(authUser.uid, "My Service Plan");
        await updateDoc(userRef, { currentPlanId: replacementPlanId });
        currentPlanId = replacementPlanId;
      }
    } else {
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

    // Set persistence once
    void setPersistence(firebaseAuth, browserLocalPersistence).catch(err => {
      console.error("[Auth] Failed to set persistence:", err);
    });

    let isRedirectCheckComplete = false;
    let hadPendingRedirect =
      typeof window !== "undefined" && window.sessionStorage.getItem(REDIRECT_PENDING_KEY) === "1";

    // 1. Setup onAuthStateChanged listener
    const unsubscribe = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        // If we are still waiting for getRedirectResult, don't set loading to false yet.
        if (!hadPendingRedirect || isRedirectCheckComplete) {
          setLoading(false);
        }
        return;
      }

      // If we got a user via listener, and we were expecting a redirect,
      // it means the redirect succeeded and the listener picked it up.
      // We can clear the pending flag.
      if (hadPendingRedirect) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        }
        hadPendingRedirect = false;
      }

      setAuthError(null);
      setLoading(true); // Ensure we are in loading state while fetching profile
      void ensureUserDoc(u)
        .then((profile) => setUserProfile(profile))
        .catch((err) => {
          console.error("[Auth] Failed to ensure user doc:", err);
          setUserProfile(null);
        })
        .finally(() => {
          // Only stop loading if redirect check is also done (or wasn't needed)
          if (!hadPendingRedirect || isRedirectCheckComplete) {
            setLoading(false);
          }
        });
    });

    // 2. Check for redirect result if we think one is pending
    getRedirectResult(firebaseAuth)
      .then((result) => {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        }
        isRedirectCheckComplete = true;

        if (!result?.user && hadPendingRedirect && !firebaseAuth.currentUser) {
          setAuthError("Sign-in did not complete. Please select an account and allow redirect to return.");
          setLoading(false);
        } else {
          // If we have a user (either from result or already from onAuthStateChanged),
          // onAuthStateChanged will handle setting loading to false after profile is fetched.
          if (!firebaseAuth.currentUser) {
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        }
        isRedirectCheckComplete = true;
        const pretty = formatAuthError(err);
        setAuthError(pretty);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [ensureUserDoc]);

  // signInWithGoogle with popup-first strategy
  const signInWithGoogle = async () => {
    if (!firebaseAuth) throw new Error("Firebase Auth not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local.");
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (err) {
      const errorCode = (err as { code?: string })?.code ?? "";

      const shouldFallbackToRedirect =
        errorCode === "auth/popup-blocked" ||
        errorCode === "auth/popup-closed-by-user" ||
        errorCode === "auth/cancelled-popup-request" ||
        errorCode === "auth/operation-not-supported-in-this-environment";

      if (shouldFallbackToRedirect) {
        try {
          const provider = new GoogleAuthProvider();
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(REDIRECT_PENDING_KEY, "1");
          }
          await signInWithRedirect(firebaseAuth, provider);
          return;
        } catch (redirectErr) {
          console.error("[Auth] Google redirect fallback error:", redirectErr);
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
          }
          setAuthError(formatAuthError(redirectErr));
          setLoading(false);
          throw redirectErr;
        }
      } else {
        console.error("[Auth] Google popup error:", err);
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        }
        setAuthError(formatAuthError(err));
        setLoading(false);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithRedirectFallback = async () => {
    if (!firebaseAuth) throw new Error("Firebase Auth not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local.");
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(REDIRECT_PENDING_KEY, "1");
      }
      await signInWithRedirect(firebaseAuth, provider);
    } catch (err) {
      console.error("[Auth] Redirect sign-in error:", err);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
      }
      setAuthError(formatAuthError(err));
      setLoading(false);
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
    authError,
    isConfigured: !!firebaseAuth,
    signInWithGoogle,
    signInWithRedirectFallback,
    resetAuthState,
    signOut,
    setCurrentPlanId,
    tier,
    clearAuthError: () => setAuthError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
