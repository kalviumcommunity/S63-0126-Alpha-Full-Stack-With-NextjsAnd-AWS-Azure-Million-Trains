import type { CSSProperties, ReactNode } from "react";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  icon?: string;
}

/**
 * Alert - A reusable alert/notification component
 * 
 * @example
 * <Alert type="success" title="Success!">
 *   Your changes have been saved.
 * </Alert>
 */
export default function Alert({
  type = "info",
  title,
  children,
  onClose,
  icon,
}: AlertProps) {
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const displayIcon = icon || icons[type];

  const variantStyles: Record<string, CSSProperties> = {
    info: {
      background: "#eff6ff",
      borderColor: "#3b82f6",
      color: "#1e40af",
    },
    success: {
      background: "#f0fdf4",
      borderColor: "#10b981",
      color: "#065f46",
    },
    warning: {
      background: "#fffbeb",
      borderColor: "#f59e0b",
      color: "#92400e",
    },
    error: {
      background: "#fef2f2",
      borderColor: "#ef4444",
      color: "#991b1b",
    },
  };

  const alertStyles = {
    ...styles.alert,
    ...variantStyles[type],
  };

  return (
    <div style={alertStyles} role="alert">
      {/* Icon */}
      <div style={styles.iconContainer}>
        <span style={styles.icon}>{displayIcon}</span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {title && <h4 style={styles.title}>{title}</h4>}
        <div style={styles.message}>{children}</div>
      </div>

      {/* Close Button */}
      {onClose && (
        <button style={styles.closeButton} onClick={onClose} aria-label="Close alert">
          ✕
        </button>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  alert: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "1rem",
    borderRadius: "8px",
    borderLeft: "4px solid",
    position: "relative",
  },
  iconContainer: {
    flexShrink: 0,
  },
  icon: {
    fontSize: "1.5rem",
    lineHeight: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: "1rem",
    fontWeight: 700,
    margin: "0 0 0.25rem 0",
  },
  message: {
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "1.25rem",
    color: "inherit",
    cursor: "pointer",
    padding: "0.25rem",
    lineHeight: 1,
    opacity: 0.7,
    transition: "opacity 0.2s",
  },
};
