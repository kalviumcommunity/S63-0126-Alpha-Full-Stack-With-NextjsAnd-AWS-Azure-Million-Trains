"use client";
import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import Cookies from "js-cookie";

interface AuthContextType {
  user: string | null;
  login: (username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  // Initialize user from cookie on mount
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      try {
        // In a real app, you'd decode the JWT to get user info
        // For now, we'll just set a generic user
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload.email || "Authenticated User");
      } catch (error) {
        console.error("Failed to parse auth token:", error);
      }
    }
  }, []);

  const login = (username: string) => {
    setUser(username);
    console.log("✅ User logged in:", username);
  };

  const logout = () => {
    setUser(null);
    Cookies.remove("authToken");
    console.log("🔓 User logged out");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
