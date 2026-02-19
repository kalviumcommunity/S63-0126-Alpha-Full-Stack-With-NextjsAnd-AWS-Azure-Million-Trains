import { useUIContext } from "@/context/UIContext";

/**
 * Custom hook for UI state management
 * Provides a clean interface for theme, sidebar, and notifications
 */
export function useUI() {
  const {
    theme,
    toggleTheme,
    sidebarOpen,
    toggleSidebar,
    notifications,
    addNotification,
    removeNotification,
  } = useUIContext();

  return {
    /** Current theme: "light" or "dark" */
    theme,
    /** Toggle between light and dark themes */
    toggleTheme,
    /** Whether the sidebar is currently open */
    sidebarOpen,
    /** Toggle sidebar open/closed state */
    toggleSidebar,
    /** Array of active notifications */
    notifications,
    /** Add a new notification (auto-removes after 5s) */
    addNotification,
    /** Manually remove a notification by ID */
    removeNotification,
  };
}
