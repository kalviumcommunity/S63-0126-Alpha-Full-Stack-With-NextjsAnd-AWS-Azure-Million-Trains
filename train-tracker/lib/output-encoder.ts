/**
 * Output Encoding Utilities
 * OWASP-compliant output encoding to prevent XSS when displaying user content
 * 
 * Security Principle: "Encode on Output"
 * Even if input is sanitized, always encode when rendering to prevent context-specific XSS
 */

'use client';

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';



/**
 * HTML Entity Encoding
 * Converts special characters to HTML entities
 */
export function encodeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Decode HTML entities back to text
 * Use carefully - only when you need to reverse encoding
 */
export function decodeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.innerHTML = input;
  return div.textContent || '';
}

/**
 * JavaScript String Encoding
 * Encodes for safe insertion into JavaScript strings
 */
export function encodeJavaScript(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/</g, '\\x3C')
    .replace(/>/g, '\\x3E');
}

/**
 * URL Parameter Encoding
 * Encodes strings for safe use in URLs
 */
export function encodeURLParam(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return encodeURIComponent(input);
}

/**
 * CSS Encoding
 * Encodes for safe insertion into CSS
 */
export function encodeCSS(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>"']/g, (char) => {
      return '\\' + char.charCodeAt(0).toString(16) + ' ';
    });
}

/**
 * DOMPurify - Safe HTML rendering
 * Use when you need to render user-provided HTML safely
 */
export function sanitizeForRender(html: string, options?: Record<string, any>): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'b', 'i', 'em', 'strong', 'u', 's',
      'a', 'blockquote', 'code', 'pre',
      'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
    ...options,
  }) as string;
}

/**
 * Safe innerHTML alternative
 * Returns object for React's dangerouslySetInnerHTML
 */
export function createSafeHTML(html: string): { __html: string } {
  return {
    __html: sanitizeForRender(html),
  };
}

/**
 * Markdown to Safe HTML
 * If you're using markdown, sanitize the output
 */
export function markdownToSafeHTML(markdown: string): string {
  // This is a placeholder - integrate with your markdown library
  // Example with a markdown parser:
  // const rawHTML = marked(markdown);
  // return sanitizeForRender(rawHTML);
  
  return sanitizeForRender(markdown);
}

/**
 * Context-Aware Encoding
 * Automatically chooses encoding based on context
 */
export enum EncodingContext {
  HTML = 'html',
  JAVASCRIPT = 'javascript',
  URL = 'url',
  CSS = 'css',
}

export function encodeForContext(input: string, context: EncodingContext): string {
  switch (context) {
    case EncodingContext.HTML:
      return encodeHTML(input);
    case EncodingContext.JAVASCRIPT:
      return encodeJavaScript(input);
    case EncodingContext.URL:
      return encodeURLParam(input);
    case EncodingContext.CSS:
      return encodeCSS(input);
    default:
      return encodeHTML(input);
  }
}

/**
 * Safe attribute value
 * Use when setting HTML attributes dynamically
 */
export function encodeSafeAttribute(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove quotes and encode special characters
  return input
    .replace(/['"]/g, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * React-safe text component
 * Already safe by default, but provides explicit documentation
 */
export function SafeText({ children }: { children: string }): React.ReactElement {
  // React automatically escapes text content
  // This component serves as documentation that content is user-generated
  return React.createElement(React.Fragment, null, children);
}

/**
 * Safe HTML renderer component
 * Use instead of dangerouslySetInnerHTML
 */
export function SafeHTML({ html, className }: { html: string; className?: string }): React.ReactElement {
  return React.createElement('div', {
    className,
    dangerouslySetInnerHTML: createSafeHTML(html),
  });
}

/**
 * Strip all HTML tags (for display in plain text contexts)
 */
export function stripHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate text safely (maintains HTML integrity if present)
 */
export function safeTruncate(input: string, maxLength: number, suffix: string = '...'): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // If no HTML, simple truncate
  if (!/<[^>]+>/.test(input)) {
    return input.length > maxLength
      ? input.substring(0, maxLength - suffix.length) + suffix
      : input;
  }

  // If HTML present, strip tags first then truncate
  const stripped = stripHTML(input);
  return stripped.length > maxLength
    ? stripped.substring(0, maxLength - suffix.length) + suffix
    : stripped;
}

/**
 * Prevent clickjacking by encoding iframe sources
 */
export function encodeSafeIframeSrc(url: string, allowedDomains: string[] = []): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);
    
    // Check if domain is allowed
    const isAllowed = allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      console.warn('[Security] Iframe source blocked:', parsed.hostname);
      return null;
    }

    // Only allow https
    if (parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Security headers for responses
 * Use in API routes to set secure headers
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

/**
 * Content Security Policy Header
 * Customize based on your app's needs
 */
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for Next.js
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
