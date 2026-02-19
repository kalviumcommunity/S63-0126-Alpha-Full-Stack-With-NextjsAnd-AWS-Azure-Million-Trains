'use client';

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface Props {
  params: { id: string };
}

export default function UserProfile({ params }: Props) {
  const { id } = params;
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else if (response.status === 401) {
            router.push("/login?next=/users/" + id);
            return;
          } else {
            setError("Failed to load user data");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setUser(data.data || data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("An error occurred while loading user data");
        setLoading(false);
      }
    }

    fetchUser();
  }, [id, router]);

  if (loading) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading user profile...</p>
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
            <Link href="/users" style={styles.backLink}>
              ← Back to Users List
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <h1 style={styles.errorTitle}>User Not Found</h1>
            <p style={styles.errorText}>The user with ID "{id}" does not exist.</p>
            <Link href="/users" style={styles.backLink}>
              ← Back to Users List
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
          <Link href="/users" style={styles.breadcrumbLink}>Users</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>{user.fullName || user.id}</span>
        </nav>

        {/* User Profile Card */}
        <div style={styles.profileCard}>
          <div style={styles.avatarContainer}>
            <div style={styles.avatar}>
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>

          <h1 style={styles.profileTitle}>{user.fullName}</h1>
          
          <div style={styles.badge}>
            {user.role}
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>User ID</span>
              <span style={styles.infoValue}>{user.id}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email</span>
              <span style={styles.infoValue}>{user.email}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Role</span>
              <span style={styles.infoValue}>{user.role}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Member Since</span>
              <span style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div style={styles.actions}>
            <Link href="/users" style={styles.backButton}>
              ← Back to Users
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    padding: "2rem 1rem",
  },
  container: {
    maxWidth: "800px",
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
  profileCard: {
    background: "white",
    borderRadius: "16px",
    padding: "3rem 2rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  avatarContainer: {
    marginBottom: "1.5rem",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb 0%, #93c5fd 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    fontWeight: "bold",
    margin: "0 auto",
  },
  profileTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "1rem",
  },
  badge: {
    display: "inline-block",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: "0.9rem",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: "2rem",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
    textAlign: "left",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  infoLabel: {
    fontSize: "0.85rem",
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoValue: {
    fontSize: "1rem",
    color: "#1f2937",
    fontWeight: "500",
  },
  actions: {
    marginTop: "2rem",
    paddingTop: "2rem",
    borderTop: "1px solid #e5e7eb",
  },
  backButton: {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    background: "#2563eb",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "600",
    transition: "background 0.2s",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 1rem",
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
};
