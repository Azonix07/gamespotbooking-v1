/**
 * AuthContext - Centralized Authentication State Management
 * Prevents redundant API calls and infinite loops
 * Mobile-optimized with localStorage backup for cookie timing issues
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../services/apiClient';

const AuthContext = createContext(null);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Flag to track recent login (prevents session check from clearing state)
let recentLoginTimestamp = 0;
const RECENT_LOGIN_GRACE_PERIOD = 10000; // 10 seconds grace period after login

// Track retry attempts to prevent infinite loops
let sessionRetryCount = 0;
const MAX_SESSION_RETRIES = 2;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs to prevent duplicate calls
  const checkInProgressRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const mountedRef = useRef(true);

  // Check session with caching and deduplication
  const checkSession = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Skip if check is already in progress
    if (checkInProgressRef.current) {
      console.log('[AuthContext] Session check already in progress, skipping');
      return { authenticated: isAuthenticated, user, isAdmin };
    }
    
    // Skip if we checked recently (within cache duration) and not forcing
    if (!force && (now - lastCheckTimeRef.current) < CACHE_DURATION && lastCheckTimeRef.current > 0) {
      console.log('[AuthContext] Using cached session data');
      return { authenticated: isAuthenticated, user, isAdmin };
    }
    
    // MOBILE FIX: If we just logged in, trust the auth state we already set
    const justLoggedIn = (now - recentLoginTimestamp) < RECENT_LOGIN_GRACE_PERIOD;
    if (justLoggedIn && isAuthenticated) {
      console.log('[AuthContext] Recently logged in, trusting current auth state');
      setLoading(false);
      lastCheckTimeRef.current = now; // Update cache time so we don't keep checking
      return { authenticated: true, user, isAdmin };
    }
    
    try {
      checkInProgressRef.current = true;
      // Don't set loading=true on subsequent checks to prevent flicker
      if (lastCheckTimeRef.current === 0) {
        setLoading(true);
      }
      console.log('[AuthContext] Checking session...', { force });
      
      const data = await apiFetch('/api/auth/check');
      
      console.log('[AuthContext] Session check response:', {
        authenticated: data.authenticated,
        userType: data.user_type,
        hasUser: !!data.user
      });
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return data;
      
      lastCheckTimeRef.current = now;
      sessionRetryCount = 0; // Reset retry count on successful check
      
      if (data.authenticated) {
        if (data.user_type === 'admin') {
          setIsAdmin(true);
          setUser({ name: data.user?.username || 'Admin', ...data.user });
        } else {
          setIsAdmin(false);
          setUser(data.user);
        }
        setIsAuthenticated(true);
        // Sync localStorage
        try {
          localStorage.setItem('gamespot_logged_in', 'true');
          localStorage.setItem('gamespot_user_type', data.user_type);
        } catch (e) {}
        console.log('[AuthContext] Session authenticated successfully');
      } else {
        // Session not authenticated - clear localStorage and state
        try {
          localStorage.removeItem('gamespot_logged_in');
          localStorage.removeItem('gamespot_user_type');
        } catch (e) {}
        setUser(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
        console.log('[AuthContext] No active session');
      }
      
      setError(null);
      return data;
      
    } catch (err) {
      console.error('[AuthContext] Session check error:', err);
      if (mountedRef.current) {
        // On error, just mark as not authenticated (don't keep retrying)
        setError(err.message);
        setUser(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
      }
      return { authenticated: false, user: null, isAdmin: false };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      checkInProgressRef.current = false;
    }
  }, [isAuthenticated, user, isAdmin]);

  // Login function
  const login = useCallback(async (identifier, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[AuthContext] Login attempt for:', identifier);
      
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: identifier, password })
      });
      
      console.log('[AuthContext] Login response:', { success: data.success, userType: data.user_type });
      
      if (data.success) {
        // MOBILE FIX: Mark this as a recent login to prevent session check from clearing state
        recentLoginTimestamp = Date.now();
        
        // MOBILE FIX: Set auth state immediately from login response
        // Don't wait for session check - mobile browsers have cookie timing issues
        if (data.user_type === 'admin') {
          setIsAdmin(true);
          setUser({ name: data.username || 'Admin' });
        } else {
          setIsAdmin(false);
          setUser(data.user || { name: identifier });
        }
        setIsAuthenticated(true);
        
        // MOBILE FIX: Store JWT token for API calls (mobile browsers block cookies)
        try {
          localStorage.setItem('gamespot_logged_in', 'true');
          localStorage.setItem('gamespot_user_type', data.user_type);
          if (data.token) {
            localStorage.setItem('gamespot_auth_token', data.token);
            console.log('[AuthContext] JWT token stored for mobile API calls');
          }
        } catch (e) {
          console.log('[AuthContext] localStorage not available');
        }
        
        // Update cache time to prevent immediate re-checking
        lastCheckTimeRef.current = Date.now();
        
        console.log('[AuthContext] Auth state set immediately from login response');
        
        return { success: true, userType: data.user_type };
      } else {
        console.error('[AuthContext] Login failed:', data.error);
        setError(data.error || 'Login failed');
        return { success: false, error: data.error };
      }
      
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    // Reset the login timestamp to allow session checks to clear state
    recentLoginTimestamp = 0;
    
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear state immediately
      setUser(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      lastCheckTimeRef.current = 0;
      
      // Clear localStorage indicators and JWT token
      try {
        localStorage.removeItem('gamespot_logged_in');
        localStorage.removeItem('gamespot_user_type');
        localStorage.removeItem('gamespot_auth_token');
      } catch (e) {
        console.log('[AuthContext] localStorage not available');
      }
    }
  }, []);

  // Signup function
  const signup = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (data.success) {
        // MOBILE FIX: Mark this as a recent login to prevent session check from clearing state
        recentLoginTimestamp = Date.now();
        
        // MOBILE FIX: Set auth state immediately from signup response
        setIsAdmin(false);
        setUser(data.user || { name: formData.name, email: formData.email });
        setIsAuthenticated(true);
        
        // Store login indicator in localStorage for mobile persistence
        try {
          localStorage.setItem('gamespot_logged_in', 'true');
          localStorage.setItem('gamespot_user_type', 'customer');
        } catch (e) {
          console.log('[AuthContext] localStorage not available');
        }
        
        // Update cache time to prevent immediate re-checking
        lastCheckTimeRef.current = Date.now();
        
        return { success: true };
      } else {
        setError(data.error || 'Signup failed');
        return { success: false, error: data.error };
      }
      
    } catch (err) {
      setError(err.message || 'Signup failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial session check on mount
  useEffect(() => {
    mountedRef.current = true;
    checkSession();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Set auth state directly (for OAuth/OTP login)
  const setAuthState = useCallback((userData, userType = 'customer') => {
    console.log('[AuthContext] Setting auth state directly:', { userData, userType });
    
    // Mark this as a recent login
    recentLoginTimestamp = Date.now();
    
    // Set auth state immediately
    if (userType === 'admin') {
      setIsAdmin(true);
      setUser({ name: userData.name || userData.username || 'Admin', ...userData });
    } else {
      setIsAdmin(false);
      setUser(userData);
    }
    setIsAuthenticated(true);
    
    // Store in localStorage
    try {
      localStorage.setItem('gamespot_logged_in', 'true');
      localStorage.setItem('gamespot_user_type', userType);
    } catch (e) {
      console.log('[AuthContext] localStorage not available');
    }
    
    // Update cache time
    lastCheckTimeRef.current = Date.now();
    
    console.log('[AuthContext] Auth state set successfully');
  }, []);

  const value = {
    user,
    isAdmin,
    isAuthenticated,
    loading,
    error,
    checkSession,
    login,
    logout,
    signup,
    setAuthState, // Add this new function
    // Helper to clear any auth errors
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
