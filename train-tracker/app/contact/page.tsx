'use client';

import type { CSSProperties, ReactElement } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/FormInput";
import FormTextarea from "@/components/FormTextarea";
import FormSelect from "@/components/FormSelect";

// ============================================
// 1. Define Category Options
// ============================================
const categories = [
  { value: "claims", label: "Claims & Complaints" },
  { value: "booking", label: "Booking Issues" },
  { value: "suggestions", label: "Suggestions" },
  { value: "other", label: "Other" },
];

// ============================================
// 2. Define Zod Validation Schema
// ============================================
const contactSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  referenceCode: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[A-Z0-9]{6,12}$/i.test(val),
      "Reference code must be 6-12 alphanumeric characters"
    ),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters long")
    .max(1000, "Message cannot exceed 1000 characters"),
  attachmentUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

// ============================================
// 3. Derive TypeScript Type from Schema
// ============================================
type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage(): ReactElement {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // 4. Initialize React Hook Form with Zod Resolver
  // ============================================
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      category: "claims",
      fullName: "",
      email: "",
      referenceCode: "",
      message: "",
      attachmentUrl: "",
    },
    mode: "onBlur",
  });

  const hasReferenceCode = watch("referenceCode");

  // ============================================
  // 5. Form Submission Handler
  // ============================================
  async function onSubmit(data: ContactFormData): Promise<void> {
    setStatus(null);
    setError(null);

    console.log("📝 Contact form validation passed:", data);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.category,
          hasTicket: !!data.referenceCode,
          referenceCode: data.referenceCode || undefined,
          message: data.message,
          attachmentUrl: data.attachmentUrl || undefined,
          fullName: data.fullName,
          email: data.email,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? "Unable to submit your request.");
      } else {
        setStatus("✅ Request received. Our support team will reach out soon.");
        console.log("✅ Contact form submitted successfully");
        reset(); // Clear form fields
      }
    } catch (err) {
      console.error("❌ Contact form error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  // ============================================
  // 6. Render Form with Validation
  // ============================================
  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={{ marginTop: 0, fontSize: "2rem", marginBottom: "0.5rem" }}>
          Contact Us
        </h1>
        <p style={{ color: "#475569", marginBottom: "2rem" }}>
          Have a question or concern? Fill out the form below and we'll get back to you
          as soon as possible. ✅ Powered by React Hook Form + Zod validation.
        </p>

        {/* React Hook Form with Zod Validation */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Category Selection */}
          <FormSelect
            label="Issue Category"
            name="category"
            options={categories}
            register={register}
            error={errors.category}
            required
          />

          {/* Full Name */}
          <FormInput
            label="Full Name"
            name="fullName"
            type="text"
            register={register}
            error={errors.fullName}
            placeholder="Jane Passenger"
            required
          />

          {/* Email */}
          <FormInput
            label="Email"
            name="email"
            type="email"
            register={register}
            error={errors.email}
            placeholder="you@example.com"
            required
          />

          {/* Reference Code (Optional) */}
          <FormInput
            label="Reference Code"
            name="referenceCode"
            type="text"
            register={register}
            error={errors.referenceCode}
            placeholder="e.g. PNR123456 (optional)"
          />

          {/* Message */}
          <FormTextarea
            label="Message"
            name="message"
            register={register}
            error={errors.message}
            placeholder="Describe your issue or question in detail..."
            rows={6}
            required
          />

          {/* Attachment URL (Optional) */}
          <FormInput
            label="Attachment URL"
            name="attachmentUrl"
            type="url"
            register={register}
            error={errors.attachmentUrl}
            placeholder="https://drive.google.com/... (optional)"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              border: "none",
              background: isSubmitting
                ? "#94a3b8"
                : "linear-gradient(120deg, #0f3a7d, #1e5ba8)",
              color: "#ffffff",
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: isSubmitting
                ? "none"
                : "0 12px 30px rgba(37, 99, 235, 0.25)",
              transition: "all 0.3s ease",
              marginTop: "0.5rem",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
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
              borderRadius: "12px",
              border: "1px solid #6ee7b7",
              fontWeight: 500,
            }}
          >
            {status}
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
              borderRadius: "12px",
              border: "1px solid #fca5a5",
              fontWeight: 500,
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Form Stats */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#f1f5f9",
            borderRadius: "12px",
            fontSize: "0.85rem",
            color: "#64748b",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.5rem", color: "#334155" }}>
            📊 Form Validation Stats:
          </strong>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: "1.6" }}>
            <li>
              <strong>Errors detected:</strong> {Object.keys(errors).length}
            </li>
            <li>
              <strong>Submitting:</strong> {isSubmitting ? "Yes" : "No"}
            </li>
            <li>
              <strong>Has Reference Code:</strong> {hasReferenceCode ? "Yes" : "No"}
            </li>
          </ul>
        </div>

        {/* Validation Info */}
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#eff6ff",
            borderRadius: "12px",
            fontSize: "0.85rem",
            color: "#1e40af",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.5rem" }}>
            💡 Validation Rules:
          </strong>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: "1.6" }}>
            <li>Name: 2-50 characters</li>
            <li>Email: Valid email format</li>
            <li>Reference Code: 6-12 alphanumeric (optional)</li>
            <li>Message: 10-1000 characters</li>
            <li>Attachment: Valid URL format (optional)</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

// ============================================
// 7. Styles
// ============================================
const mainStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background: "linear-gradient(140deg, #dbeafe 0%, #eff6ff 50%, #e0e7ff 100%)",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "720px",
  background: "#ffffff",
  borderRadius: "20px",
  padding: "2.5rem",
  border: "1px solid #dbeafe",
  boxShadow: "0 35px 80px rgba(15, 23, 42, 0.15)",
  color: "#0f1c2e",
};
