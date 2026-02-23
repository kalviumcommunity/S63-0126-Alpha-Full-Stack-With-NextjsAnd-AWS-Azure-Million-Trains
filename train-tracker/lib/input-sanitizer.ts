/**
 * Input Sanitization Utilities
 * OWASP-compliant input sanitization to prevent XSS, injection attacks, and malicious data
 * 
 * Security Principles:
 * 1. Never trust user input
 * 2. Sanitize on input (server-side)
 * 3. Encode on output (client-side)
 * 4. Use allow-lists, not deny-lists
 */

import sanitizeHtml from 'sanitize-html';
import validator from 'validator';
import { filterXSS, IFilterXSSOptions } from 'xss';

/**
 * Sanitization levels for different contexts
 */
export enum SanitizationLevel {
  STRICT = 'strict',       // No HTML allowed (plain text only)
  BASIC = 'basic',         // Basic formatting only (b, i, p, br)
  MODERATE = 'moderate',   // Common tags (headings, lists, links)
  RICH = 'rich',           // Rich content (images, videos, code blocks)
}

/**
 * Strict sanitization - strips ALL HTML tags
 * Use for: usernames, email subjects, search queries, file names
 */
export function sanitizeStrict(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all HTML tags
  const cleaned = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });

  // Trim and normalize whitespace
  return cleaned.trim().replace(/\s+/g, ' ');
}

/**
 * Basic sanitization - allows minimal formatting
 * Use for: comments, short descriptions, chat messages
 */
export function sanitizeBasic(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}

/**
 * Moderate sanitization - allows common formatting
 * Use for: blog posts, forum posts, product descriptions
 */
export function sanitizeModerate(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeHtml(input, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'b', 'i', 'em', 'strong', 'u', 's',
      'a', 'blockquote', 'code', 'pre',
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName: string, attribs: any) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            rel: 'noopener noreferrer', // Security: prevent window.opener access
            target: attribs.target === '_blank' ? '_blank' : '',
          },
        };
      },
    },
  });
}

/**
 * Rich sanitization - allows rich content with media
 * Use for: article content, documentation, user-generated HTML
 */
export function sanitizeRich(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeHtml(input, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'audio', 'iframe']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'video': ['src', 'controls', 'width', 'height'],
      'audio': ['src', 'controls'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
      'a': ['href', 'title', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com', 'www.youtube-nocookie.com'],
    transformTags: {
      'a': (tagName: string, attribs: any) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            rel: 'noopener noreferrer',
            target: attribs.target === '_blank' ? '_blank' : '',
          },
        };
      },
    },
  });
}

/**
 * Sanitize based on specified level
 */
export function sanitize(input: string, level: SanitizationLevel = SanitizationLevel.BASIC): string {
  switch (level) {
    case SanitizationLevel.STRICT:
      return sanitizeStrict(input);
    case SanitizationLevel.BASIC:
      return sanitizeBasic(input);
    case SanitizationLevel.MODERATE:
      return sanitizeModerate(input);
    case SanitizationLevel.RICH:
      return sanitizeRich(input);
    default:
      return sanitizeBasic(input);
  }
}

/**
 * XSS-specific protection using xss library
 * Provides additional layer of defense
 */
export function preventXSS(input: string, options?: IFilterXSSOptions): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return filterXSS(input, options);
}

/**
 * Validate and sanitize email addresses
 * OWASP recommendation: Validate format + sanitize
 */
export function sanitizeEmail(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim().toLowerCase();

  // Validate email format
  if (!validator.isEmail(trimmed)) {
    return null;
  }

  // Normalize email (remove +aliases, normalize domain)
  return validator.normalizeEmail(trimmed) || trimmed;
}

/**
 * Validate and sanitize URLs
 * Prevents javascript:, data:, and other dangerous protocols
 */
export function sanitizeURL(input: string, allowedProtocols: string[] = ['http', 'https']): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // Validate URL format
  if (!validator.isURL(trimmed, {
    protocols: allowedProtocols,
    require_protocol: true,
    require_valid_protocol: true,
  })) {
    return null;
  }

  // Additional check: ensure no dangerous protocols slipped through
  try {
    const url = new URL(trimmed);
    if (!allowedProtocols.includes(url.protocol.replace(':', ''))) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize file names to prevent directory traversal
 * Removes: ../, ..\, absolute paths, special characters
 */
export function sanitizeFileName(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove path traversal attempts
  let cleaned = input
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '_')
    .replace(/^[.]+/, '');

  // Remove dangerous characters
  cleaned = cleaned.replace(/[<>:"|?*\x00-\x1F]/g, '');

  // Limit length
  cleaned = cleaned.substring(0, 255);

  // Ensure not empty after sanitization
  return cleaned.trim() || 'unnamed_file';
}

/**
 * Sanitize numbers (prevent NaN injection, ensure bounds)
 */
export function sanitizeNumber(
  input: unknown,
  options: { min?: number; max?: number; defaultValue?: number } = {}
): number {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, defaultValue = 0 } = options;

  const num = Number(input);

  // Check if valid number
  if (!Number.isFinite(num)) {
    return defaultValue;
  }

  // Enforce bounds
  return Math.max(min, Math.min(max, num));
}

/**
 * Sanitize boolean (prevent injection of truthy strings)
 */
export function sanitizeBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }

  if (typeof input === 'number') {
    return input !== 0;
  }

  return false;
}

/**
 * Sanitize JSON to prevent prototype pollution
 */
export function sanitizeJSON<T = unknown>(input: string, defaultValue: T | null = null): T | null {
  if (!input || typeof input !== 'string') {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(input);

    // Check for prototype pollution attempts
    if (parsed && typeof parsed === 'object') {
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        console.warn('[Security] Potential prototype pollution attempt detected');
        return defaultValue;
      }
    }

    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Sanitize SQL-like strings (for search queries, etc.)
 * Note: If using Prisma/ORMs, parameterized queries already prevent SQLi
 */
export function sanitizeLikePattern(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Escape special SQL LIKE characters
  return input
    .replace(/[%_\\]/g, '\\$&')
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Comprehensive input sanitizer with validation
 * Returns sanitized value + validation status
 */
export interface SanitizationResult<T = string> {
  value: T;
  isValid: boolean;
  originalValue: unknown;
  warnings: string[];
}

export interface SanitizationRules {
  type: 'string' | 'email' | 'url' | 'number' | 'boolean' | 'filename';
  level?: SanitizationLevel;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export function sanitizeWithValidation(
  input: unknown,
  rules: SanitizationRules
): SanitizationResult {
  const warnings: string[] = [];
  let value: unknown = input;
  let isValid = true;

  // Check required
  if (rules.required && (input === null || input === undefined || input === '')) {
    warnings.push('Field is required');
    isValid = false;
  }

  // Sanitize based on type
  switch (rules.type) {
    case 'string': {
      const str = String(input || '');
      value = sanitize(str, rules.level);

      if (rules.minLength && (value as string).length < rules.minLength) {
        warnings.push(`Minimum length is ${rules.minLength}`);
        isValid = false;
      }

      if (rules.maxLength && (value as string).length > rules.maxLength) {
        warnings.push(`Maximum length is ${rules.maxLength}`);
        value = (value as string).substring(0, rules.maxLength);
      }

      if (rules.pattern && !rules.pattern.test(value as string)) {
        warnings.push('Invalid format');
        isValid = false;
      }
      break;
    }

    case 'email': {
      value = sanitizeEmail(String(input || ''));
      if (value === null) {
        warnings.push('Invalid email format');
        isValid = false;
        value = '';
      }
      break;
    }

    case 'url': {
      value = sanitizeURL(String(input || ''));
      if (value === null) {
        warnings.push('Invalid URL format');
        isValid = false;
        value = '';
      }
      break;
    }

    case 'number': {
      value = sanitizeNumber(input);
      break;
    }

    case 'boolean': {
      value = sanitizeBoolean(input);
      break;
    }

    case 'filename': {
      value = sanitizeFileName(String(input || ''));
      if (value === 'unnamed_file') {
        warnings.push('Invalid filename provided');
      }
      break;
    }
  }

  return {
    value: value as any,
    isValid,
    originalValue: input,
    warnings,
  };
}

/**
 * Remove potentially dangerous characters from headers
 */
export function sanitizeHeader(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove newlines and carriage returns (prevent header injection)
  return input
    .replace(/[\r\n]/g, '')
    .trim()
    .substring(0, 1000); // Limit header length
}

/**
 * Security logger for sanitization events
 */
export function logSanitization(context: {
  input: unknown;
  output: unknown;
  type: string;
  warnings?: string[];
  userId?: string;
  path?: string;
}) {
  if (context.warnings && context.warnings.length > 0) {
    console.warn('[Sanitization Warning]', {
      type: context.type,
      warnings: context.warnings,
      userId: context.userId,
      path: context.path,
      timestamp: new Date().toISOString(),
      // Don't log sensitive data
      hasInput: Boolean(context.input),
      hasOutput: Boolean(context.output),
    });
  }
}
