'use client';

import Link from "next/link";
import type { CSSProperties } from "react";

export default function NotFound() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.errorCard}>
          {/* 404 Animation */}
          <div style={styles.errorNumber}>
            <span style={styles.digit}>4</span>
            <span style={{...styles.digit, ...styles.digitMiddle}}>0</span>
            <span style={styles.digit}>4</span>
          </div>

          {/* Error Message */}
          <h1 style={styles.title}>Page Not Found</h1>
          <p style={styles.description}>
            Oops! The route you're looking for doesn't exist. 
            It might have been moved or deleted.
          </p>

          {/* Navigation Links */}
          <div style={styles.actions}>
            <Link href="/" style={styles.primaryButton}>
              🏠 Go Home
            </Link>
            <Link href="/dashboard" style={styles.secondaryButton}>
              📊 Dashboard
            </Link>
          </div>

          {/* Helpful Links */}
          <div style={styles.helpfulLinks}>
            <p style={styles.helpfulTitle}>You might want to visit:</p>
            <div style={styles.linkGrid}>
              <Link href="/login" style={styles.linkItem}>Login</Link>
              <Link href="/signup" style={styles.linkItem}>Sign Up</Link>
              <Link href="/about" style={styles.linkItem}>About</Link>
              <Link href="/contact" style={styles.linkItem}>Contact</Link>
              <Link href="/routes" style={styles.linkItem}>Routes</Link>
              <Link href="/faq" style={styles.linkItem}>FAQ</Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        div[style*="digit"] {
          animation: float 3s ease-in-out infinite;
        }

        div[style*="digitMiddle"] {
          animation-delay: 0.2s;
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
  },
  container: {
    maxWidth: "700px",
    width: "100%",
    margin: "0 auto",
  },
  errorCard: {
    background: "white",
    borderRadius: "24px",
    padding: "4rem 2rem",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    textAlign: "center",
  },
  errorNumber: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "2rem",
  },
  digit: {
    fontSize: "6rem",
    fontWeight: "900",
    background: "linear-gradient(135deg, #2563eb 0%, #93c5fd 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: "1",
  },
  digitMiddle: {
    fontSize: "7rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "1rem",
  },
  description: {
    fontSize: "1.1rem",
    color: "#6b7280",
    lineHeight: "1.6",
    marginBottom: "2.5rem",
    maxWidth: "500px",
    margin: "0 auto 2.5rem",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "3rem",
  },
  primaryButton: {
    display: "inline-block",
    padding: "1rem 2rem",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "white",
    textDecoration: "none",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "1.1rem",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
  },
  secondaryButton: {
    display: "inline-block",
    padding: "1rem 2rem",
    background: "white",
    color: "#2563eb",
    textDecoration: "none",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "1.1rem",
    border: "2px solid #2563eb",
    transition: "all 0.3s ease",
  },
  helpfulLinks: {
    marginTop: "3rem",
    paddingTop: "2rem",
    borderTop: "1px solid #e5e7eb",
  },
  helpfulTitle: {
    fontSize: "0.95rem",
    color: "#6b7280",
    marginBottom: "1rem",
    fontWeight: "500",
  },
  linkGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "center",
  },
  linkItem: {
    padding: "0.5rem 1rem",
    background: "#f3f4f6",
    color: "#374151",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
};
