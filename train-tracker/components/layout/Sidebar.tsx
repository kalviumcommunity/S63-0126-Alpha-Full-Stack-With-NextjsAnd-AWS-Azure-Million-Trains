"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

interface SidebarLink {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  variant?: "default" | "dashboard";
}

export default function Sidebar({ variant = "default" }: SidebarProps) {
  const pathname = usePathname();

  const defaultLinks: SidebarLink[] = [
    { href: "/dashboard", label: "Overview", icon: "📊" },
    { href: "/users", label: "Users", icon: "👥" },
    { href: "/routes", label: "Routes", icon: "🚉" },
    { href: "/faq", label: "FAQ", icon: "❓" },
  ];

  const dashboardLinks: SidebarLink[] = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/users", label: "Users", icon: "👥" },
    { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ];

  const links = variant === "dashboard" ? dashboardLinks : defaultLinks;

  return (
    <aside style={styles.sidebar}>
      {/* Sidebar Header */}
      <div style={styles.sidebarHeader}>
        <h2 style={styles.sidebarTitle}>Navigation</h2>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        <ul style={styles.navList}>
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            
            return (
              <li key={link.href} style={styles.navItem}>
                <Link
                  href={link.href}
                  style={{
                    ...styles.navLink,
                    ...(isActive ? styles.navLinkActive : {}),
                  }}
                >
                  <span style={styles.navIcon}>{link.icon}</span>
                  <span style={styles.navLabel}>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div style={styles.sidebarFooter}>
        <div style={styles.footerCard}>
          <div style={styles.footerIcon}>💡</div>
          <p style={styles.footerText}>
            Need help? Check our documentation or contact support.
          </p>
        </div>
      </div>
    </aside>
  );
}

const styles: Record<string, CSSProperties> = {
  sidebar: {
    width: "280px",
    height: "100%",
    background: "white",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  sidebarHeader: {
    padding: "1.5rem 1.25rem 1rem",
    borderBottom: "1px solid #e5e7eb",
  },
  sidebarTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
  },
  nav: {
    flex: 1,
    padding: "1rem 0.75rem",
  },
  navList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  navItem: {
    margin: 0,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#6b7280",
    fontSize: "0.95rem",
    fontWeight: 500,
    transition: "all 0.2s",
    cursor: "pointer",
  },
  navLinkActive: {
    background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
    color: "#2563eb",
    fontWeight: 600,
  },
  navIcon: {
    fontSize: "1.25rem",
    lineHeight: 1,
  },
  navLabel: {
    flex: 1,
  },
  sidebarFooter: {
    padding: "1rem",
    borderTop: "1px solid #e5e7eb",
  },
  footerCard: {
    background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
    borderRadius: "8px",
    padding: "1rem",
    textAlign: "center",
  },
  footerIcon: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
  },
  footerText: {
    fontSize: "0.85rem",
    color: "#6b7280",
    margin: 0,
    lineHeight: 1.4,
  },
};
