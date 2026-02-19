"use client";
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";

/**
 * Client-side providers wrapper
 * Wraps the app with AuthContext and UIContext
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        {children}
      </UIProvider>
    </AuthProvider>
  );
}
