"use client";

import React from "react";
import Link from "next/link";

export default function HeroVideo() {
  return (
    <section
      aria-label="Hero image"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Image Background Only - No Text, No Buttons */}
      <img
        src="https://res.cloudinary.com/dbj6ocwoz/image/upload/v1770273562/killian-pham-CWP8X2U2lu8-unsplash_law5eb.jpg"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          console.warn("Image load failed, falling back to original Cloudinary URL.");
          const original = "https://res.cloudinary.com/dbj6ocwoz/image/upload/v1770273562/killian-pham-CWP8X2U2lu8-unsplash_law5eb.jpg";
          if (img.src !== original) {
            img.src = original;
          }
        }}
        alt="Hero background"
        aria-hidden={true}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "auto",
          height: "auto",
          minWidth: "100vw",
          minHeight: "100vh",
          objectFit: "cover",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <style>{`
        .hero-btn {
          transition: color 200ms ease, background 200ms ease, border-color 200ms ease;
        }

        .hero-btn.primary:hover {
          background: transparent !important;
          color: #ffffff !important;
          border-color: #ffffff !important;
        }

        .hero-btn.secondary:hover {
          background: #ffffff !important;
          color: #0f1c2e !important;
          border-color: #ffffff !important;
        }
      `}</style>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          color: "#ffffff",
          maxWidth: "900px",
          padding: "0 20px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "50px",
            fontWeight: 500,
            letterSpacing: "0.5px",
            //WebkitTextStroke: "1px #ffffff",
            fontFamily: 'calibri',
            textShadow: "  0 14px 44px rgba(0, 0, 0, 1)"

          }}
        >
          Real-Time Train Tracking Made Simple
        </p>
        <h1
          style={{
            margin: "16px 0 24px",
            fontSize: "35px",
            fontWeight: 400,
            lineHeight: 1.3,
            //WebkitTextStroke: "1px #070707",
            textShadow: "0 8px 24px rgba(0, 0, 0, 0.85)",

          }}
        >
          Get live delay updates, platform information, and track any train across India instantly.
        </h1>
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/dashboard"
            className="hero-btn primary"
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "999px",
              border: "3px solid #ffffff",
              cursor: "pointer",
              background: "#ffffff",
              color: "#0f1c2e",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Start Tracking
          </Link>
          <Link
            href="/about"
            className="hero-btn secondary"
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "999px",
              border: "3px solid #ffffff",
              cursor: "pointer",
              background: "transparent",
              color: "#ffffff",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textShadow: "  0 14px 44px rgba(0, 0, 0, 1)"
            }}
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
