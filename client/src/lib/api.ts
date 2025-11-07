/**
 * Centralized API Configuration
 * 
 * All frontend API calls should use the base URL from this file.
 * This ensures the API URL is configured in one place.
 * 
 * Usage:
 * ```typescript
 * import { API_BASE_URL } from '@/lib/api';
 * 
 * const response = await fetch(`${API_BASE_URL}/api/users`);
 * ```
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

/**
 * Helper function to build API URLs
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Helper function for API fetch with base URL
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

