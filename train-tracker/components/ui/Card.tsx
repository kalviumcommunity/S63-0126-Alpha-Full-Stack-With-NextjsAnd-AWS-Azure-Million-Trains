import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined" | "gradient";
  padding?: "none" | "small" | "medium" | "large";
  clickable?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
  headerAction?: ReactNode;
}

/**
 * Card - A reusable card component for displaying content
 * 
 * @example
 * <Card title="User Profile" subtitle="View details">
 *   <p>Card content goes here</p>
 * </Card>
 */
export default function Card({
  title,
  subtitle,
  children,
  variant = "default",
  padding = "medium",
  clickable = false,
  onClick,
  footer,
  headerAction,
}: CardProps) {
  const baseStyles: CSSProperties = {
    borderRadius: "12px",
    background: "white",
    transition: "all 0.2s ease",
    cursor: clickable ? "pointer" : "default",
  };

  const variantStyles: Record<string, CSSProperties> = {
    default: {
      border: "1px solid #e5e7eb",
    },
    elevated: {
      border: "none",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    outlined: {
      border: "2px solid #2563eb",
    },
    gradient: {
      border: "none",
      background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
    },
  };

  const paddingStyles: Record<string, CSSProperties> = {
    none: { padding: 0 },
    small: { padding: "1rem" },
    medium: { padding: "1.5rem" },
    large: { padding: "2rem" },
  };

  const cardStyles = {
    ...baseStyles,
    ...variantStyles[variant],
  };

  const contentStyles = {
    ...paddingStyles[padding],
  };

  return (
    <div style={cardStyles} onClick={clickable ? onClick : undefined}>
      {/* Card Header */}
      {(title || subtitle || headerAction) && (
        <div style={styles.header}>
          <div style={styles.headerContent}>
            {title && <h3 style={styles.title}>{title}</h3>}
            {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAction && <div style={styles.headerAction}>{headerAction}</div>}
        </div>
      )}

      {/* Card Content */}
      <div style={contentStyles}>{children}</div>

      {/* Card Footer */}
      {footer && <div style={styles.footer}>{footer}</div>}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "1.5rem 1.5rem 0",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "1rem",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 0.25rem 0",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#6b7280",
    margin: 0,
  },
  headerAction: {
    marginLeft: "1rem",
  },
  footer: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid #e5e7eb",
    background: "#f9fafb",
    borderBottomLeftRadius: "12px",
    borderBottomRightRadius: "12px",
  },
};
