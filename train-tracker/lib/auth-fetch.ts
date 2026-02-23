/**
 * Client-side Auth Wrapper with Automatic Token Refresh
 * Handles API requests with automatic access token refresh
 */

'use client';

import { useState, useCallback } from 'react';

export interface AuthError extends Error {
  code?: string;
  status?: number;
}

export interface FetchWithAuthOptions extends RequestInit {
  skipAuthRetry?: boolean; // Skip retry on 401 for specific endpoints
}

/**
 * Fetch wrapper that handles automatic token refresh
 * 
 * Usage:
 * ```tsx
 * const { fetchWithAuth } = useAuthFetch();
 * const response = await fetchWithAuth('/api/protected-route');
 * ```
 */
export function useAuthFetch() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  /**
   * Refresh the access token using refresh token
   * @returns New access token or null if refresh failed
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      setIsRefreshing(true);
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Important: Send cookies
      });
      
      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.accessToken) {
        // Store new access token in memory
        // You can also store in React Context or SWR cache
        console.log('[Auth] Access token refreshed successfully');
        return data.data.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('[Auth] Token refresh error:', error);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  
  /**
   * Fetch with automatic token refresh on 401
   * @param url - API endpoint
   * @param options - Fetch options
   * @returns Response
   */
  const fetchWithAuth = useCallback(async (
    url: string,
    options: FetchWithAuthOptions = {}
  ): Promise<Response> => {
    const { skipAuthRetry = false, ...fetchOptions } = options;
    
    // First attempt: Use existing token
    let response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include', // Send cookies
      headers: {
        ...fetchOptions.headers,
      }
    });
    
    // If 401 Unauthorized, try refreshing token
    if (response.status === 401 && !skipAuthRetry && !isRefreshing) {
      console.log('[Auth] 401 Unauthorized - attempting token refresh');
      
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        // Retry original request with new token
        console.log('[Auth] Retrying request with new access token');
        response = await fetch(url, {
          ...fetchOptions,
          credentials: 'include',
          headers: {
            ...fetchOptions.headers,
          }
        });
      } else {
        // Refresh failed - user needs to re-login
        console.error('[Auth] Token refresh failed - redirecting to login');
        
        // Optionally redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
      }
    }
    
    return response;
  }, [refreshAccessToken, isRefreshing]);
  
  return { fetchWithAuth, refreshAccessToken, isRefreshing };
}

/**
 * Simple helper for JSON API calls with auth
 */
export async function fetchJSONWithAuth<T = any>(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  
  if (!response.ok) {
    // Try to parse error message
    try {
      const errorData = await response.json();
      const error: AuthError = new Error(errorData.message || 'Request failed');
      error.code = errorData.code;
      error.status = response.status;
      throw error;
    } catch {
      const error: AuthError = new Error(`Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }
  }
  
  return response.json();
}
