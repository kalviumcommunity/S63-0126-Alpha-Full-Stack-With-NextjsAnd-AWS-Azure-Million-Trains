'use client';

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

const categories = [
  {
    key: "live-updates",
    label: "Live Train Updates",
    blurb: "Real-time delay information and service status.",
    faqs: [
      {
        question: "How do I check if my train is running late?",
        answer:
          "You can search your train from the dashboard to view its current delay status, expected arrival time, and platform information."
      },
      {
        question: "How frequently is train delay information updated?",
        answer:
          "Train status is refreshed regularly throughout the day to reflect the most recent operational updates available."
      },
      {
        question: "Why does the delay shown sometimes change?",
        answer:
          "Delays can change due to signal issues, congestion, weather conditions, or operational adjustments made by railway authorities."
      }
    ]
  },
  {
    key: "routes",
    label: "Routes & Reroutes",
    blurb: "Alternate routes and journey planning.",
    faqs: [
      {
        question: "What should I do if my train is heavily delayed?",
        answer:
          "If your train is significantly delayed, the routes section helps you explore alternate trains or routes to reach your destination faster."
      },
      {
        question: "Does the platform suggest alternate trains automatically?",
        answer:
          "Yes, when delays exceed a certain threshold, suggested alternate routes may be displayed based on availability and timing."
      },
      {
        question: "Are reroute suggestions guaranteed?",
        answer:
          "Reroute suggestions are advisory and based on available data. Actual availability depends on real-time train operations."
      }
    ]
  },
  {
    key: "accounts",
    label: "Accounts & Alerts",
    blurb: "Login, saved routes, and notifications.",
    faqs: [
      {
        question: "Do I need to create an account to use this platform?",
        answer:
          "You can view live train delays without an account. Creating an account allows you to save routes and receive delay alerts."
      },
      {
        question: "How do delay alerts work?",
        answer:
          "Once you save a route, you will receive alerts whenever there is a significant delay or disruption affecting your journey."
      },
      {
        question: "Can I stop receiving alerts?",
        answer:
          "Yes, alerts can be managed or disabled anytime from your profile page."
      }
    ]
  },
  {
    key: "general",
    label: "General Information",
    blurb: "Common questions about usage and reliability.",
    faqs: [
      {
        question: "Is this service free to use?",
        answer:
          "Yes, the platform is completely free for commuters to check train delays and plan journeys."
      },
      {
        question: "How reliable is the information shown?",
        answer:
          "The information is based on live operational data and updated frequently, but actual conditions may vary due to real-world factors."
      },
      {
        question: "Who can I contact if I notice incorrect information?",
        answer:
          "You can report issues or share feedback through the Contact page, and our team will review it promptly."
      }
    ]
  }
] as const;

type CategoryKey = (typeof categories)[number]["key"];

export default function FaqPage(): ReactElement {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(categories[0].key);

  const currentCategory = useMemo(
    () => categories.find((category) => category.key === activeCategory) ?? categories[0],
    [activeCategory]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "3rem 1.5rem 4rem",
        background: "linear-gradient(140deg, #dbeafe 0%, #eff6ff 50%, #e0e7ff 100%)",
        display: "flex",
        justifyContent: "center"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1080px",
          background: "#ffffff",
          borderRadius: "32px",
          border: "1px solid #dbeafe",
          padding: "3rem",
          boxShadow: "0 40px 90px rgba(15, 23, 42, 0.15)",
          color: "#0f1c2e"
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.2em", color: "#0f3a7d", fontWeight: 600 }}>
            Need Answers?
          </p>
          <h1 style={{ fontSize: "2.5rem", margin: "0.5rem 0 1rem" }}>Frequently Asked Questions</h1>
          <p style={{ color: "#475569", maxWidth: "640px", margin: "0 auto" }}>
            Browse by category to find laser-focused guidance on operations, rider tools, integrations, and platform security.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            marginBottom: "2.5rem"
          }}
        >
          {categories.map((category) => {
            const isActive = category.key === activeCategory;
            return (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                style={{
                  borderRadius: "18px",
                  border: "1px solid",
                  borderColor: isActive ? "#0f3a7d" : "#c7d7ff",
                  background: isActive ? "linear-gradient(120deg, #0f3a7d, #1e5ba8)" : "#f8fbff",
                  color: isActive ? "#ffffff" : "#1f2937",
                  padding: "1rem 1.2rem",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 18px 45px rgba(37, 99, 235, 0.25)" : "0 12px 30px rgba(15, 23, 42, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem"
                }}
              >
                <span style={{ fontWeight: 700 }}>{category.label}</span>
                <span style={{ fontSize: "0.9rem", color: isActive ? "rgba(255,255,255,0.85)" : "#475569" }}>
                  {category.blurb}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            background: "#f8fbff",
            borderRadius: "24px",
            border: "1px solid #dbeafe",
            padding: "2.25rem",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
            display: "grid",
            gap: "1.25rem"
          }}
        >
          <div>
            <p style={{ color: "#0f3a7d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
              {currentCategory.label}
            </p>
            <h2 style={{ margin: "0.35rem 0 0", fontSize: "1.5rem" }}>Top questions</h2>
          </div>

          {currentCategory.faqs.map((faq) => (
            <article
              key={faq.question}
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                border: "1px solid #dbeafe",
                padding: "1.5rem",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                transition: "transform 150ms ease, box-shadow 150ms ease"
              }}
            >
              <h3 style={{ margin: 0 }}>{faq.question}</h3>
              <p style={{ margin: "0.75rem 0 0", color: "#475569" }}>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
