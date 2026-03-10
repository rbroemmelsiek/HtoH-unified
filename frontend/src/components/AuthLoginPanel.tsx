"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthLoginPanelProps {
  onClose?: () => void;
  /** Show "Current host" line for debugging (e.g. in dev). */
  showHost?: boolean;
  className?: string;
}

export function AuthLoginPanel({ onClose, showHost = true, className = "" }: AuthLoginPanelProps) {
  const { user, loading, isConfigured, signInWithGoogle, signInWithRedirectFallback, resetAuthState, signOut, tier } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Turn Firebase auth errors into a user-friendly message (and optional fix). */
  const getAuthErrorMessage = (e: unknown): string => {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("configuration-not-found") || (e as { code?: string })?.code === "auth/configuration-not-found") {
      return "Firebase Authentication is not enabled for this project. In Firebase Console → Authentication, click “Get started”, then enable the “Google” sign-in provider and set a support email.";
    }
    if (msg.includes("invalid-api-key") || (e as { code?: string })?.code === "auth/invalid-api-key") {
      return "Invalid Firebase API key. Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local and restart the dev server.";
    }
    return msg || "Sign-in failed";
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onClose?.();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRedirect = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithRedirectFallback();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e));
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setError(null);
    setBusy(true);
    try {
      await resetAuthState();
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setBusy(true);
    try {
      await signOut();
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  const currentHost =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-lg p-6 max-w-md ${className}`}
      role="dialog"
      aria-labelledby="auth-heading"
    >
      <h2 id="auth-heading" className="text-xl font-semibold text-[#141D84] mb-2">
        Login
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600 py-4">
          <Loader2 className="animate-spin" size={20} />
          <span>Checking sign-in…</span>
        </div>
      ) : user ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Signed in as <strong>{user.email ?? user.uid}</strong>
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition disabled:opacity-50"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : !isConfigured ? (
        <div className="space-y-3">
          <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
            Firebase is not configured. Add <code className="text-xs bg-amber-100 px-1 rounded">NEXT_PUBLIC_FIREBASE_API_KEY</code> and <code className="text-xs bg-amber-100 px-1 rounded">NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> to <code className="text-xs bg-amber-100 px-1 rounded">frontend/.env.local</code> and restart the dev server.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">You are not signed in.</p>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded" role="alert">
              {error}
              {error.includes("Firebase Console") && (
                <a
                  href="https://console.firebase.google.com/project/htoh-3-0/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-[#141D84] hover:underline font-medium"
                >
                  Open Authentication settings →
                </a>
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {/* Free tier: Google SSO */}
            {(tier === "free" || tier === "paid") && (
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-[#141D84] hover:bg-[#0f1762] text-white text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                Sign in with Google
              </button>
            )}
            <button
              type="button"
              onClick={handleRedirect}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition disabled:opacity-50"
            >
              Sign in with Redirect (fallback)
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition disabled:opacity-50"
            >
              Reset Auth State
            </button>
          </div>
        </div>
      )}

      {showHost && currentHost && (
        <p className="mt-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
          Current host: {currentHost}
        </p>
      )}
    </div>
  );
}
