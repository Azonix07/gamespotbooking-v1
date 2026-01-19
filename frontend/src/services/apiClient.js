/**
 * Central API Client
 * Handles ALL backend communication
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://gamespotbooking-v1-production.up.railway.app";

console.log('[apiClient] Using API URL:', API_BASE_URL);

export const apiFetch = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path}`;
  
  console.log('[apiClient] Request:', {
    url,
    method: options.method || 'GET',
    credentials: 'include'
  });
  
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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
