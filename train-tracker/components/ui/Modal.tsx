"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "small" | "medium" | "large" | "fullscreen";
}

/**
 * Modal - A reusable modal/dialog component
 * 
 * @example
 * <Modal 
 *   isOpen={isOpen} 
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure?</p>
 * </Modal>
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "medium",
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles: Record<string, CSSProperties> = {
    small: { maxWidth: "400px" },
    medium: { maxWidth: "600px" },
    large: { maxWidth: "900px" },
    fullscreen: { maxWidth: "95vw", maxHeight: "95vh" },
  };

  const modalStyles = {
    ...styles.modal,
    ...sizeStyles[size],
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        {title && (
          <div style={styles.header}>
            <h2 style={styles.title}>{title}</h2>
            <button style={styles.closeButton} onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div style={styles.content}>{children}</div>

        {/* Modal Footer */}
        {footer && <div style={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "1rem",
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    width: "100%",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: "1px solid #e5e7eb",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "1.5rem",
    color: "#6b7280",
    cursor: "pointer",
    padding: "0.5rem",
    borderRadius: "6px",
    transition: "all 0.2s",
    lineHeight: 1,
  },
  content: {
    padding: "1.5rem",
    overflowY: "auto",
    flex: 1,
  },
  footer: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid #e5e7eb",
    background: "#f9fafb",
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
  },
};
