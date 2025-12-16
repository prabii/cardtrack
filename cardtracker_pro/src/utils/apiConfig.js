/**
 * Centralized API configuration
 * Handles environment detection for local, Vercel, and production deployments
 */

// Detect environment
const getApiBaseUrl = () => {
  // Priority 1: Use environment variable if set (for Vercel/production)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    // Ensure HTTPS for VPS IP (never allow HTTP in production)
    const apiUrl = envApiUrl.trim();
    if (apiUrl.includes('84.247.136.87') && apiUrl.startsWith('http://')) {
      console.warn('[API Config] HTTP detected for VPS IP, forcing HTTPS');
      return apiUrl.replace('http://', 'https://');
    }
    console.log('[API Config] Using VITE_API_URL:', apiUrl);
    return apiUrl;
  }

  // Priority 2: Check if running on localhost
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  
  if (isLocalhost) {
    console.log('[API Config] Detected localhost, using local API');
    return 'http://localhost:3003/api';
  }

  // Priority 3: Default to VPS API (ALWAYS HTTPS, never HTTP)
  console.log('[API Config] Using VPS API (84.247.136.87) - HTTPS');
  return 'https://84.247.136.87/api';
};

// Detect socket URL
export const getSocketUrl = () => {
  // Priority 1: Use environment variable if set
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (envSocketUrl) {
    // Ensure HTTPS for VPS IP (never allow HTTP in production)
    const socketUrl = envSocketUrl.trim();
    if (socketUrl.includes('84.247.136.87') && socketUrl.startsWith('http://')) {
      console.warn('[API Config] HTTP detected for VPS IP, forcing HTTPS');
      return socketUrl.replace('http://', 'https://');
    }
    return socketUrl;
  }

  // Priority 2: Check if running on localhost
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  
  if (isLocalhost) {
    return 'http://localhost:3003';
  }

  // Priority 3: Default to VPS socket URL (ALWAYS HTTPS, never HTTP)
  return 'https://84.247.136.87';
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

