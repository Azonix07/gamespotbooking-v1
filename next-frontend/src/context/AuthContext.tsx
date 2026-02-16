'use client';

/**
 * AuthContext — Centralized Authentication State Management (Next.js)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, setAccessToken, clearTokens } from '@/services/apiClient';

interface User {
  name?: string;
  email?: string;
  phone?: string;
  username?: string;
  profile_picture?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  checkSession: (force?: boolean) => Promise<any>;
  login: (identifier: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (formData: any) => Promise<any>;
  setAuthState: (userData: User, userType?: string) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CACHE_DURATION = 5 * 60 * 1000;
let recentLoginTimestamp = 0;
const RECENT_LOGIN_GRACE_PERIOD = 10000;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkInProgressRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const mountedRef = useRef(true);

  const checkSession = useCallback(async (force = false) => {
    const now = Date.now();
    if (checkInProgressRef.current) return { authenticated: isAuthenticated, user, isAdmin };
    if (!force && (now - lastCheckTimeRef.current) < CACHE_DURATION && lastCheckTimeRef.current > 0) {
      return { authenticated: isAuthenticated, user, isAdmin };
    }
    const justLoggedIn = (now - recentLoginTimestamp) < RECENT_LOGIN_GRACE_PERIOD;
    if (justLoggedIn && isAuthenticated) {
      setLoading(false);
      lastCheckTimeRef.current = now;
      return { authenticated: true, user, isAdmin };
    }

    try {
      checkInProgressRef.current = true;
      if (lastCheckTimeRef.current === 0) setLoading(true);
      const data = await apiFetch('/api/auth/check');
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
        try { localStorage.setItem('gamespot_logged_in', 'true'); localStorage.setItem('gamespot_user_type', data.user_type); } catch (e) {}
      } else {
        try { localStorage.removeItem('gamespot_logged_in'); localStorage.removeItem('gamespot_user_type'); } catch (e) {}
        setUser(null); setIsAdmin(false); setIsAuthenticated(false);
      }
      setError(null);
      return data;
    } catch (err: any) {
      if (mountedRef.current) { setError(err.message); setUser(null); setIsAdmin(false); setIsAuthenticated(false); }
      return { authenticated: false, user: null, isAdmin: false };
    } finally {
      if (mountedRef.current) setLoading(false);
      checkInProgressRef.current = false;
    }
  }, [isAuthenticated, user, isAdmin]);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      setLoading(true); setError(null);
      const data = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: identifier, email: identifier, password }) });
      if (data.success) {
        recentLoginTimestamp = Date.now();
        if (data.user_type === 'admin') { setIsAdmin(true); setUser({ name: data.username || 'Admin' }); }
        else { setIsAdmin(false); setUser(data.user || { name: identifier }); }
        setIsAuthenticated(true);
        try { localStorage.setItem('gamespot_logged_in', 'true'); localStorage.setItem('gamespot_user_type', data.user_type); if (data.token) setAccessToken(data.token); } catch (e) {}
        lastCheckTimeRef.current = Date.now();
        return { success: true, userType: data.user_type };
      } else {
        setError(data.error || 'Login failed');
        return { success: false, error: data.error };
      }
    } catch (err: any) { setError(err.message || 'Login failed'); return { success: false, error: err.message }; }
    finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    recentLoginTimestamp = 0;
    setUser(null); setIsAdmin(false); setIsAuthenticated(false);
    lastCheckTimeRef.current = 0;
    clearTokens();
    try { localStorage.removeItem('gamespot_logged_in'); localStorage.removeItem('gamespot_user_type'); } catch (e) {}
    try {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://gamespotbooking-v1-production.up.railway.app'}/api/auth/logout`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});
    } catch (err) {}
  }, []);

  const signup = useCallback(async (formData: any) => {
    try {
      setLoading(true); setError(null);
      const data = await apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(formData) });
      if (data.success) {
        if (data.needs_verification) return { success: true, needs_verification: true, message: data.message };
        recentLoginTimestamp = Date.now();
        setIsAdmin(false); setUser(data.user || { name: formData.name, email: formData.email }); setIsAuthenticated(true);
        try { localStorage.setItem('gamespot_logged_in', 'true'); localStorage.setItem('gamespot_user_type', 'customer'); if (data.token) setAccessToken(data.token); } catch (e) {}
        lastCheckTimeRef.current = Date.now();
        return { success: true };
      } else { setError(data.error || 'Signup failed'); return { success: false, error: data.error }; }
    } catch (err: any) { setError(err.message || 'Signup failed'); return { success: false, error: err.message }; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    try {
      const wasLoggedIn = localStorage.getItem('gamespot_logged_in') === 'true';
      const storedUserType = localStorage.getItem('gamespot_user_type');
      if (wasLoggedIn) {
        setIsAuthenticated(true); setIsAdmin(storedUserType === 'admin');
        setUser({ name: storedUserType === 'admin' ? 'Admin' : 'User' }); setLoading(false);
      }
    } catch (e) {}
    checkSession();
    return () => { mountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAuthState = useCallback((userData: User, userType = 'customer') => {
    recentLoginTimestamp = Date.now();
    if (userType === 'admin') { setIsAdmin(true); setUser({ name: userData.name || userData.username || 'Admin', ...userData }); }
    else { setIsAdmin(false); setUser(userData); }
    setIsAuthenticated(true);
    try { localStorage.setItem('gamespot_logged_in', 'true'); localStorage.setItem('gamespot_user_type', userType); } catch (e) {}
    lastCheckTimeRef.current = Date.now();
  }, []);

  const value: AuthContextType = {
    user, isAdmin, isAuthenticated, loading, error,
    checkSession, login, logout, signup, setAuthState,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
