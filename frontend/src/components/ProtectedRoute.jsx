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

// Loading spinner shown while checking auth state — gaming-themed loader
const AuthLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    overflow: 'hidden',
    position: 'relative'
  }}>
    {/* Animated background orbs */}
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)',
        top: '-80px', right: '-40px', animation: 'gOrbFloat 6s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,153,102,0.08) 0%, transparent 70%)',
        bottom: '-60px', left: '-40px', animation: 'gOrbFloat 8s ease-in-out infinite reverse'
      }}></div>
    </div>
    <div style={{ textAlign: 'center', zIndex: 1 }}>
      {/* Lock/Shield animation */}
      <div style={{ marginBottom: '24px', animation: 'gBounce 2s ease-in-out infinite' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 16px rgba(255,107,53,0.4))' }}>
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#1e293b" stroke="#ff6b35" strokeWidth="1.5"/>
          <path d="M10 12l2 2 4-4" stroke="#ff9966" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* Logo */}
      <img src="/assets/images/logo.png" alt="GameSpot" style={{
        width: '130px', marginBottom: '24px', opacity: 0.9,
        animation: 'gPulse 2s ease-in-out infinite'
      }} />
      {/* Loading dots */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff6b35, #ff9966)',
            animation: `gDot 1.4s ease-in-out ${i * 0.15}s infinite`,
            boxShadow: '0 0 8px rgba(255,107,53,0.4)'
          }}></div>
        ))}
      </div>
      <p style={{
        fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)',
        letterSpacing: '3px', textTransform: 'uppercase',
        animation: 'gFadeInOut 2s ease-in-out infinite'
      }}>Verifying Access</p>
      <style>{`
        @keyframes gBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gPulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.97); }
        }
        @keyframes gDot {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes gFadeInOut {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @keyframes gOrbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.1); }
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
