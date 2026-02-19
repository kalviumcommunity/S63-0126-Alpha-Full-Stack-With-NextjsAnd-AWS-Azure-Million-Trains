"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface UIContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  notifications: Notification[];
  addNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: number;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persist theme preference to localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      console.log("🎨 Theme loaded from localStorage:", savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      console.log("🎨 Theme toggled to:", newTheme);
      return newTheme;
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      console.log(`📱 Sidebar ${newState ? "opened" : "closed"}`);
      return newState;
    });
  };

  const addNotification = (message: string, type: "info" | "success" | "warning" | "error") => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [...prev, notification]);
    console.log(`🔔 Notification added: [${type}] ${message}`);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    console.log("🗑️ Notification removed:", id);
  };

  return (
    <UIContext.Provider
      value={{
        theme,
        toggleTheme,
        sidebarOpen,
        toggleSidebar,
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIContext must be used within a UIProvider");
  }
  return context;
}
