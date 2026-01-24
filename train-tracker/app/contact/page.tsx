'use client';

import type { CSSProperties, FormEvent, ReactElement } from "react";
import { useState } from "react";

const categories = [
  "Claims & Complaints",
  "Booking Issues",
  "Suggestions",
  "Other"
];

type Step = 1 | 2 | 3;

type FormState = {
  category: string;
  hasTicket: boolean;
  referenceCode: string;
  message: string;
  attachmentUrl: string;
  fullName: string;
  email: string;
};

const initialState: FormState = {
  category: categories[0],
  hasTicket: false,
  referenceCode: "",
  message: "",
  attachmentUrl: "",
  fullName: "",
  email: ""
};

export default function ContactPage(): ReactElement {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(currentStep: Step): boolean {
    if (currentStep === 2 && !form.message.trim()) {
      setError("Please describe your issue before continuing.");
      return false;
    }

    if (currentStep === 2 && form.hasTicket && !form.referenceCode.trim()) {
      setError("Include your reference code when you have a ticket.");
      return false;
    }

    if (currentStep === 3) {
      if (!form.fullName.trim()) {
        setError("Full name is required.");
        return false;
      }
      if (!/.+@.+\..+/.test(form.email)) {
        setError("Enter a valid email address.");
        return false;
      }
    }

    setError(null);
    return true;
  }

  function next(): void {
    if (step === 3) return;
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as Step);
    }
  }

  function previous(): void {
    if (step === 1) return;
    setError(null);
    setStep((prev) => (prev - 1) as Step);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!validateStep(3)) {
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          hasTicket: form.hasTicket,
          referenceCode: form.hasTicket ? form.referenceCode : undefined,
          message: form.message,
          attachmentUrl: form.attachmentUrl || undefined,
          fullName: form.fullName,
          email: form.email
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? "Unable to submit your request.");
      } else {
        setStatus("Request received. Our support team will reach out soon.");
        setForm(initialState);
        setStep(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Contact Us / Claims & Complaints</h1>
        <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
          Tell us about your issue in a few quick steps.
        </p>

        <div style={stepsWrapperStyle}>
          {[1, 2, 3].map((value) => (
            <div key={value} style={getStepStyle(step >= value)}>
              Step {value}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
          {step === 1 && (
            <div>
              <h2 style={sectionHeadingStyle}>1. Issue Category</h2>
              <div style={{ display: "grid", gap: "0.8rem" }}>
                {categories.map((option) => (
                  <label key={option} style={optionLabelStyle}>
                    <input
                      type="radio"
                      name="category"
                      value={option}
                      checked={form.category === option}
                      onChange={() => updateField("category", option)}
                      required
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={sectionHeadingStyle}>2. Request Details</h2>
              <label style={toggleLabelStyle}>
                <input
                  type="checkbox"
                  checked={form.hasTicket}
                  onChange={(event) => updateField("hasTicket", event.target.checked)}
                />
                <span>I have a ticket or reference code</span>
              </label>
              {form.hasTicket && (
                <label style={fieldLabelStyle}>
                  Reference Code
                  <input
                    type="text"
                    value={form.referenceCode}
                    onChange={(event) => updateField("referenceCode", event.target.value)}
                    placeholder="e.g. PNR123456"
                    style={inputStyle}
                  />
                </label>
              )}
              <label style={fieldLabelStyle}>
                Message
                <textarea
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  required
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Describe what happened and how we can help."
                />
              </label>
              <label style={fieldLabelStyle}>
                Attachment URL (optional)
                <input
                  type="url"
                  value={form.attachmentUrl}
                  onChange={(event) => updateField("attachmentUrl", event.target.value)}
                  placeholder="https://drive.google.com/..."
                  style={inputStyle}
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={sectionHeadingStyle}>3. Your Details</h2>
              <label style={fieldLabelStyle}>
                Full Name
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  required
                  placeholder="Jane Passenger"
                  style={inputStyle}
                />
              </label>
              <label style={fieldLabelStyle}>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  required
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between" }}>
            <button
              type="button"
              onClick={previous}
              disabled={step === 1}
              style={{ ...secondaryButtonStyle, opacity: step === 1 ? 0.5 : 1 }}
            >
              Back
            </button>
            {step < 3 ? (
              <button type="button" onClick={next} style={primaryButtonStyle}>
                Next
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} style={primaryButtonStyle}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </form>

        {status && <p style={{ color: "#047857", marginTop: "1rem" }}>{status}</p>}
        {error && <p style={{ color: "#dc2626", marginTop: "1rem" }}>{error}</p>}
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background: "linear-gradient(140deg, #dbeafe 0%, #eff6ff 50%, #e0e7ff 100%)"
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "720px",
  background: "#ffffff",
  borderRadius: "20px",
  padding: "2.5rem",
  border: "1px solid #dbeafe",
  boxShadow: "0 35px 80px rgba(15, 23, 42, 0.15)",
  color: "#0f1c2e"
};

const stepsWrapperStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "0.75rem",
  marginBottom: "2rem"
};

function getStepStyle(isActive: boolean): CSSProperties {
  return {
    padding: "0.6rem",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: 600,
    background: isActive ? "#2563eb" : "#e2e8f0",
    color: isActive ? "#ffffff" : "#475569",
    boxShadow: isActive ? "0 12px 30px rgba(37, 99, 235, 0.25)" : "none"
  };
}

const sectionHeadingStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "1rem"
};

const fieldLabelStyle: CSSProperties = {
  display: "grid",
  gap: "0.4rem"
};

const optionLabelStyle: CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  alignItems: "center",
  padding: "0.6rem 0.9rem",
  borderRadius: "12px",
  border: "1px solid #c7d7ff",
  background: "#f8fbff"
};

const toggleLabelStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
  marginBottom: "0.5rem",
  color: "#1f2937"
};

const inputStyle: CSSProperties = {
  padding: "0.85rem 1rem",
  borderRadius: "10px",
  border: "1px solid #c7d7ff",
  background: "#f8fbff",
  color: "#0f1c2e",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)"
};

const primaryButtonStyle: CSSProperties = {
  padding: "0.9rem 1.75rem",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(120deg, #2563eb, #38bdf8)",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 12px 30px rgba(37, 99, 235, 0.25)"
};

const secondaryButtonStyle: CSSProperties = {
  padding: "0.9rem 1.75rem",
  borderRadius: "12px",
  border: "1px solid #c7d7ff",
  background: "#ffffff",
  color: "#1e293b",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)"
};
