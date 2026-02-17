'use client';

import type { CSSProperties, FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default function SignupPage(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextDestination = useMemo(() => {
    const target = searchParams.get("next");
    if (!target || !target.startsWith("/") || target.startsWith("//")) {
      return "/dashboard";
    }
    return target;
  }, [searchParams]);

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

      const contentType = response.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
 Transaction
        setError(payload?.error ?? "Failed to sign up.");
      } else {
        setStatus("Account created successfully. You can log in now.");
        setFullName("");
        setEmail("");
        setPassword("");
        setTimeout(() => {
          router.push(`/login?next=${encodeURIComponent(nextDestination)}`);
        }, 600);

        const fallback =
          typeof payload === "string" && payload.trim()
            ? payload.trim()
            : "Failed to sign up.";
        const derivedError =
          isJson && isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : fallback;

        if (!isJson) {
          console.error("Signup API returned non-JSON error:", payload);
        }

        setError(derivedError);
        return;
 main
      }

      const successMessage =
        isJson && isRecord(payload) && typeof payload.message === "string"
          ? payload.message
          : "Account created successfully. You can log in now.";

      setStatus(successMessage);
      setFullName("");
      setEmail("");
      setPassword("");
      setTimeout(() => {
        router.push("/login");
      }, 600);
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
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundImage:
          "linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(239, 246, 255, 0.5) 100%), url('https://t3.ftcdn.net/jpg/04/97/47/54/360_F_497475430_rKgeREiWH96Z7xYa1OAANgiJaVxC6Hln.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        boxSizing: "border-box"
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
        <h1 style={{ marginTop: 0 }}>Create Account</h1>
        <p style={{ marginBottom: "1.5rem", color: "#475569" }}>
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
              background: "linear-gradient(120deg, #2563eb, #38bdf8)",
              color: "#ffffff",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 12px 30px rgba(37, 99, 235, 0.25)"
            }}
          >
            {isSubmitting ? "Creating..." : "Sign Up"}
          </button>
        </form>
        {status && (
          <p style={{ marginTop: "1rem", color: "#047857" }}>{status}</p>
        )}
        {error && (
          <p style={{ marginTop: "1rem", color: "#dc2626" }}>{error}</p>
        )}
        <p style={{ marginTop: "1.5rem" }}>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextDestination)}`}>Log in</Link>
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
