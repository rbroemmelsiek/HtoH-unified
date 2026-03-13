"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2, ShieldAlert, Bug, ExternalLink, RefreshCw } from "lucide-react";

interface AuthLoginPanelProps {
  onClose?: () => void;
  /** Show "Current host" line for debugging (e.g. in dev). */
  showHost?: boolean;
  className?: string;
}

export function AuthLoginPanel({ onClose, showHost = true, className = "" }: AuthLoginPanelProps) {
  const {
    user,
    loading,
    isConfigured,
    signInWithGoogle,
    signInWithRedirectFallback,
    resetAuthState,
    signOut,
    tier,
    authError,
    clearAuthError,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  React.useEffect(() => {
    if (user) {
      onClose?.();
    }
  }, [user, onClose]);

  /** Turn Firebase auth errors into a user-friendly message (and optional fix). */
  const getAuthErrorMessage = (e: unknown): string => {
    const msg = e instanceof Error ? e.message : String(e);
    const code = (e as { code?: string })?.code || "";
    
    if (code === "auth/configuration-not-found" || msg.includes("configuration-not-found")) {
      return "Firebase Authentication is not enabled for this project. In Firebase Console → Authentication, click “Get started”, then enable the “Google” sign-in provider and set a support email.";
    }
    if (code === "auth/invalid-api-key" || msg.includes("invalid-api-key")) {
      return "Invalid Firebase API key. Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local and restart the dev server.";
    }
    if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
      const host = typeof window !== "undefined" ? window.location.host : "this domain";
      return `Domain "${host}" is not authorized. You must add this exact domain to "Authorized domains" in the Firebase Console.`;
    }
    return msg || `Sign-in failed (${code})`;
  };

  const handleGoogle = async () => {
    setError(null);
    clearAuthError();
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e));
      setBusy(false);
    }
  };

  const handleRedirect = async () => {
    setError(null);
    clearAuthError();
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
    clearAuthError();
    setBusy(true);
    try {
      await resetAuthState();
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    clearAuthError();
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

  const configStatus = {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-lg p-6 max-w-md w-full ${className}`}
      role="dialog"
      aria-labelledby="auth-heading"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 id="auth-heading" className="text-xl font-semibold text-[#141D84]">
          Account
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={() => window.location.reload()}
            className="p-1 text-gray-400 hover:text-[#141D84] transition-colors"
            title="Reload page"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="p-1 text-gray-400 hover:text-[#141D84] transition-colors"
            title="Toggle debug info"
          >
            <Bug size={16} />
          </button>
        </div>
      </div>

      {showDebug && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-[10px] font-mono text-gray-600 overflow-x-auto">
          <p className="font-bold mb-1 border-b pb-1">Debug Info:</p>
          <p>Host: {currentHost}</p>
          <p>API Key: {configStatus.apiKey ? "Loaded" : "MISSING"}</p>
          <p>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "MISSING"}</p>
          <p>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "MISSING"}</p>
          <p>Configured: {isConfigured ? "Yes" : "NO"}</p>
          <p>User UID: {user?.uid || "none"}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <Loader2 className="animate-spin mb-2 text-[#141D84]" size={32} />
          <span className="text-sm font-medium">Initializing Authentication…</span>
        </div>
      ) : user ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#141D84] flex items-center justify-center text-white font-bold">
                {user.email?.[0].toUpperCase() || "?"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-blue-900 truncate">{user.displayName || "User"}</p>
              <p className="text-xs text-blue-700 truncate">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-medium transition shadow-sm disabled:opacity-50"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : !isConfigured ? (
        <div className="space-y-3">
          <div className="flex gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
            <ShieldAlert size={24} className="shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Firebase Configuration Error</p>
              <p className="mt-1 opacity-90 leading-relaxed">
                The web application is missing its Firebase connection settings. 
                Verify that <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> and <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> are set in your environment.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Please sign in to access your Service Plan, contacts, and professional tools.
          </p>
          
          {(error || authError) && (
            <div className="flex gap-3 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200" role="alert">
              <ShieldAlert size={24} className="shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Authorization Failed</p>
                <p className="mt-1 leading-relaxed">{error || authError}</p>
                
                {((error || authError)?.includes("Domain") || (error || authError)?.includes("host")) && (
                  <div className="mt-3 p-2 bg-white/50 rounded border border-red-100 font-mono text-[10px] break-all">
                    Authorized domain to add: <strong>{typeof window !== "undefined" ? window.location.host : ""}</strong>
                  </div>
                )}

                {(error || authError)?.includes("Console") && (
                  <a
                    href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "htoh-3-0"}/authentication/providers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 mt-3 font-bold hover:underline text-[#141D84]"
                  >
                    Open Firebase Console <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full px-4 py-3 rounded-lg bg-[#141D84] hover:bg-[#0f1762] text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : <i className="fab fa-google" />}
              Sign in with Google
            </button>
            
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-white px-2 text-gray-400 font-bold">Trouble with popups?</span></div>
            </div>

            <button
              type="button"
              onClick={handleRedirect}
              disabled={busy}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition shadow-sm disabled:opacity-50"
            >
              Use Redirect Flow (Mobile)
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              disabled={busy}
              className="w-full px-4 py-2 rounded-lg text-gray-400 hover:text-gray-600 text-[10px] font-medium transition disabled:opacity-50"
            >
              Reset Session State
            </button>
          </div>
        </div>
      )}

      {showHost && currentHost && !showDebug && (
        <p className="mt-6 text-[10px] text-gray-400 border-t border-gray-50 pt-4 text-center">
          Current host: <span className="font-mono">{currentHost}</span>
        </p>
      )}
    </div>
  );
}
