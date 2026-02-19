'use client';

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch("/api/users");
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login?next=/users");
            return;
          }
          setError("Failed to load users");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setUsers(data.data || data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("An error occurred while loading users");
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router]);

  if (loading) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading users...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <h1 style={styles.errorTitle}>⚠️ Error</h1>
            <p style={styles.errorText}>{error}</p>
            <Link href="/dashboard" style={styles.backLink}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav style={styles.breadcrumb}>
          <Link href="/" style={styles.breadcrumbLink}>Home</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <Link href="/dashboard" style={styles.breadcrumbLink}>Dashboard</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>Users</span>
        </nav>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>All Users</h1>
          <p style={styles.subtitle}>
            Total: {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Users Grid */}
        {users.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No users found</p>
          </div>
        ) : (
          <div style={styles.usersGrid}>
            {users.map((user) => (
              <Link 
                key={user.id} 
                href={`/users/${user.id}`} 
                style={styles.userCard}
              >
                <div style={styles.userAvatar}>
                  {user.fullName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div style={styles.userInfo}>
                  <h3 style={styles.userName}>{user.fullName}</h3>
                  <p style={styles.userEmail}>{user.email}</p>
                  <div style={styles.userMeta}>
                    <span style={styles.userRole}>{user.role}</span>
                    <span style={styles.userDate}>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={styles.arrow}>→</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        a[style*="userCard"]:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    padding: "2rem 1rem",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "2rem",
    fontSize: "0.9rem",
  },
  breadcrumbLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "500",
  },
  breadcrumbSeparator: {
    color: "#6b7280",
  },
  breadcrumbCurrent: {
    color: "#374151",
    fontWeight: "600",
  },
  header: {
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#6b7280",
  },
  usersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    textDecoration: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  userAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb 0%, #93c5fd 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: "bold",
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    overflow: "hidden",
  },
  userName: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "0.25rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: "0.9rem",
    color: "#6b7280",
    marginBottom: "0.5rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userMeta: {
    display: "flex",
    gap: "0.75rem",
    fontSize: "0.8rem",
  },
  userRole: {
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    background: "#dbeafe",
    color: "#2563eb",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  userDate: {
    color: "#9ca3af",
  },
  arrow: {
    fontSize: "1.5rem",
    color: "#2563eb",
    flexShrink: 0,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: "1.1rem",
  },
  errorCard: {
    background: "white",
    borderRadius: "16px",
    padding: "3rem 2rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  errorTitle: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: "1rem",
  },
  errorText: {
    fontSize: "1.1rem",
    color: "#6b7280",
    marginBottom: "2rem",
  },
  backLink: {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    background: "#2563eb",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "600",
  },
  emptyState: {
    background: "white",
    borderRadius: "16px",
    padding: "3rem 2rem",
    textAlign: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: "1.1rem",
  },
};
