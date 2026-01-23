'use client';

import type { CSSProperties, FormEvent, ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage(): ReactElement {
  const [fullName, setFullName] = useState("");
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? "Failed to sign up.");
      } else {
        setStatus("Account created successfully. You can log in now.");
        setFullName("");
        setEmail("");
        setPassword("");
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
        padding: "2rem"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0f172a",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.4)",
          color: "#e2e8f0"
        }}
      >
        <h1 style={{ marginTop: 0 }}>Create Account</h1>
        <p style={{ marginBottom: "1.5rem", color: "#94a3b8" }}>
          Fill in the details below to track rail delays.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <label style={{ display: "grid", gap: "0.4rem" }}>
            <span>Full Name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              placeholder="Jane Passenger"
              style={inputStyle}
            />
          </label>
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
              background: "#38bdf8",
              color: "#020617",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer"
            }}
          >
            {isSubmitting ? "Creating..." : "Sign Up"}
          </button>
        </form>
        {status && (
          <p style={{ marginTop: "1rem", color: "#34d399" }}>{status}</p>
        )}
        {error && (
          <p style={{ marginTop: "1rem", color: "#f87171" }}>{error}</p>
        )}
        <p style={{ marginTop: "1.5rem" }}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

const inputStyle: CSSProperties = {
  padding: "0.8rem 1rem",
  borderRadius: "8px",
  border: "1px solid #1e293b",
  background: "#020617",
  color: "#e2e8f0"
};
