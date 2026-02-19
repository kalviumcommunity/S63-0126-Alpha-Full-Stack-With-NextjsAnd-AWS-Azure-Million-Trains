'use client';

import { LayoutWrapper, Card, Button, Badge } from "@/components";

/**
 * Example page using the Minimal Layout (no header, no sidebar)
 */
export default function MinimalLayoutExample() {
  return (
    <LayoutWrapper variant="minimal">
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Centered Content Card */}
          <Card variant="elevated" padding="large">
            <div style={styles.content}>
              {/* Logo/Brand */}
              <div style={styles.brand}>
                <span style={styles.brandIcon}>🚂</span>
                <h2 style={styles.brandName}>TrainTracker</h2>
              </div>

              {/* Title */}
              <h1 style={styles.title}>Minimal Layout Example</h1>
              
              {/* Badge */}
              <Badge label="Minimal" variant="info" />

              {/* Description */}
              <p style={styles.description}>
                This page uses the "minimal" layout variant with no header and no sidebar.
                Perfect for login pages, landing pages, or focused single-purpose views.
              </p>

              {/* Features List */}
              <div style={styles.features}>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>Clean and focused design</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>No navigation distractions</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>Perfect for authentication flows</span>
                </div>
              </div>

              {/* Actions */}
              <div style={styles.actions}>
                <Button label="Primary Action" variant="primary" fullWidth />
                <Button label="Secondary Action" variant="outline" fullWidth />
              </div>

              {/* Footer Links */}
              <div style={styles.footer}>
                <a href="/" style={styles.link}>Home</a>
                <span style={styles.separator}>•</span>
                <a href="/about" style={styles.link}>About</a>
                <span style={styles.separator}>•</span>
                <a href="/contact" style={styles.link}>Contact</a>
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    background: "linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)",
  },
  container: {
    width: "100%",
    maxWidth: "500px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
    textAlign: "center",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  brandIcon: {
    fontSize: "2rem",
  },
  brandName: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#2563eb",
    margin: 0,
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
  },
  description: {
    fontSize: "1rem",
    color: "#6b7280",
    lineHeight: 1.6,
    margin: 0,
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    width: "100%",
    textAlign: "left",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "#f9fafb",
    borderRadius: "6px",
    fontSize: "0.95rem",
    color: "#374151",
  },
  featureIcon: {
    color: "#10b981",
    fontWeight: 700,
    fontSize: "1.1rem",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    width: "100%",
    marginTop: "1rem",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginTop: "1rem",
    fontSize: "0.9rem",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
  separator: {
    color: "#9ca3af",
  },
};
