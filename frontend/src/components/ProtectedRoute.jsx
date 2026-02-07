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

// Loading spinner shown while checking auth state
const AuthLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #1e293b 50%, #312e81 100%)',
    color: '#fff'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(99, 102, 241, 0.2)',
        borderTop: '3px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p>Verifying access...</p>
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
