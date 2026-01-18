/**
 * AuthContext - Centralized Authentication State Management
 * Prevents redundant API calls and infinite loops
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../services/apiClient';

const AuthContext = createContext(null);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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
      return { authenticated: isAuthenticated, user, isAdmin };
    }
    
    // Skip if we checked recently (within cache duration) and not forcing
    if (!force && (now - lastCheckTimeRef.current) < CACHE_DURATION && lastCheckTimeRef.current > 0) {
      return { authenticated: isAuthenticated, user, isAdmin };
    }
    
    try {
      checkInProgressRef.current = true;
      
      const data = await apiFetch('/api/auth/check');
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return data;
      
      lastCheckTimeRef.current = now;
      
      if (data.authenticated) {
        if (data.user_type === 'admin') {
          setIsAdmin(true);
          setUser({ name: data.user?.username || 'Admin', ...data.user });
        } else {
          setIsAdmin(false);
          setUser(data.user);
        }
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
      }
      
      setError(null);
      return data;
      
    } catch (err) {
      console.error('Session check error:', err);
      if (mountedRef.current) {
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
      
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: identifier, password })
      });
      
      if (data.success) {
        // Force refresh session after login
        lastCheckTimeRef.current = 0;
        await checkSession(true);
        return { success: true, userType: data.user_type };
      } else {
        setError(data.error || 'Login failed');
        return { success: false, error: data.error };
      }
      
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [checkSession]);

  // Logout function
  const logout = useCallback(async () => {
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
        // Force refresh session after signup (auto-login)
        lastCheckTimeRef.current = 0;
        await checkSession(true);
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
  }, [checkSession]);

  // Initial session check on mount
  useEffect(() => {
    mountedRef.current = true;
    checkSession();
    
    return () => {
      mountedRef.current = false;
    };
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
