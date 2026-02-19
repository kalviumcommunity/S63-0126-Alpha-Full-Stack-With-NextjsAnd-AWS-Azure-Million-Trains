"use client";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { useState, CSSProperties } from "react";

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
 * SWR Optimistic Updates Demo
 * 
 * This page demonstrates:
 * - Optimistic UI updates (instant feedback)
 * - Mutation with SWR
 * - Rollback on error
 * - Multiple update patterns
 */
export default function OptimisticUpdatesDemo() {
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [updateLog, setUpdateLog] = useState<string[]>([]);

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    "/api/users",
    fetcher,
    {
      revalidateOnFocus: false, // Disable for demo clarity
    }
  );

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setUpdateLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`🔔 ${message}`);
  };

  /**
   * Pattern 1: Optimistic Update with Rollback
   * Updates UI immediately, then syncs with server
   */
  const addUserOptimistic = async () => {
    if (!newUserName || !newUserEmail) return;

    setIsAdding(true);
    addLog("🚀 Starting optimistic update...");

    // Create temporary user object
    const tempUser: User = {
      id: `temp-${Date.now()}`,
      email: newUserEmail,
      fullName: newUserName,
      role: "USER",
      createdAt: new Date().toISOString(),
    };

    // Get current data
    const currentData = data;

    if (!currentData) {
      addLog("❌ No current data available");
      setIsAdding(false);
      return;
    }

    try {
      // STEP 1: Update cache immediately (optimistic)
      addLog("⚡ Updating UI immediately (optimistic)");
      await mutate(
        {
          ...currentData,
          data: {
            ...currentData.data,
            users: [tempUser, ...currentData.data.users],
            pagination: {
              ...currentData.data.pagination,
              total: currentData.data.pagination.total + 1,
            },
          },
        },
        false // Don't revalidate yet
      );

      // STEP 2: Make actual API call
      addLog("📡 Sending request to server...");
      
      // Simulate API call (replace with actual endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate random success/failure for demo
      const success = Math.random() > 0.3;
      
      if (!success) {
        throw new Error("Simulated API error (70% success rate for demo)");
      }

      addLog("✅ Server confirmed - update successful!");
      
      // STEP 3: Revalidate to get real data from server
      addLog("🔄 Revalidating with server data...");
      await mutate();
      
      // Clear form
      setNewUserName("");
      setNewUserEmail("");
      
    } catch (error) {
      // ROLLBACK: Restore original data on error
      addLog("❌ Server error - rolling back optimistic update");
      await mutate(currentData, false);
      addLog("↩️ UI restored to previous state");
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Pattern 2: Pessimistic Update
   * Wait for server response before updating UI
   */
  const addUserPessimistic = async () => {
    if (!newUserName || !newUserEmail) return;

    setIsAdding(true);
    addLog("🐌 Starting pessimistic update (wait for server)...");

    try {
      addLog("📡 Sending request to server...");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const success = Math.random() > 0.3;
      if (!success) {
        throw new Error("Simulated API error");
      }

      addLog("✅ Server confirmed - now updating UI");
      
      // Only update after server confirms
      await mutate();
      
      addLog("🔄 UI updated with server data");
      
      setNewUserName("");
      setNewUserEmail("");
      
    } catch (error) {
      addLog("❌ Server error - UI unchanged (no rollback needed)");
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Pattern 3: Local-only Mutation (no revalidation)
   * Useful for temporary UI states
   */
  const updateLocalOnly = () => {
    if (!data) return;
    
    addLog("🎨 Updating local cache only (no server sync)");
    
    const updatedData = {
      ...data,
      data: {
        ...data.data,
        users: data.data.users.map((user, index) => 
          index === 0 
            ? { ...user, fullName: `${user.fullName} ⭐` }
            : user
        ),
      },
    };
    
    mutate(updatedData, false);
    addLog("✨ UI updated locally - won't persist");
  };

  /**
   * Pattern 4: Global Mutation
   * Update all SWR caches with the same key
   */
  const triggerGlobalMutation = async () => {
    addLog("🌍 Triggering global mutation for all /api/users caches");
    await globalMutate("/api/users");
    addLog("🔄 All components using /api/users will revalidate");
  };

  if (error) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <h1 style={styles.errorTitle}>⚠️ Error</h1>
            <p style={styles.errorText}>Failed to load users</p>
            <Link href="/swr-demo" style={styles.backLink}>
              ← Back to Basic Demo
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
            <p>Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  const users = data?.data?.users || [];

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Navigation */}
        <nav style={styles.breadcrumb}>
          <Link href="/" style={styles.breadcrumbLink}>Home</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <Link href="/swr-demo" style={styles.breadcrumbLink}>SWR Demo</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>Optimistic Updates</span>
        </nav>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>⚡ Optimistic Updates Demo</h1>
          <p style={styles.subtitle}>
            Instant UI feedback with automatic rollback on errors
          </p>
        </div>

        {/* Update Patterns */}
        <div style={styles.patternsGrid}>
          {/* Pattern 1: Optimistic */}
          <div style={styles.patternCard}>
            <div style={styles.patternIcon}>⚡</div>
            <h3 style={styles.patternTitle}>Optimistic Update</h3>
            <p style={styles.patternDescription}>
              UI updates instantly, then syncs with server. Rolls back on error.
            </p>
            <div style={styles.patternBadge}>Recommended</div>
          </div>

          {/* Pattern 2: Pessimistic */}
          <div style={styles.patternCard}>
            <div style={styles.patternIcon}>🐌</div>
            <h3 style={styles.patternTitle}>Pessimistic Update</h3>
            <p style={styles.patternDescription}>
              Waits for server confirmation before updating UI. Safer but slower.
            </p>
            <div style={styles.patternBadge}>Traditional</div>
          </div>

          {/* Pattern 3: Local Only */}
          <div style={styles.patternCard}>
            <div style={styles.patternIcon}>🎨</div>
            <h3 style={styles.patternTitle}>Local Only</h3>
            <p style={styles.patternDescription}>
              Updates cache without server sync. For temporary states.
            </p>
            <div style={styles.patternBadge}>Temporary</div>
          </div>

          {/* Pattern 4: Global */}
          <div style={styles.patternCard}>
            <div style={styles.patternIcon}>🌍</div>
            <h3 style={styles.patternTitle}>Global Mutation</h3>
            <p style={styles.patternDescription}>
              Revalidates all caches with same key across all components.
            </p>
            <div style={styles.patternBadge}>Broadcast</div>
          </div>
        </div>

        {/* Add User Form */}
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>🧪 Test Optimistic Updates</h2>
          <div style={styles.formGrid}>
            <input
              type="text"
              placeholder="Full Name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              style={styles.input}
              disabled={isAdding}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              style={styles.input}
              disabled={isAdding}
            />
          </div>
          <div style={styles.buttonGroup}>
            <button
              onClick={addUserOptimistic}
              disabled={isAdding || !newUserName || !newUserEmail}
              style={{
                ...styles.button,
                ...styles.optimisticButton,
                ...(isAdding ? styles.buttonDisabled : {}),
              }}
            >
              {isAdding ? "⏳ Processing..." : "⚡ Add (Optimistic)"}
            </button>
            <button
              onClick={addUserPessimistic}
              disabled={isAdding || !newUserName || !newUserEmail}
              style={{
                ...styles.button,
                ...styles.pessimisticButton,
                ...(isAdding ? styles.buttonDisabled : {}),
              }}
            >
              {isAdding ? "⏳ Processing..." : "🐌 Add (Pessimistic)"}
            </button>
            <button
              onClick={updateLocalOnly}
              disabled={isAdding}
              style={{
                ...styles.button,
                ...styles.localButton,
                ...(isAdding ? styles.buttonDisabled : {}),
              }}
            >
              🎨 Local Update
            </button>
            <button
              onClick={triggerGlobalMutation}
              disabled={isAdding}
              style={{
                ...styles.button,
                ...styles.globalButton,
                ...(isAdding ? styles.buttonDisabled : {}),
              }}
            >
              🌍 Global Revalidate
            </button>
          </div>
          <p style={styles.formHint}>
            💡 Note: 30% of optimistic updates will fail (simulated) to demonstrate rollback
          </p>
        </div>

        {/* Activity Log */}
        <div style={styles.logCard}>
          <div style={styles.logHeader}>
            <h2 style={styles.logTitle}>📋 Activity Log</h2>
            <button
              onClick={() => setUpdateLog([])}
              style={styles.clearButton}
            >
              Clear
            </button>
          </div>
          <div style={styles.logContent}>
            {updateLog.length === 0 ? (
              <p style={styles.logEmpty}>No activity yet. Try adding a user!</p>
            ) : (
              <ul style={styles.logList}>
                {updateLog.map((log, index) => (
                  <li key={index} style={styles.logItem}>
                    {log}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Users Display */}
        <div style={styles.usersCard}>
          <h2 style={styles.usersTitle}>
            Current Users ({users.length})
          </h2>
          <div style={styles.usersList}>
            {users.slice(0, 5).map((user) => (
              <div key={user.id} style={styles.userItem}>
                <div style={styles.userAvatar}>
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{user.fullName}</div>
                  <div style={styles.userEmail}>{user.email}</div>
                </div>
                <div style={styles.userRole}>{user.role}</div>
                {user.id.startsWith('temp-') && (
                  <div style={styles.tempBadge}>⏳ Pending</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Explanation */}
        <div style={styles.workflowCard}>
          <h2 style={styles.workflowTitle}>🔄 Optimistic Update Workflow</h2>
          <div style={styles.workflowSteps}>
            <div style={styles.workflowStep}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Update Cache Immediately</h3>
                <p style={styles.stepDescription}>
                  Add temporary data to SWR cache without revalidation
                </p>
                <code style={styles.stepCode}>
                  mutate(newData, false)
                </code>
              </div>
            </div>
            <div style={styles.workflowStep}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Send API Request</h3>
                <p style={styles.stepDescription}>
                  Call server to persist changes while user sees instant feedback
                </p>
                <code style={styles.stepCode}>
                  await fetch('/api/users', ...)
                </code>
              </div>
            </div>
            <div style={styles.workflowStep}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Handle Response</h3>
                <p style={styles.stepDescription}>
                  On success: revalidate. On error: rollback to original data
                </p>
                <code style={styles.stepCode}>
                  {`success ? mutate() : mutate(originalData, false)`}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div style={styles.codeCard}>
          <h2 style={styles.codeTitle}>💻 Code Example</h2>
          <pre style={styles.codeBlock}>
            {`const addUserOptimistic = async () => {
  const currentData = data;
  const tempUser = { id: 'temp-123', name: 'New User' };

  try {
    // Step 1: Optimistic update
    await mutate(
      { ...currentData, users: [tempUser, ...currentData.users] },
      false // Don't revalidate yet
    );

    // Step 2: API call
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(tempUser),
    });

    if (!response.ok) throw new Error('Failed');

    // Step 3: Revalidate with real data
    await mutate();
    
  } catch (error) {
    // Rollback on error
    await mutate(currentData, false);
  }
};`}
          </pre>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </main>
  );
}

// Styles (extensive CSS-in-JS)
const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
  patternsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  patternCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    position: "relative",
  },
  patternIcon: {
    fontSize: "2.5rem",
    marginBottom: "0.5rem",
  },
  patternTitle: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "0.5rem",
  },
  patternDescription: {
    fontSize: "0.875rem",
    color: "#666",
    lineHeight: 1.5,
  },
  patternBadge: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "#f093fb",
    color: "#fff",
    fontSize: "0.75rem",
    padding: "0.25rem 0.5rem",
    borderRadius: "999px",
    fontWeight: 600,
  },
  formCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  formTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "1.5rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.75rem",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  optimisticButton: {
    background: "#10b981",
    color: "#fff",
  },
  pessimisticButton: {
    background: "#f59e0b",
    color: "#fff",
  },
  localButton: {
    background: "#8b5cf6",
    color: "#fff",
  },
  globalButton: {
    background: "#3b82f6",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  formHint: {
    fontSize: "0.875rem",
    color: "#666",
    fontStyle: "italic",
  },
  logCard: {
    background: "#1f2937",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  logTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#fff",
  },
  clearButton: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  logContent: {
    background: "#111827",
    borderRadius: "8px",
    padding: "1rem",
    maxHeight: "300px",
    overflowY: "auto",
  },
  logEmpty: {
    color: "#9ca3af",
    textAlign: "center",
    padding: "2rem",
  },
  logList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  logItem: {
    color: "#10b981",
    fontSize: "0.875rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #374151",
    fontFamily: "'Courier New', monospace",
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
  },
  userAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
  tempBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    background: "#fef3c7",
    color: "#92400e",
  },
  workflowCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  workflowTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "1.5rem",
  },
  workflowSteps: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  workflowStep: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    fontWeight: "bold",
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#333",
    marginBottom: "0.5rem",
  },
  stepDescription: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  stepCode: {
    display: "block",
    background: "#f3f4f6",
    padding: "0.5rem",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontFamily: "'Courier New', monospace",
    color: "#dc2626",
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
    marginBottom: "2rem",
  },
  backLink: {
    color: "#f093fb",
    textDecoration: "none",
    fontWeight: 600,
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
    borderTop: "4px solid #f093fb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 1rem",
  },
};
