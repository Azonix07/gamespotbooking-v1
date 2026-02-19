/**
 * Central API Client (Security-Hardened) — Next.js Version
 * Handles ALL backend communication with JWT + HttpOnly cookies.
 * 
 * Uses relative URLs on the client (proxied through Next.js rewrites to avoid CORS)
 * Falls back to direct backend URL for server-side rendering
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gamespotbooking-v1-production.up.railway.app';

// On the client (browser), use relative URLs so requests go through the Next.js proxy → no CORS.
// On the server (SSR), we must use the full backend URL directly.
const API_BASE_URL = typeof window !== 'undefined' ? '' : BACKEND_URL;

// In-memory token store (NOT accessible to XSS attacks)
let _accessToken: string | null = null;
let _isRefreshing = false;
let _refreshPromise: Promise<boolean> | null = null;

export const setAccessToken = (token: string | null) => {
  _accessToken = token;
  try {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('gamespot_auth_token', token);
      } else {
        localStorage.removeItem('gamespot_auth_token');
      }
    }
  } catch (e) { /* SSR or storage full */ }
};

export const getAuthToken = (): string | null => {
  if (_accessToken) return _accessToken;
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gamespot_auth_token');
    }
  } catch (e) {}
  return null;
};

export const clearTokens = () => {
  _accessToken = null;
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gamespot_auth_token');
    }
  } catch (e) { /* ignore */ }
};

const refreshAccessToken = async (): Promise<boolean> => {
  if (_isRefreshing) return _refreshPromise!;

  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiFetch = async (path: string, options: RequestInit = {}, _isRetry = false, _networkRetries = 3): Promise<any> => {
  const url = `${API_BASE_URL}${path}`;
  const token = getAuthToken();

  // Only set Content-Type for requests with a body to avoid unnecessary CORS preflight on GET
  const method = (options.method || 'GET').toUpperCase();
  const needsContentType = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers: Record<string, string> = {
    ...(needsContentType ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isAuthPath = path.includes('/auth/');
  const isForgotPassword = path.includes('/forgot-password') || path.includes('/reset-password') || path.includes('/verify-reset-otp');
  const timeoutMs = isForgotPassword ? 50000 : isAuthPath ? 30000 : 40000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      if (_networkRetries > 0) {
        await delay(1500 + (3 - _networkRetries) * 1000);
        return apiFetch(path, options, _isRetry, _networkRetries - 1);
      }
      throw new Error('Request timed out. The server may be starting up — please try again in a moment.');
    }
    // Retry on network errors (DNS failures, connection resets, CORS blocks, etc.)
    if (_networkRetries > 0) {
      await delay(2000 + (3 - _networkRetries) * 1500);
      return apiFetch(path, options, _isRetry, _networkRetries - 1);
    }
    throw new Error('Unable to connect to the server. Please try again.');
  }
  clearTimeout(timeoutId);

  // Retry on 502/503/504 (server temporarily down / Railway cold start)
  if ([502, 503, 504].includes(response.status) && _networkRetries > 0) {
    await delay(2000);
    return apiFetch(path, options, _isRetry, _networkRetries - 1);
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (!_isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch(path, options, true);
      }
    }
    clearTokens();
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/contact', '/games', '/updates', '/membership', '/get-offers', '/booking', '/rental', '/college-setup', '/feedback', '/invite'];
      if (!publicPaths.includes(currentPath) && data.redirect) {
        window.location.href = '/login';
        return data;
      }
    }
  }

  if (response.status === 429) {
    throw new Error(data.error || 'Too many requests. Please try again later.');
  }

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};
