import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  // Security Headers Configuration
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // HSTS (HTTP Strict Transport Security)
          // Forces HTTPS for 2 years, includes subdomains, eligible for preload list
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },

          // X-Frame-Options
          // Prevents clickjacking by disallowing iframe embedding
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          // X-Content-Type-Options
          // Prevents MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // X-XSS-Protection
          // Legacy XSS protection (modern browsers use CSP)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },

          // Referrer-Policy
          // Controls how much referrer information is sent
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // Permissions-Policy (formerly Feature-Policy)
          // Controls browser features and APIs
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },

          // Content Security Policy (CSP)
          // Prevents XSS, code injection, and other attacks
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "media-src 'self' https:",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },

          // X-DNS-Prefetch-Control
          // Controls DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },

          // Cross-Origin-Embedder-Policy
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },

          // Cross-Origin-Opener-Policy
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },

          // Cross-Origin-Resource-Policy
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
