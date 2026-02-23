/**
 * Secure Token Storage and Cookie Management
 * Handles HTTP-only cookie storage for refresh tokens and session management
 */

import { cookies } from "next/headers";

// Cookie configuration for security
const COOKIE_CONFIG = {
  refreshToken: {
    name: "refreshToken",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true, // Not accessible to JavaScript (prevents XSS)
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict" as const, // CSRF protection
    path: "/"
  },
  accessToken: {
    name: "accessToken",
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/"
  },
  sessionId: {
    name: "sessionId",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/"
  }
};

/**
 * Set refresh token in HTTP-only cookie
 * Called after successful login
 */
export async function setRefreshTokenCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      COOKIE_CONFIG.refreshToken.name,
      token,
      {
        maxAge: COOKIE_CONFIG.refreshToken.maxAge,
        httpOnly: COOKIE_CONFIG.refreshToken.httpOnly,
        secure: COOKIE_CONFIG.refreshToken.secure,
        sameSite: COOKIE_CONFIG.refreshToken.sameSite,
        path: COOKIE_CONFIG.refreshToken.path
      }
    );
  } catch (error) {
    console.error("Failed to set refresh token cookie:", error);
    throw error;
  }
}

/**
 * Set access token in HTTP-only cookie
 * Optional: Can store in memory/SWR instead for more security
 */
export async function setAccessTokenCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      COOKIE_CONFIG.accessToken.name,
      token,
      {
        maxAge: COOKIE_CONFIG.accessToken.maxAge,
        httpOnly: COOKIE_CONFIG.accessToken.httpOnly,
        secure: COOKIE_CONFIG.accessToken.secure,
        sameSite: COOKIE_CONFIG.accessToken.sameSite,
        path: COOKIE_CONFIG.accessToken.path
      }
    );
  } catch (error) {
    console.error("Failed to set access token cookie:", error);
    throw error;
  }
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshTokenCookie(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_CONFIG.refreshToken.name);
    return token?.value;
  } catch (error) {
    console.error("Failed to get refresh token cookie:", error);
    return undefined;
  }
}

/**
 * Get access token from cookie
 */
export async function getAccessTokenCookie(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_CONFIG.accessToken.name);
    return token?.value;
  } catch (error) {
    console.error("Failed to get access token cookie:", error);
    return undefined;
  }
}

/**
 * Clear all auth cookies (logout)
 */
export async function clearAuthCookies(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_CONFIG.refreshToken.name);
    cookieStore.delete(COOKIE_CONFIG.accessToken.name);
    cookieStore.delete(COOKIE_CONFIG.sessionId.name);
  } catch (error) {
    console.error("Failed to clear auth cookies:", error);
    throw error;
  }
}

/**
 * Get all token cookies for verification
 */
export async function getAuthCookies(): Promise<{
  accessToken?: string;
  refreshToken?: string;
}> {
  try {
    const cookieStore = await cookies();
    return {
      accessToken: cookieStore.get(COOKIE_CONFIG.accessToken.name)?.value,
      refreshToken: cookieStore.get(COOKIE_CONFIG.refreshToken.name)?.value
    };
  } catch (error) {
    console.error("Failed to get auth cookies:", error);
    return {};
  }
}

/**
 * Set session ID for tracking
 */
export async function setSessionIdCookie(sessionId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      COOKIE_CONFIG.sessionId.name,
      sessionId,
      {
        maxAge: COOKIE_CONFIG.sessionId.maxAge,
        httpOnly: COOKIE_CONFIG.sessionId.httpOnly,
        secure: COOKIE_CONFIG.sessionId.secure,
        sameSite: COOKIE_CONFIG.sessionId.sameSite,
        path: COOKIE_CONFIG.sessionId.path
      }
    );
  } catch (error) {
    console.error("Failed to set session ID cookie:", error);
    throw error;
  }
}

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY_MINUTES: 15,
  REFRESH_TOKEN_EXPIRY_DAYS: 7
};
