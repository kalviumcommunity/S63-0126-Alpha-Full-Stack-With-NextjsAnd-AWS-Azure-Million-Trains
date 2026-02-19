import type { CSSProperties, InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
  fullWidth?: boolean;
}

/**
 * InputField - A reusable input field component with label, error, and helper text
 * 
 * @example
 * <InputField 
 *   label="Email" 
 *   type="email" 
 *   placeholder="Enter your email"
 *   error="Invalid email address"
 * />
 */
export default function InputField({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  ...props
}: InputFieldProps) {
  const hasError = !!error;

  const containerStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    width: fullWidth ? "100%" : "auto",
  };

  const inputWrapperStyles: CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const inputStyles: CSSProperties = {
    width: "100%",
    padding: icon ? "0.75rem 1rem 0.75rem 2.75rem" : "0.75rem 1rem",
    fontSize: "0.95rem",
    border: hasError ? "2px solid #ef4444" : "2px solid #e5e7eb",
    borderRadius: "8px",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  };

  const labelStyles: CSSProperties = {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: hasError ? "#ef4444" : "#374151",
    marginBottom: "0.25rem",
  };

  const iconStyles: CSSProperties = {
    position: "absolute",
    left: "0.75rem",
    fontSize: "1.25rem",
    pointerEvents: "none",
  };

  const errorStyles: CSSProperties = {
    fontSize: "0.85rem",
    color: "#ef4444",
    marginTop: "0.25rem",
  };

  const helperStyles: CSSProperties = {
    fontSize: "0.85rem",
    color: "#6b7280",
    marginTop: "0.25rem",
  };

  return (
    <div style={containerStyles}>
      {label && <label style={labelStyles}>{label}</label>}
      
      <div style={inputWrapperStyles}>
        {icon && <span style={iconStyles}>{icon}</span>}
        <input style={inputStyles} {...props} />
      </div>

      {error && <span style={errorStyles}>{error}</span>}
      {!error && helperText && <span style={helperStyles}>{helperText}</span>}
    </div>
  );
}
