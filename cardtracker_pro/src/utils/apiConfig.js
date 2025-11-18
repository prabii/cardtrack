/**
 * Centralized API configuration
 * Handles environment detection for local, Vercel, and production deployments
 */

// Detect environment
const getApiBaseUrl = () => {
  // Priority 1: Use environment variable if set (for Vercel/production)
  if (import.meta.env.VITE_API_URL) {
    console.log('[API Config] Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // Priority 2: Check if running on localhost
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  
  if (isLocalhost) {
    console.log('[API Config] Detected localhost, using local API');
    return 'http://localhost:3003/api';
  }

  // Priority 3: Default to production API
  console.log('[API Config] Using production API (cardtrack.onrender.com)');
  return 'https://cardtrack.onrender.com/api';
};

// Detect socket URL
export const getSocketUrl = () => {
  // Priority 1: Use environment variable if set
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // Priority 2: Check if running on localhost
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  
  if (isLocalhost) {
    return 'http://localhost:3003';
  }

  // Priority 3: Default to production socket URL
  return 'https://cardtrack.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Log configuration for debugging
console.log('[API Config] Environment:', import.meta.env.MODE);
console.log('[API Config] Hostname:', window.location.hostname);
console.log('[API Config] API Base URL:', API_BASE_URL);
console.log('[API Config] Socket URL:', getSocketUrl());
console.log('[API Config] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[API Config] VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);

export default API_BASE_URL;

