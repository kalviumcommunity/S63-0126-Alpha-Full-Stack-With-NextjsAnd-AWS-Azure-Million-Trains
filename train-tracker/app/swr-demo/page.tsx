"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { CSSProperties } from "react";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  timestamp: string;
}

/**
 * SWR Demo Page - Basic Data Fetching
 * 
 * This page demonstrates:
 * - Basic SWR usage for data fetching
 * - Automatic caching and revalidation
 * - Loading and error states
 * - Cache behavior on tab focus
 */
export default function SWRDemoPage() {
  // SWR automatically handles:
  // - Caching the response
  // - Revalidating on focus
  // - Revalidating on reconnect
  // - Deduplicating requests
  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    "/api/users",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
    }
  );

  // Track when data was fetched
  const fetchTime = data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : null;

  if (error) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <h1 style={styles.errorTitle}>⚠️ Error Loading Users</h1>
            <p style={styles.errorText}>
              {error.info?.message || error.message || "Failed to load users"}
            </p>
            <p style={styles.errorDetail}>
              Status: {error.status || "Unknown"}
            </p>
            <button onClick={() => mutate()} style={styles.retryButton}>
              🔄 Retry
            </button>
            <Link href="/swr-demo/optimistic" style={styles.backLink}>
              ← Try Optimistic Updates Demo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading users with SWR...</p>
            <p style={styles.loadingHint}>
              💡 SWR will cache this data for instant subsequent loads
            </p>
          </div>
        </div>
      </main>
    );
  }

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Navigation */}
        <nav style={styles.breadcrumb}>
          <Link href="/" style={styles.breadcrumbLink}>Home</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <Link href="/dashboard" style={styles.breadcrumbLink}>Dashboard</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>SWR Demo</span>
        </nav>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🚀 SWR Data Fetching Demo</h1>
          <p style={styles.subtitle}>
            Client-side data fetching with automatic caching and revalidation
          </p>
        </div>

        {/* Info Cards */}
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>📊</div>
            <div style={styles.infoLabel}>Total Users</div>
            <div style={styles.infoValue}>{pagination?.total || 0}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>⚡</div>
            <div style={styles.infoLabel}>SWR Status</div>
            <div style={styles.infoValue}>Cached</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>🕐</div>
            <div style={styles.infoLabel}>Last Fetched</div>
            <div style={styles.infoValue}>{fetchTime}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>🔄</div>
            <div style={styles.infoLabel}>Auto-Revalidate</div>
            <div style={styles.infoValue}>On Focus</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionBar}>
          <button
            onClick={() => mutate()}
            style={styles.refreshButton}
          >
            🔄 Manual Revalidate
          </button>
          <button
            onClick={() => {
              console.log("🎯 SWR Cache Key: /api/users");
              console.log("📦 Cached Data:", data);
              console.log("⏰ Timestamp:", data?.timestamp);
            }}
            style={styles.logButton}
          >
            📋 Log Cache to Console
          </button>
          <Link href="/swr-demo/optimistic" style={styles.demoLink}>
            ➡️ Optimistic Updates Demo
          </Link>
        </div>

        {/* Feature Highlights */}
        <div style={styles.featuresCard}>
          <h2 style={styles.featuresTitle}>✨ SWR Features in Action</h2>
          <ul style={styles.featuresList}>
            <li style={styles.featureItem}>
              <strong>🎯 Automatic Caching:</strong> Data is cached after first fetch
            </li>
            <li style={styles.featureItem}>
              <strong>🔄 Smart Revalidation:</strong> Refreshes when you switch tabs (try it!)
            </li>
            <li style={styles.featureItem}>
              <strong>⚡ Request Deduplication:</strong> Multiple components share one request
            </li>
            <li style={styles.featureItem}>
              <strong>🔌 Reconnect Detection:</strong> Auto-refetches when reconnecting
            </li>
            <li style={styles.featureItem}>
              <strong>📶 Stale-While-Revalidate:</strong> Shows cached data instantly, updates in background
            </li>
          </ul>
        </div>

        {/* Users List */}
        <div style={styles.usersCard}>
          <h2 style={styles.usersTitle}>
            User List ({users.length} loaded)
          </h2>
          {users.length === 0 ? (
            <p style={styles.emptyMessage}>No users found</p>
          ) : (
            <div style={styles.usersList}>
              {users.map((user) => (
                <div key={user.id} style={styles.userItem}>
                  <div style={styles.userAvatar}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>{user.fullName}</div>
                    <div style={styles.userEmail}>{user.email}</div>
                  </div>
                  <div style={styles.userRole}>
                    {user.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testing Instructions */}
        <div style={styles.testingCard}>
          <h2 style={styles.testingTitle}>🧪 Test SWR Behavior</h2>
          <ol style={styles.testingList}>
            <li style={styles.testingItem}>
              <strong>Cache Test:</strong> Refresh this page - notice instant load from cache
            </li>
            <li style={styles.testingItem}>
              <strong>Revalidation Test:</strong> Switch to another tab, then back - data refreshes
            </li>
            <li style={styles.testingItem}>
              <strong>Manual Refresh:</strong> Click "Manual Revalidate" to force refresh
            </li>
            <li style={styles.testingItem}>
              <strong>Console Logs:</strong> Click "Log Cache" to inspect SWR's cached data
            </li>
            <li style={styles.testingItem}>
              <strong>Deduplication:</strong> Open DevTools Network tab, refresh multiple times quickly - only one request!
            </li>
          </ol>
        </div>

        {/* Code Example */}
        <div style={styles.codeCard}>
          <h2 style={styles.codeTitle}>💻 Code Example</h2>
          <pre style={styles.codeBlock}>
            {`import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const { data, error, isLoading, mutate } = useSWR(
  "/api/users",
  fetcher,
  {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  }
);

// Manual revalidation
await mutate();

// Optimistic update
mutate(updatedData, false);`}
          </pre>
        </div>
      </div>
    </main>
  );
}

// Styles
const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "2rem",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    fontSize: "0.875rem",
  },
  breadcrumbLink: {
    color: "#fff",
    textDecoration: "none",
    opacity: 0.8,
    transition: "opacity 0.2s",
  },
  breadcrumbSeparator: {
    color: "#fff",
    opacity: 0.5,
  },
  breadcrumbCurrent: {
    color: "#fff",
    fontWeight: 600,
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "0.5rem",
    textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#fff",
    opacity: 0.9,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  infoCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  infoIcon: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
  },
  infoLabel: {
    fontSize: "0.875rem",
    color: "#666",
    marginBottom: "0.25rem",
  },
  infoValue: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#667eea",
  },
  actionBar: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  refreshButton: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  logButton: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  demoLink: {
    background: "#8b5cf6",
    color: "#fff",
    textDecoration: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "inline-block",
  },
  featuresCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  featuresTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "1rem",
  },
  featuresList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  featureItem: {
    padding: "0.75rem 0",
    borderBottom: "1px solid #e5e7eb",
    color: "#555",
    fontSize: "0.95rem",
  },
  usersCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  usersTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "1.5rem",
  },
  usersList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  userItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    background: "#f9fafb",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  userAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 600,
    color: "#333",
    marginBottom: "0.25rem",
  },
  userEmail: {
    fontSize: "0.875rem",
    color: "#666",
  },
  userRole: {
    padding: "0.25rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.875rem",
    fontWeight: 600,
    background: "#dbeafe",
    color: "#1e40af",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#666",
    padding: "2rem",
  },
  testingCard: {
    background: "#fef3c7",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    border: "2px solid #fbbf24",
  },
  testingTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: "1rem",
  },
  testingList: {
    paddingLeft: "1.5rem",
    margin: 0,
  },
  testingItem: {
    padding: "0.5rem 0",
    color: "#78350f",
    fontSize: "0.95rem",
  },
  codeCard: {
    background: "#1f2937",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
  },
  codeTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "1rem",
  },
  codeBlock: {
    background: "#111827",
    color: "#10b981",
    padding: "1.5rem",
    borderRadius: "8px",
    overflow: "auto",
    fontSize: "0.875rem",
    lineHeight: 1.6,
    fontFamily: "'Courier New', monospace",
  },
  errorCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "3rem",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  errorTitle: {
    fontSize: "2rem",
    color: "#dc2626",
    marginBottom: "1rem",
  },
  errorText: {
    fontSize: "1.1rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  errorDetail: {
    fontSize: "0.9rem",
    color: "#999",
    marginBottom: "2rem",
  },
  retryButton: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "0.75rem 2rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "1rem",
  },
  backLink: {
    display: "block",
    color: "#667eea",
    textDecoration: "none",
    marginTop: "1rem",
  },
  loadingCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "3rem",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 1rem",
  },
  loadingText: {
    fontSize: "1.1rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  loadingHint: {
    fontSize: "0.9rem",
    color: "#999",
  },
};
