/**
 * Central API Client
 * Handles ALL backend communication
 * Supports both session cookies (desktop) and JWT tokens (mobile)
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://gamespotbooking-v1-production.up.railway.app";

console.log('[apiClient] Using API URL:', API_BASE_URL);

/**
 * Get JWT token from localStorage for mobile browsers
 * Mobile browsers block third-party cookies, so we use JWT tokens instead
 */
const getAuthToken = () => {
  try {
    return localStorage.getItem('gamespot_auth_token');
  } catch (e) {
    return null;
  }
};

export const apiFetch = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path}`;
  
  // Get JWT token for mobile authentication
  const token = getAuthToken();
  
  // Build headers with optional Authorization token
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  
  // Add Authorization header if we have a token (mobile browsers)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('[apiClient] Request:', {
    url,
    method: options.method || 'GET',
    credentials: 'include',
    hasToken: !!token
  });
  
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  console.log('[apiClient] Response:', {
    url,
    status: response.status,
    ok: response.ok,
    headers: {
      'set-cookie': response.headers.get('set-cookie'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[apiClient] Request failed:', { url, status: response.status, data });
    throw new Error(data.error || "API request failed");
  }

  console.log('[apiClient] Response data:', data);
  return data;
};
