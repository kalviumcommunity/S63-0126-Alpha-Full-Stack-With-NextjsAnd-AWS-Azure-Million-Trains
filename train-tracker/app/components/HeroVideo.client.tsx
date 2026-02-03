"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroVideo() {
  const router = useRouter();
  const [showText, setShowText] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // No rotation: render the video normally (0°)
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handlePlay = () => {
      // Slight delay so the text fades in "slowly" after playback starts
      setTimeout(() => setShowText(true), 400);
    };

    vid.addEventListener("play", handlePlay);
    // set a slightly slower playback rate for the foreground video
    try {
      vid.playbackRate = 0.99;
    } catch (e) {
      // ignore if browser disallows changing playbackRate before metadata
    }

    return () => {
      vid.removeEventListener("play", handlePlay);
    };
  }, []);

  return (
    <section
      aria-label="Hero video"
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
      {/* typing caret keyframes (used by the CTA) */}
      <style>{`
        @keyframes caretBlink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
      {/* Foreground-only video (rotated 270°). It fills the viewport and is rotated as requested. */}
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        src="https://res.cloudinary.com/dbj6ocwoz/video/upload/q_100/v1769767101/209494_medium_sm3jwo.mp4"
        onError={(e) => {
          // If the transformed Cloudinary URL fails (400/404), fall back to the original asset URL
          const vid = e.currentTarget as HTMLVideoElement;
          console.warn("Video load failed, falling back to original Cloudinary URL or local asset.");
          // try original (no q transform) first
          const original = "https://res.cloudinary.com/dbj6ocwoz/video/upload/v1769767101/209494_medium_sm3jwo.mp4";
          if (vid.src !== original) {
            vid.src = original;
            return;
          }
        //   // final fallback to local public asset if present
        //   if (vid.src !== "/Video-1.mp4") {
        //     vid.src = "/Video-1.mp4";
        //     vid.crossOrigin = undefined as any;
        //   }
        }}
        autoPlay
        muted
        playsInline
        loop
        onEnded={() => videoRef.current?.play()}
        aria-hidden={false}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          // make sure rotated video covers viewport
          width: "auto",
          height: "auto",
          minWidth: "100vh",
          minHeight: "100vw",
          objectFit: "cover",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Center overlay text */}
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        aria-label="Find Your Train — go to dashboard"
        style={{
          position: "relative",
          zIndex: 2,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
  {/* Typing CTA: letter-by-letter reveal + blinking caret. Keep button aria-label for screen readers. */}
  <TypingCTA show={showText} videoRef={videoRef} />
      </button>
    </section>
  );
}

function TypingCTA({ show, videoRef }: { show: boolean; videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const full = "Find Your Train";
  const [typed, setTyped] = useState("");
  const [caretVisible, setCaretVisible] = useState(false);
  const [color, setColor] = useState<string>("#fff");
  const intervalRef = useRef<number | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {

    // start typing when `show` becomes true. We'll loop the typing animation
    // (type -> pause -> clear -> repeat) as long as `show` stays true.
    if (!show) {
      setTyped("");
      setCaretVisible(false);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      return;
    }

    setTyped("");
    setCaretVisible(true);

    const charDelay = 70;
    const pauseAfter = 1400; // ms to show full text before restarting

    let idx = 0;

    const tick = () => {
      idx += 1;
      setTyped(full.slice(0, idx));
      if (idx >= full.length) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // keep the full text visible for a short pause, then restart typing
        restartTimeoutRef.current = window.setTimeout(() => {
          // reset and start again
          idx = 0;
          setTyped("");
          // ensure caret remains visible while typing restarts
          setCaretVisible(true);
          intervalRef.current = window.setInterval(tick, charDelay) as unknown as number;
          restartTimeoutRef.current = null;
        }, pauseAfter) as unknown as number;
      }
    };

    // start the interval
    intervalRef.current = window.setInterval(tick, charDelay) as unknown as number;

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
    };
  }, [show]);

  // sample the video's center region periodically and set a readable color derived from it
  useEffect(() => {
    let sampler: number | null = null;
    const sample = () => {
      const v = videoRef?.current;
      if (!v || v.readyState < 2) return;
      const vw = v.videoWidth || 0;
      const vh = v.videoHeight || 0;
      if (!vw || !vh) return;

      const box = Math.min(120, vw, vh);
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const c = canvasRef.current;
      c.width = box;
      c.height = box;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const sx = Math.floor((vw - box) / 2);
      const sy = Math.floor((vh - box) / 2);
      try {
        ctx.drawImage(v, sx, sy, box, box, 0, 0, box, box);
      } catch (e) {
        return;
      }
      const img = ctx.getImageData(0, 0, box, box).data;
      let r = 0,
        g = 0,
        b = 0;
      const len = img.length / 4;
      for (let i = 0; i < img.length; i += 4) {
        r += img[i];
        g += img[i + 1];
        b += img[i + 2];
      }
      r = Math.round(r / len);
      g = Math.round(g / len);
      b = Math.round(b / len);
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      let outR: number, outG: number, outB: number;
      if (lum < 0.5) {
        // lighten toward white for readability
        outR = Math.round(r + (255 - r) * 0.65);
        outG = Math.round(g + (255 - g) * 0.65);
        outB = Math.round(b + (255 - b) * 0.65);
      } else {
        // darken a bit for contrast
        outR = Math.round(r * 0.75);
        outG = Math.round(g * 0.75);
        outB = Math.round(b * 0.75);
      }
      const finalColor = `rgb(${outR}, ${outG}, ${outB})`;
      setColor(finalColor);
      // Expose the sampled color as a CSS variable for cross-component theming
      try {
        document.documentElement.style.setProperty('--accent', finalColor);
        const accLum = (0.2126 * outR + 0.7152 * outG + 0.0722 * outB) / 255;
        const accentText = accLum < 0.5 ? '#ffffff' : '#0f172a';
        document.documentElement.style.setProperty('--accent-contrast', accentText);
      } catch (e) {
        // In non-DOM environments this will fail silently
      }
    };

    if (show) {
      sample();
      sampler = window.setInterval(sample, 900);
    }

    return () => {
      if (sampler) window.clearInterval(sampler);
    };
  }, [show, videoRef]);

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.5rem",
        // remove the semi-transparent background per request
        background: "transparent",
        color: "#fff",
        fontWeight: 600,
        fontSize: "clamp(20px, 3.5vw, 40px)",
        textAlign: "center",
        willChange: "transform, opacity",
        // keep a subtle text shadow so the text stays readable on varied backgrounds
        textShadow: "0 2px 8px rgba(0,0,0,0.7)",
        pointerEvents: "auto",
      }}
    >
  <span aria-hidden style={{ color }}>{typed}</span>
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 12,
          marginLeft: 6,
          background: "transparent",
          animation: caretVisible ? "caretBlink 800ms steps(1,start) infinite" : "none",
          opacity: caretVisible ? 1 : 0,
        }}
      >
        <svg width="12" height="24" viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="2" width="4" height="20" rx="2" fill="white" opacity="0.95" />
        </svg>
      </span>
    </span>
  );
}
