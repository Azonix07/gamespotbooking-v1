/**
 * Central API Client
 * Handles ALL backend communication
 * Supports both session cookies (desktop) and JWT tokens (mobile)
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://gamespotbooking-v1-production.up.railway.app";

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
  
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await response.json().catch(() => ({}));

  // Handle 401 Unauthorized - clear stale auth state
  if (response.status === 401) {
    // Clear stored token if it's expired/invalid
    try {
      localStorage.removeItem('gamespot_auth_token');
    } catch (e) { /* ignore */ }
    
    // Redirect to login if on a protected page (not already on login/signup)
    const currentPath = window.location.pathname;
    const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/contact', '/games', '/updates', '/discount-game', '/win-free-game', '/instagram-promo'];
    if (!publicPaths.includes(currentPath) && data.redirect) {
      window.location.href = '/login';
      return data;
    }
  }

  // Handle 429 Too Many Requests - rate limited
  if (response.status === 429) {
    throw new Error(data.error || 'Too many requests. Please try again later.');
  }

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
};
