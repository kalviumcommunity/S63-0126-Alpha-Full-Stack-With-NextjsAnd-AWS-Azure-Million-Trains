"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import Cookies from "js-cookie";

interface HeaderProps {
  variant?: "default" | "dashboard";
}

export default function Header({ variant = "default" }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove("token");
    setIsAuthenticated(false);
    router.push("/");
  };

  const isDashboard = variant === "dashboard";

  return (
    <header style={isDashboard ? styles.headerDashboard : styles.header}>
      <div style={styles.container}>
        {/* Logo/Brand */}
        <Link href="/" style={styles.logo}>
          <span style={styles.logoIcon}>🚂</span>
          <span style={styles.logoText}>TrainTracker</span>
        </Link>

        {/* Navigation Links */}
        <nav style={styles.nav}>
          <Link
            href="/"
            style={{
              ...styles.navLink,
              ...(pathname === "/" ? styles.navLinkActive : {}),
            }}
          >
            Home
          </Link>
          <Link
            href="/about"
            style={{
              ...styles.navLink,
              ...(pathname === "/about" ? styles.navLinkActive : {}),
            }}
          >
            About
          </Link>
          <Link
            href="/routes"
            style={{
              ...styles.navLink,
              ...(pathname === "/routes" ? styles.navLinkActive : {}),
            }}
          >
            Routes
          </Link>
          <Link
            href="/contact"
            style={{
              ...styles.navLink,
              ...(pathname === "/contact" ? styles.navLinkActive : {}),
            }}
          >
            Contact
          </Link>

          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                style={{
                  ...styles.navLink,
                  ...(pathname === "/dashboard" ? styles.navLinkActive : {}),
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/users"
                style={{
                  ...styles.navLink,
                  ...(pathname.startsWith("/users") ? styles.navLinkActive : {}),
                }}
              >
                Users
              </Link>
            </>
          )}
        </nav>

        {/* Auth Actions */}
        <div style={styles.actions}>
          {isAuthenticated ? (
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" style={styles.loginButton}>
                Login
              </Link>
              <Link href="/signup" style={styles.signupButton}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    width: "100%",
    background: "white",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  headerDashboard: {
    width: "100%",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "2rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#2563eb",
    transition: "opacity 0.2s",
  },
  logoIcon: {
    fontSize: "1.75rem",
  },
  logoText: {
    letterSpacing: "-0.02em",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    flex: 1,
    justifyContent: "center",
  },
  navLink: {
    color: "#374151",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    transition: "all 0.2s",
  },
  navLinkActive: {
    color: "#2563eb",
    background: "#dbeafe",
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  loginButton: {
    padding: "0.5rem 1.25rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#2563eb",
    textDecoration: "none",
    background: "transparent",
    border: "2px solid #2563eb",
    borderRadius: "8px",
    transition: "all 0.2s",
    textAlign: "center",
  },
  signupButton: {
    padding: "0.5rem 1.25rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "white",
    textDecoration: "none",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    border: "none",
    borderRadius: "8px",
    transition: "all 0.2s",
    textAlign: "center",
  },
  logoutButton: {
    padding: "0.5rem 1.25rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "white",
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
