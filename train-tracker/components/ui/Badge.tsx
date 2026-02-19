import type { CSSProperties } from "react";

interface BadgeProps {
  label: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "small" | "medium" | "large";
  rounded?: boolean;
}

/**
 * Badge - A reusable badge component for labels, status indicators, etc.
 * 
 * @example
 * <Badge label="Active" variant="success" />
 * <Badge label="Admin" variant="primary" size="small" />
 */
export default function Badge({
  label,
  variant = "default",
  size = "medium",
  rounded = true,
}: BadgeProps) {
  const baseStyles: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.025em",
    borderRadius: rounded ? "9999px" : "6px",
    whiteSpace: "nowrap",
  };

  const sizeStyles: Record<string, CSSProperties> = {
    small: {
      padding: "0.25rem 0.5rem",
      fontSize: "0.7rem",
    },
    medium: {
      padding: "0.375rem 0.75rem",
      fontSize: "0.8rem",
    },
    large: {
      padding: "0.5rem 1rem",
      fontSize: "0.9rem",
    },
  };

  const variantStyles: Record<string, CSSProperties> = {
    default: {
      background: "#f3f4f6",
      color: "#374151",
    },
    primary: {
      background: "#dbeafe",
      color: "#2563eb",
    },
    success: {
      background: "#d1fae5",
      color: "#10b981",
    },
    warning: {
      background: "#fef3c7",
      color: "#f59e0b",
    },
    danger: {
      background: "#fee2e2",
      color: "#ef4444",
    },
    info: {
      background: "#e0e7ff",
      color: "#6366f1",
    },
  };

  const badgeStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return <span style={badgeStyles}>{label}</span>;
}
