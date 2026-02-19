import type { CSSProperties, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: string;
  children?: React.ReactNode;
}

/**
 * Button - A reusable button component with multiple variants and sizes
 * 
 * @example
 * <Button label="Click Me" variant="primary" />
 * <Button variant="secondary" size="large">Custom Content</Button>
 * <Button variant="danger" icon="🗑️" label="Delete" />
 */
export default function Button({
  label,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  loading = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    fontWeight: 600,
    borderRadius: "8px",
    border: "none",
    cursor: loading || disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    textDecoration: "none",
    fontFamily: "inherit",
    opacity: loading || disabled ? 0.6 : 1,
    width: fullWidth ? "100%" : "auto",
  };

  // Size variants
  const sizeStyles: Record<string, CSSProperties> = {
    small: {
      padding: "0.375rem 0.75rem",
      fontSize: "0.875rem",
    },
    medium: {
      padding: "0.5rem 1.25rem",
      fontSize: "0.95rem",
    },
    large: {
      padding: "0.75rem 1.75rem",
      fontSize: "1.1rem",
    },
  };

  // Color variants
  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      color: "white",
      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
    },
    secondary: {
      background: "#6b7280",
      color: "white",
      boxShadow: "0 2px 8px rgba(107, 114, 128, 0.3)",
    },
    danger: {
      background: "#ef4444",
      color: "white",
      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
    },
    success: {
      background: "#10b981",
      color: "white",
      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
    },
    outline: {
      background: "white",
      color: "#2563eb",
      border: "2px solid #2563eb",
      boxShadow: "none",
    },
  };

  const buttonStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <button style={buttonStyles} disabled={loading || disabled} {...props}>
      {loading && <span style={styles.spinner}>⏳</span>}
      {!loading && icon && <span>{icon}</span>}
      {children || label}
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  spinner: {
    animation: "spin 1s linear infinite",
  },
};
