import type { ReactNode, CSSProperties } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutWrapperProps {
  children: ReactNode;
  variant?: "default" | "dashboard" | "sidebar" | "minimal";
  showHeader?: boolean;
  showSidebar?: boolean;
}

/**
 * LayoutWrapper - A flexible layout component that can be configured
 * for different page types (default, dashboard, sidebar-only, minimal)
 */
export default function LayoutWrapper({
  children,
  variant = "default",
  showHeader = true,
  showSidebar = false,
}: LayoutWrapperProps) {
  // Variant configurations
  const configs = {
    default: { header: true, sidebar: false },
    dashboard: { header: true, sidebar: true },
    sidebar: { header: false, sidebar: true },
    minimal: { header: false, sidebar: false },
  };

  const config = configs[variant];
  const shouldShowHeader = showHeader && config.header;
  const shouldShowSidebar = showSidebar || config.sidebar;

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      {shouldShowHeader && <Header variant={variant === "dashboard" ? "dashboard" : "default"} />}

      {/* Main Content Area */}
      <div style={styles.contentWrapper}>
        {/* Sidebar */}
        {shouldShowSidebar && <Sidebar variant={variant === "dashboard" ? "dashboard" : "default"} />}

        {/* Page Content */}
        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    width: "100%",
  },
  contentWrapper: {
    display: "flex",
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  main: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
};
