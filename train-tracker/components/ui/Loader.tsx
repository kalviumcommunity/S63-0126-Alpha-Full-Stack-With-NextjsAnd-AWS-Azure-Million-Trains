"use client";

import type { CSSProperties } from "react";

interface LoaderProps {
  size?: "small" | "medium" | "large";
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

/**
 * Loader - Accessible loading spinner component
 * 
 * Features:
 * - Multiple sizes
 * - Customizable color
 * - Optional loading text
 * - Full-screen overlay option
 * - ARIA live region for screen readers
 * 
 * @example
 * // Inline loader
 * <Loader size="small" text="Loading..." />
 * 
 * // Full-screen loader
 * <Loader fullScreen text="Please wait..." />
 */
export default function Loader({
  size = "medium",
  color = "#3b82f6",
  text,
  fullScreen = false,
}: LoaderProps) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const spinnerSize = sizeMap[size];

  const spinner = (
    <div style={styles.container}>
      <div
        style={{
          ...styles.spinner,
          width: spinnerSize,
          height: spinnerSize,
          borderColor: `${color}20`,
          borderTopColor: color,
        }}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p
          style={styles.text}
          role="status"
          aria-live="polite"
        >
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={styles.fullScreenOverlay}>
        {spinner}
      </div>
    );
  }

  return spinner;
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  spinner: {
    border: "4px solid",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  text: {
    fontSize: "0.875rem",
    color: "#6b7280",
    margin: 0,
    fontWeight: 500,
  },
  fullScreenOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(255, 255, 255, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
};

// Add keyframes animation via global CSS
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `;
  document.head.appendChild(style);
}
