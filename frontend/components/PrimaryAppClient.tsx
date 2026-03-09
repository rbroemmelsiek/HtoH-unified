"use client";

import { AuthProvider } from "../src/context/AuthContext";
import PrimaryApp from "../src/App";

export default function PrimaryAppClient() {
  return (
    <AuthProvider defaultTier="free">
      <PrimaryApp />
    </AuthProvider>
  );
}
