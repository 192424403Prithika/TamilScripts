/**
 * API configuration helper for TamilScript AI.
 * Uses VITE_API_URL when set (e.g. in production on Render),
 * or falls back to relative paths for local development proxy.
 */
const rawEnv = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env;
export const API_BASE_URL = (rawEnv?.VITE_API_URL || '').replace(/\/+$/, '');

export function apiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}
