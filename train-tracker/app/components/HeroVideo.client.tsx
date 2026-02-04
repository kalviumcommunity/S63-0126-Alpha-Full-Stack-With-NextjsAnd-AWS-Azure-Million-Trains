"use client";

import React, { useEffect, useRef } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [rotation] = React.useState(0);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    try {
      vid.playbackRate = 0.99;
    } catch (e) {
      // ignore if browser disallows changing playbackRate before metadata
    }

    return () => {
      // cleanup
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
      {/* Video Background Only - No Text, No Buttons */}
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        src="https://res.cloudinary.com/dbj6ocwoz/video/upload/q_100/v1769767101/209494_medium_sm3jwo.mp4"
        onError={(e) => {
          // Fallback to original Cloudinary URL
          const vid = e.currentTarget as HTMLVideoElement;
          console.warn("Video load failed, falling back to original Cloudinary URL.");
          const original = "https://res.cloudinary.com/dbj6ocwoz/video/upload/v1769767101/209494_medium_sm3jwo.mp4";
          if (vid.src !== original) {
            vid.src = original;
          }
        }}
        autoPlay
        muted
        playsInline
        loop
        onEnded={() => videoRef.current?.play()}
        aria-hidden={true}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          width: "auto",
          height: "auto",
          minWidth: "100vh",
          minHeight: "100vw",
          objectFit: "cover",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
