"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Modal, Loader, Button, Card } from "@/components/ui";

/**
 * Feedback UI Demo Page
 * 
 * Demonstrates:
 * - Toast notifications (success, error, loading)
 * - Accessible modals with confirmation dialogs
 * - Loading spinners and progress indicators
 * - Combined user flows
 */
export default function FeedbackDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullScreenLoader, setShowFullScreenLoader] = useState(false);

  // Toast Examples
  const showSuccessToast = () => {
    toast.success("Operation completed successfully!");
  };

  const showErrorToast = () => {
    toast.error("Something went wrong. Please try again.");
  };

  const showLoadingToast = () => {
    const id = toast.loading("Processing your request...");
    setTimeout(() => {
      toast.dismiss(id);
      toast.success("Request completed!");
    }, 2000);
  };

  const showCustomToast = () => {
    toast("This is a custom notification", {
      icon: "ℹ️",
      style: {
        background: "#3b82f6",
        color: "#fff",
      },
    });
  };

  // Simulated API Call with Full Flow
  const handleAsyncOperation = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading("Saving changes...");

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.dismiss(loadingToast);
      toast.success("Changes saved successfully!");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Confirmation Flow
  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    setShowFullScreenLoader(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setShowFullScreenLoader(false);
      toast.success("Item deleted successfully!");
    } catch (error) {
      setShowFullScreenLoader(false);
      toast.error("Failed to delete item");
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Feedback UI Components</h1>
          <p style={styles.subtitle}>
            Interactive demos of toasts, modals, and loaders
          </p>
        </header>

        {/* Toast Notifications Section */}
        <section style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>✨ Toast Notifications</h2>
            <p style={styles.description}>
              Instant, non-blocking feedback for user actions. Accessible with
              ARIA live regions.
            </p>
            <div style={styles.buttonGrid}>
              <Button onClick={showSuccessToast}>
                Show Success Toast
              </Button>
              <Button onClick={showErrorToast}>
                Show Error Toast
              </Button>
              <Button onClick={showLoadingToast}>
                Show Loading Toast
              </Button>
              <Button onClick={showCustomToast}>
                Show Custom Toast
              </Button>
            </div>
          </Card>
        </section>

        {/* Modal Section */}
        <section style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>🗂️ Modal Dialogs</h2>
            <p style={styles.description}>
              Blocking UI for important confirmations. Features focus trap,
              keyboard navigation, and ARIA attributes.
            </p>
            <div style={styles.buttonGrid}>
              <Button onClick={() => setIsModalOpen(true)}>
                Open Info Modal
              </Button>
              <Button onClick={() => setIsDeleteModalOpen(true)}>
                Open Confirmation Modal
              </Button>
            </div>
          </Card>
        </section>

        {/* Loader Section */}
        <section style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>⏳ Loading Indicators</h2>
            <p style={styles.description}>
              Visual feedback for ongoing processes. Shows users that work is
              happening.
            </p>
            <div style={styles.loaderExamples}>
              <div style={styles.loaderExample}>
                <h3 style={styles.loaderTitle}>Small</h3>
                <Loader size="small" />
              </div>
              <div style={styles.loaderExample}>
                <h3 style={styles.loaderTitle}>Medium</h3>
                <Loader size="medium" text="Loading..." />
              </div>
              <div style={styles.loaderExample}>
                <h3 style={styles.loaderTitle}>Large</h3>
                <Loader size="large" text="Please wait..." />
              </div>
            </div>
            <Button
              onClick={() => {
                setShowFullScreenLoader(true);
                setTimeout(() => setShowFullScreenLoader(false), 2000);
              }}
              style={{ marginTop: "1rem" }}
            >
              Show Full-Screen Loader
            </Button>
          </Card>
        </section>

        {/* Combined Flow Section */}
        <section style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>🔄 Complete User Flow</h2>
            <p style={styles.description}>
              Example of combined feedback: Button Loader → Toast → Success
            </p>
            <Button
              onClick={handleAsyncOperation}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            {isLoading && (
              <div style={{ marginTop: "1rem" }}>
                <Loader size="small" text="Processing..." />
              </div>
            )}
          </Card>
        </section>

        {/* UX Principles */}
        <section style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>📋 UX Principles Applied</h2>
            <ul style={styles.principlesList}>
              <li>
                <strong>Instant Feedback:</strong> Toasts appear immediately
                for quick confirmations
              </li>
              <li>
                <strong>Blocking Feedback:</strong> Modals pause workflow for
                important decisions
              </li>
              <li>
                <strong>Process Feedback:</strong> Loaders show ongoing work
                and prevent confusion
              </li>
              <li>
                <strong>Accessibility:</strong> ARIA attributes, focus
                management, keyboard navigation
              </li>
              <li>
                <strong>Visual Consistency:</strong> Color coding (green =
                success, red = error, blue = info)
              </li>
              <li>
                <strong>Non-intrusive:</strong> Toasts auto-dismiss, don't
                block interaction
              </li>
            </ul>
          </Card>
        </section>
      </div>

      {/* Info Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Information"
      >
        <p>
          This is an accessible modal dialog. It features:
        </p>
        <ul>
          <li>Focus trap (tab cycles through modal elements only)</li>
          <li>Escape key to close</li>
          <li>Click outside to close</li>
          <li>ARIA attributes for screen readers</li>
          <li>Body scroll lock when open</li>
        </ul>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem" }}>
          <Button onClick={() => setIsModalOpen(false)}>
            Got it
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        size="small"
      >
        <p style={{ marginBottom: "1.5rem" }}>
          Are you sure you want to delete this item? This action cannot be
          undone.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <Button onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            style={{
              background: "#ef4444",
              color: "#fff",
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Full Screen Loader */}
      {showFullScreenLoader && (
        <Loader fullScreen text="Deleting item..." />
      )}
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    padding: "2rem",
    background: "linear-gradient(145deg, #dbeafe 0%, #f8fbff 60%, #e0e7ff 100%)",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "3rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.125rem",
    color: "#6b7280",
    margin: 0,
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#1f2937",
    marginTop: 0,
    marginBottom: "0.5rem",
  },
  description: {
    color: "#6b7280",
    marginBottom: "1.5rem",
    lineHeight: 1.6,
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  loaderExamples: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "2rem",
    padding: "2rem 1rem",
  },
  loaderExample: {
    textAlign: "center" as const,
  },
  loaderTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: "1rem",
  },
  principlesList: {
    lineHeight: 1.8,
    color: "#374151",
  },
};
