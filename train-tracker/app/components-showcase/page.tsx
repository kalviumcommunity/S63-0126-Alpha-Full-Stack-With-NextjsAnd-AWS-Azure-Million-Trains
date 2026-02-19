'use client';

import { useState } from "react";
import type { CSSProperties } from "react";
import { Button, Card, InputField, Badge, Modal, Alert } from "@/components";

export default function ComponentShowcasePage() {
  const [showModal, setShowModal] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Component Showcase</h1>
          <p style={styles.pageSubtitle}>
            Explore all reusable UI components in the design system
          </p>
        </div>

        {/* Alert Demo */}
        {showAlert && (
          <Alert
            type="info"
            title="Component Library"
            onClose={() => setShowAlert(false)}
          >
            This page demonstrates all reusable components. Interact with them to see variants and states.
          </Alert>
        )}

        {/* Buttons Section */}
        <Card title="Buttons" subtitle="Different button variants and sizes" variant="elevated">
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Variants</h4>
            <div style={styles.buttonGrid}>
              <Button label="Primary" variant="primary" />
              <Button label="Secondary" variant="secondary" />
              <Button label="Danger" variant="danger" />
              <Button label="Success" variant="success" />
              <Button label="Outline" variant="outline" />
            </div>

            <h4 style={styles.sectionTitle}>Sizes</h4>
            <div style={styles.buttonGrid}>
              <Button label="Small" size="small" />
              <Button label="Medium" size="medium" />
              <Button label="Large" size="large" />
            </div>

            <h4 style={styles.sectionTitle}>With Icons</h4>
            <div style={styles.buttonGrid}>
              <Button icon="🚀" label="Launch" variant="primary" />
              <Button icon="🗑️" label="Delete" variant="danger" />
              <Button icon="✓" label="Save" variant="success" />
            </div>

            <h4 style={styles.sectionTitle}>States</h4>
            <div style={styles.buttonGrid}>
              <Button label="Normal" />
              <Button label="Loading" loading={loading} onClick={handleLoadingDemo} />
              <Button label="Disabled" disabled />
            </div>
          </div>
        </Card>

        {/* Badges Section */}
        <Card title="Badges" subtitle="Status indicators and labels" variant="elevated">
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Variants</h4>
            <div style={styles.badgeGrid}>
              <Badge label="Default" variant="default" />
              <Badge label="Primary" variant="primary" />
              <Badge label="Success" variant="success" />
              <Badge label="Warning" variant="warning" />
              <Badge label="Danger" variant="danger" />
              <Badge label="Info" variant="info" />
            </div>

            <h4 style={styles.sectionTitle}>Sizes</h4>
            <div style={styles.badgeGrid}>
              <Badge label="Small" size="small" />
              <Badge label="Medium" size="medium" />
              <Badge label="Large" size="large" />
            </div>

            <h4 style={styles.sectionTitle}>Shapes</h4>
            <div style={styles.badgeGrid}>
              <Badge label="Rounded" rounded variant="primary" />
              <Badge label="Square" rounded={false} variant="primary" />
            </div>
          </div>
        </Card>

        {/* Input Fields Section */}
        <Card title="Input Fields" subtitle="Form input components" variant="elevated">
          <div style={styles.section}>
            <InputField
              label="Username"
              placeholder="Enter your username"
              icon="👤"
            />
            <InputField
              label="Email"
              type="email"
              placeholder="your@email.com"
              icon="📧"
              helperText="We'll never share your email"
            />
            <InputField
              label="Password"
              type="password"
              placeholder="Enter password"
              icon="🔒"
            />
            <InputField
              label="Invalid Field"
              placeholder="Error example"
              error="This field is required"
            />
          </div>
        </Card>

        {/* Cards Section */}
        <Card title="Cards" subtitle="Container components with various styles" variant="elevated">
          <div style={styles.cardGrid}>
            <Card variant="default" padding="medium">
              <h4 style={styles.cardTitle}>Default Card</h4>
              <p style={styles.cardText}>Standard card with border</p>
            </Card>

            <Card variant="elevated" padding="medium">
              <h4 style={styles.cardTitle}>Elevated Card</h4>
              <p style={styles.cardText}>Card with shadow effect</p>
            </Card>

            <Card variant="outlined" padding="medium">
              <h4 style={styles.cardTitle}>Outlined Card</h4>
              <p style={styles.cardText}>Card with colored border</p>
            </Card>

            <Card variant="gradient" padding="medium">
              <h4 style={styles.cardTitle}>Gradient Card</h4>
              <p style={styles.cardText}>Card with gradient background</p>
            </Card>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <Card
              title="Card with Header"
              subtitle="This card includes a header, content, and footer"
              variant="elevated"
              headerAction={<Badge label="New" variant="success" />}
              footer={
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button label="Cancel" variant="outline" size="small" />
                  <Button label="Save" variant="primary" size="small" />
                </div>
              }
            >
              <p>This is the card content area. It can contain any React component.</p>
            </Card>
          </div>
        </Card>

        {/* Alerts Section */}
        <Card title="Alerts" subtitle="Notification and message components" variant="elevated">
          <div style={styles.section}>
            <Alert type="info" title="Information">
              This is an informational message.
            </Alert>
            <Alert type="success" title="Success!">
              Your action was completed successfully.
            </Alert>
            <Alert type="warning" title="Warning">
              Please review this carefully before proceeding.
            </Alert>
            <Alert type="error" title="Error">
              An error occurred. Please try again.
            </Alert>
          </div>
        </Card>

        {/* Modal Section */}
        <Card title="Modal" subtitle="Dialog and overlay components" variant="elevated">
          <div style={styles.section}>
            <Button
              label="Open Modal"
              variant="primary"
              onClick={() => setShowModal(true)}
            />
          </div>
        </Card>

        {/* Modal Component */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Example Modal"
          footer={
            <>
              <Button
                label="Cancel"
                variant="outline"
                onClick={() => setShowModal(false)}
              />
              <Button
                label="Confirm"
                variant="primary"
                onClick={() => setShowModal(false)}
              />
            </>
          }
        >
          <p>This is a modal dialog. It can contain any content and is fully accessible.</p>
          <p>Press ESC or click outside to close.</p>
        </Modal>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "2rem 1rem",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  pageHeader: {
    marginBottom: "1rem",
  },
  pageTitle: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 0.5rem 0",
  },
  pageSubtitle: {
    fontSize: "1.1rem",
    color: "#6b7280",
    margin: 0,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#374151",
    margin: "1rem 0 0.5rem 0",
  },
  buttonGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
  },
  badgeGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    alignItems: "center",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#1f2937",
    margin: "0 0 0.5rem 0",
  },
  cardText: {
    fontSize: "0.9rem",
    color: "#6b7280",
    margin: 0,
  },
};
