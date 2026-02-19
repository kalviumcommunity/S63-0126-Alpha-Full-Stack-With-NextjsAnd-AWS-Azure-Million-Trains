'use client';

import { LayoutWrapper, Card, Button, InputField } from "@/components";

/**
 * Example page using the Default Layout (Header only, no sidebar)
 */
export default function DefaultLayoutExample() {
  return (
    <LayoutWrapper variant="default">
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Hero Section */}
          <div style={styles.hero}>
            <h1 style={styles.heroTitle}>Default Layout Example</h1>
            <p style={styles.heroSubtitle}>
              This page uses the "default" layout variant with Header only (no sidebar)
            </p>
            <div style={styles.heroActions}>
              <Button label="Get Started" variant="primary" size="large" />
              <Button label="Learn More" variant="outline" size="large" />
            </div>
          </div>

          {/* Features Grid */}
          <div style={styles.featuresGrid}>
            <Card variant="elevated" padding="large">
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🚀</div>
                <h3 style={styles.featureTitle}>Fast Performance</h3>
                <p style={styles.featureText}>
                  Lightning-fast load times and smooth interactions
                </p>
              </div>
            </Card>

            <Card variant="elevated" padding="large">
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🎨</div>
                <h3 style={styles.featureTitle}>Beautiful Design</h3>
                <p style={styles.featureText}>
                  Modern, clean interface with attention to detail
                </p>
              </div>
            </Card>

            <Card variant="elevated" padding="large">
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🔒</div>
                <h3 style={styles.featureTitle}>Secure & Private</h3>
                <p style={styles.featureText}>
                  Your data is protected with industry-standard encryption
                </p>
              </div>
            </Card>
          </div>

          {/* Contact Form Card */}
          <Card
            title="Get in Touch"
            subtitle="Send us a message and we'll respond as soon as possible"
            variant="elevated"
          >
            <div style={styles.form}>
              <InputField label="Name" placeholder="Your name" icon="👤" fullWidth />
              <InputField
                label="Email"
                type="email"
                placeholder="your@email.com"
                icon="📧"
                fullWidth
              />
              <InputField
                label="Message"
                placeholder="Your message"
                icon="💬"
                fullWidth
              />
              <Button label="Send Message" variant="primary" fullWidth />
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
    background: "linear-gradient(145deg, #dbeafe 0%, #f8fbff 60%, #e0e7ff 100%)",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "3rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "3rem",
  },
  hero: {
    textAlign: "center",
    padding: "3rem 1rem",
  },
  heroTitle: {
    fontSize: "3rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 1rem 0",
  },
  heroSubtitle: {
    fontSize: "1.25rem",
    color: "#6b7280",
    margin: "0 0 2rem 0",
  },
  heroActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2rem",
  },
  feature: {
    textAlign: "center",
  },
  featureIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  featureTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 0.75rem 0",
  },
  featureText: {
    fontSize: "1rem",
    color: "#6b7280",
    lineHeight: 1.6,
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    maxWidth: "600px",
    margin: "0 auto",
  },
};
