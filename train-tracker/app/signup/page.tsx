'use client';

import type { CSSProperties, ReactElement } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/FormInput";

// ============================================
// 1. Define Zod Validation Schema
// ============================================
const signupSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters long")
    .max(50, "Full name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(50, "Password cannot exceed 50 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ============================================
// 2. Derive TypeScript Type from Schema
// ============================================
type SignupFormData = z.infer<typeof signupSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default function SignupPage(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // 3. Initialize React Hook Form with Zod Resolver
  // ============================================
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur", // Validate on blur for better UX
  });

  const nextDestination = useMemo(() => {
    const target = searchParams.get("next");
    if (!target || !target.startsWith("/") || target.startsWith("//")) {
      return "/dashboard";
    }
    return target;
  }, [searchParams]);

  // ============================================
  // 4. Form Submission Handler
  // ============================================
  async function onSubmit(data: SignupFormData): Promise<void> {
    setStatus(null);
    setError(null);

    console.log("📝 Form validation passed:", data);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
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
      }

      const successMessage =
        isJson && isRecord(payload) && typeof payload.message === "string"
          ? payload.message
          : "Account created successfully. You can log in now.";

      setStatus(successMessage);
      console.log("✅ Account created successfully");
      reset(); // Clear form fields
      
      setTimeout(() => {
        router.push(`/login?next=${encodeURIComponent(nextDestination)}`);
      }, 600);
    } catch (err) {
      console.error("❌ Signup error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  // ============================================
  // 5. Render Form with Validation
  // ============================================
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
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "2.5rem",
          border: "1px solid #dbeafe",
          boxShadow: "0 35px 70px rgba(15, 23, 42, 0.15)",
          color: "#0f1c2e",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "2rem", marginBottom: "0.5rem" }}>
          Create Account
        </h1>
        <p style={{ marginBottom: "2rem", color: "#475569" }}>
          Fill in the details below to track rail delays. ✅ Form validates with React Hook Form + Zod.
        </p>

        {/* React Hook Form with Zod Validation */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormInput
            label="Full Name"
            name="fullName"
            type="text"
            register={register}
            error={errors.fullName}
            placeholder="Jane Passenger"
            required
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            register={register}
            error={errors.email}
            placeholder="you@example.com"
            required
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "0.85rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              background: isSubmitting
                ? "#94a3b8"
                : "linear-gradient(120deg, #2563eb, #38bdf8)",
              color: "#ffffff",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: isSubmitting
                ? "none"
                : "0 12px 30px rgba(37, 99, 235, 0.25)",
              transition: "all 0.3s ease",
              marginTop: "0.5rem",
            }}
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Success Message */}
        {status && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              backgroundColor: "#d1fae5",
              color: "#047857",
              borderRadius: "8px",
              border: "1px solid #6ee7b7",
            }}
          >
            ✅ {status}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              borderRadius: "8px",
              border: "1px solid #fca5a5",
            }}
          >
            ❌ {error}
          </div>
        )}

        <p style={{ marginTop: "1.5rem", textAlign: "center", color: "#64748b" }}>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(nextDestination)}`}
            style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
          >
            Log in
          </Link>
        </p>

        {/* Validation Info */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#f1f5f9",
            borderRadius: "8px",
            fontSize: "0.85rem",
            color: "#64748b",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.5rem", color: "#334155" }}>
            Password Requirements:
          </strong>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: "1.6" }}>
            <li>At least 6 characters long</li>
            <li>Contains uppercase and lowercase letters</li>
            <li>Contains at least one number</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
