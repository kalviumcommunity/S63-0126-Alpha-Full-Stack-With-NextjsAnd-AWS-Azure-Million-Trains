'use client';

import { LayoutWrapper, Card, Button, Badge } from "@/components";

/**
 * Example page using the Dashboard Layout (Header + Sidebar)
 */
export default function DashboardLayoutExample() {
  return (
    <LayoutWrapper variant="dashboard">
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Page Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Dashboard Layout Example</h1>
              <p style={styles.subtitle}>
                This page uses the "dashboard" layout variant with Header + Sidebar
              </p>
            </div>
            <Badge label="Dashboard" variant="primary" />
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <Card variant="elevated" padding="medium">
              <div style={styles.stat}>
                <div style={styles.statIcon}>📊</div>
                <div>
                  <div style={styles.statValue}>1,234</div>
                  <div style={styles.statLabel}>Total Users</div>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="medium">
              <div style={styles.stat}>
                <div style={styles.statIcon}>🚂</div>
                <div>
                  <div style={styles.statValue}>567</div>
                  <div style={styles.statLabel}>Active Trains</div>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="medium">
              <div style={styles.stat}>
                <div style={styles.statIcon}>📈</div>
                <div>
                  <div style={styles.statValue}>89%</div>
                  <div style={styles.statLabel}>Uptime</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Content Cards */}
          <Card
            title="Recent Activity"
            subtitle="Latest updates and changes"
            variant="elevated"
            headerAction={<Button label="View All" variant="outline" size="small" />}
          >
            <div style={styles.activityList}>
              <div style={styles.activityItem}>
                <span>User John Doe logged in</span>
                <span style={styles.activityTime}>2 minutes ago</span>
              </div>
              <div style={styles.activityItem}>
                <span>Train #12345 departed</span>
                <span style={styles.activityTime}>15 minutes ago</span>
              </div>
              <div style={styles.activityItem}>
                <span>New user registered</span>
                <span style={styles.activityTime}>1 hour ago</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "2rem",
    background: "#f9fafb",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#6b7280",
    margin: 0,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  statIcon: {
    fontSize: "2.5rem",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#6b7280",
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  activityItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    background: "#f9fafb",
    borderRadius: "6px",
  },
  activityTime: {
    fontSize: "0.85rem",
    color: "#9ca3af",
  },
};
