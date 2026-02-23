"use client";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";

/**
 * Client-side providers wrapper
 * Wraps the app with AuthContext, UIContext, and Toast notifications
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            success: {
              style: {
                background: '#10b981',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#ef4444',
              },
            },
            loading: {
              style: {
                background: '#3b82f6',
                color: '#ffffff',
              },
            },
          }}
        />
        {children}
      </UIProvider>
    </AuthProvider>
  );
}
