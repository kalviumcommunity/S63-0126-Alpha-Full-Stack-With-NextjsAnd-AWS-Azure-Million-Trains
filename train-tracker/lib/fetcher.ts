/**
 * SWR Fetcher Utility
 * 
 * This fetcher function is used with SWR to handle API requests.
 * It throws errors for non-OK responses, which SWR catches and exposes
 * through the error property.
 * 
 * Usage:
 * const { data, error, isLoading } = useSWR('/api/endpoint', fetcher);
 */

interface FetcherOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Basic fetcher for GET requests
 * @param url - The API endpoint to fetch
 * @returns Parsed JSON response
 * @throws Error if response is not ok
 */
export const fetcher = async (url: string): Promise<any> => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    // Attach extra info to the error object
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
};

/**
 * Advanced fetcher with options (POST, PUT, DELETE, etc.)
 * @param url - The API endpoint
 * @param options - Fetch options (method, headers, body)
 * @returns Parsed JSON response
 */
export const fetcherWithOptions = async (
  url: string,
  options?: FetcherOptions
): Promise<any> => {
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const error = new Error("API request failed");
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};

/**
 * Fetcher with authentication token
 * @param url - The API endpoint
 * @param token - JWT token for authentication
 * @returns Parsed JSON response
 */
export const authenticatedFetcher = async (
  url: string,
  token?: string
): Promise<any> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const error = new Error("Authentication failed or resource not found");
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};

/**
 * Helper to create a fetcher with pre-configured options
 * Useful for creating specialized fetchers for specific endpoints
 */
export const createFetcher = (defaultOptions?: FetcherOptions) => {
  return async (url: string, options?: FetcherOptions) => {
    return fetcherWithOptions(url, {
      ...defaultOptions,
      ...options,
    });
  };
};

/**
 * Type-safe fetcher with generic type support
 * @param url - The API endpoint
 * @returns Typed response data
 */
export async function typedFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
}

// Export types for convenience
export type { FetcherOptions };
