/**
 * ProtectedRoute - Route guard components for authenticated access
 * 
 * ProtectedRoute: Requires user to be logged in
 * AdminRoute: Requires user to be an admin
 * PublicOnlyRoute: Redirects authenticated users away from login/signup
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Loading spinner shown while checking auth state — warm orange theme
const AuthLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
    color: '#9a3412'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid rgba(255, 107, 53, 0.15)',
        borderTop: '3px solid #ff6b35',
        animation: 'gspin 0.8s cubic-bezier(0.4,0,0.2,1) infinite',
        margin: '0 auto 20px'
      }}></div>
      <img src="/assets/images/logo.png" alt="GameSpot" style={{ width: '120px', marginBottom: '12px', opacity: 0.85 }} />
      <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#c2410c', letterSpacing: '0.5px' }}>Verifying access...</p>
      <style>{`
        @keyframes gspin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

/**
 * ProtectedRoute - Requires authenticated user
 * Redirects to /login if not authenticated, preserving the intended destination
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    // Save the attempted URL so we can redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

/**
 * AdminRoute - Requires admin authentication
 * Redirects non-admin users to home, unauthenticated users to login
 */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    // Non-admin users get redirected to home
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * PublicOnlyRoute - For login/signup pages
 * Redirects authenticated users to home (or their intended destination)
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (isAuthenticated) {
    // Redirect to where they came from, or home/admin dashboard
    const from = location.state?.from;
    if (from) {
      return <Navigate to={from} replace />;
    }
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
