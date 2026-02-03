"use client";

import React from "react";

export default function BackgroundMedia({
  videoSrc,
  posterSrc,
  imageSrc,
}: {
  videoSrc?: string;
  posterSrc?: string;
  imageSrc?: string;
}) {
  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = 'none';
            console.warn('BackgroundMedia: image failed to load, hiding element');
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "brightness(0.52) saturate(1.02) contrast(0.94)",
            transform: "translateZ(0)",
          }}
        />
      ) : (
        <video
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={(e) => {
            const v = e.currentTarget as HTMLVideoElement;
            try {
              const srcAttr = v.getAttribute('src') || '';
              // If a custom named file isn't found, fall back to a known local asset
              if (!srcAttr.endsWith('/Video-1.mp4') && srcAttr !== '/Video-1.mp4') {
                v.src = '/Video-1.mp4';
                console.warn('BackgroundMedia: primary video failed, falling back to /Video-1.mp4');
                return;
              }
            } catch (err) {
              // ignore
            }
            // final fallback: hide the video so the underlying surface gradient/poster shows
            v.style.display = 'none';
            console.warn('BackgroundMedia: video unavailable, hiding element');
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "brightness(0.52) saturate(1.02) contrast(0.94)",
            transform: "translateZ(0)",
          }}
        />
      )}

      {/* soft overlay to keep content readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 45%, rgba(3,7,18,0.18) 0%, rgba(3,7,18,0.06) 35%, rgba(3,7,18,0.26) 100%), linear-gradient(rgba(3,7,18,0.06), rgba(3,7,18,0.24))",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          video { display: none !important; }
        }
        @media (max-width: 720px) {
          video { display: none !important; }
        }
      `}</style>
    </div>
  );
}
