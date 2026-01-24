'use client';

import type { CSSProperties, FormEvent, ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? "Failed to log in.");
      } else {
        setStatus("Logged in successfully.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "2.5rem",
          border: "1px solid #dbeafe",
          boxShadow: "0 35px 70px rgba(15, 23, 42, 0.15)",
          color: "#0f1c2e"
        }}
      >
        <h1 style={{ marginTop: 0 }}>Welcome back</h1>
        <p style={{ marginBottom: "1.5rem", color: "#475569" }}>
          Sign in to monitor live network performance.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <label style={{ display: "grid", gap: "0.4rem" }}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: "0.4rem" }}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              style={inputStyle}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "0.85rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(120deg, #2563eb, #38bdf8)",
              color: "#ffffff",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 12px 30px rgba(37, 99, 235, 0.25)"
            }}
          >
            {isSubmitting ? "Signing in..." : "Log In"}
          </button>
        </form>
        {status && (
          <p style={{ marginTop: "1rem", color: "#047857" }}>{status}</p>
        )}
        {error && (
          <p style={{ marginTop: "1rem", color: "#dc2626" }}>{error}</p>
        )}
        <p style={{ marginTop: "1.5rem" }}>
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}

const inputStyle: CSSProperties = {
  padding: "0.8rem 1rem",
  borderRadius: "8px",
  border: "1px solid #c7d7ff",
  background: "#f8fbff",
  color: "#0f1c2e",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)"
};
