/**
 * Centralized API Configuration
 * All frontend API calls should use this base URL
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

/**
 * Helper to build full API URLs
 * @example apiUrl('/users') → 'https://productifyai-api.onrender.com/api/users'
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

