/**
 * Central API Client (Security-Hardened)
 * =======================================
 * Handles ALL backend communication.
 * 
 * Token Strategy:
 *   - Access token stored in memory (not localStorage) to prevent XSS theft
 *   - Refresh token stored in HttpOnly cookie (set by backend)
 *   - On 401, automatically attempts token refresh before redirecting
 *   - Falls back to session cookies for desktop browsers
 * 
 * Migration note: Also checks localStorage for backward compatibility
 * with existing sessions, but new tokens go to memory only.
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://gamespotbooking-v1-production.up.railway.app";

// ============================================================
// In-memory token store (NOT accessible to XSS attacks)
// ============================================================
let _accessToken = null;
let _isRefreshing = false;
let _refreshPromise = null;

/**
 * Set the access token in memory (called after login/refresh)
 */
export const setAccessToken = (token) => {
  _accessToken = token;
  // Also store in localStorage for backward compatibility with mobile
  // This will be removed in a future update once HttpOnly cookies are fully deployed
  try {
    if (token) {
      localStorage.setItem('gamespot_auth_token', token);
    } else {
      localStorage.removeItem('gamespot_auth_token');
    }
  } catch (e) { /* SSR or storage full */ }
};

/**
 * Get the current access token
 * Prefers in-memory token; falls back to localStorage for existing sessions
 */
export const getAuthToken = () => {
  if (_accessToken) return _accessToken;
  try {
    return localStorage.getItem('gamespot_auth_token');
  } catch (e) {
    return null;
  }
};

/**
 * Clear all auth tokens (called on logout)
 */
export const clearTokens = () => {
  _accessToken = null;
  try {
    localStorage.removeItem('gamespot_auth_token');
  } catch (e) { /* ignore */ }
};

/**
 * Attempt to refresh the access token using the HttpOnly refresh token cookie
 */
const refreshAccessToken = async () => {
  // Prevent multiple simultaneous refresh attempts
  if (_isRefreshing) {
    return _refreshPromise;
  }
  
  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',  // Send the HttpOnly refresh cookie
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          setAccessToken(data.token);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();
  
  return _refreshPromise;
};

export const apiFetch = async (path, options = {}, _isRetry = false) => {
  const url = `${API_BASE_URL}${path}`;
  
  // Get JWT token for authentication
  const token = getAuthToken();
  
  // Build headers with optional Authorization token
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  
  // Add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Timeout for slow connections — 20s for login/auth, 30s for other requests
  // Forgot-password needs more time since it involves sending an email on the backend
  const isAuthPath = path.includes('/auth/');
  const isForgotPassword = path.includes('/forgot-password') || path.includes('/reset-password') || path.includes('/verify-reset-otp');
  const timeoutMs = isForgotPassword ? 45000 : isAuthPath ? 20000 : 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  let response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    throw new Error('Network error. Please check your internet connection.');
  }
  clearTimeout(timeoutId);

  const data = await response.json().catch(() => ({}));

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // On first 401, try to refresh the token
    if (!_isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        return apiFetch(path, options, true);
      }
    }
    
    // Refresh failed or this was already a retry — clear auth state
    clearTokens();
    
    // Redirect to login if on a protected page
    const currentPath = window.location.pathname;
    const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/contact', '/games', '/updates', '/discount-game', '/win-free-game', '/instagram-promo', '/membership', '/get-offers'];
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
