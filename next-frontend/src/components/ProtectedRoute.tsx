'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Loading spinner shown while checking auth state
const AuthLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0f172a',
    overflow: 'hidden',
    position: 'relative'
  }}>
    <div style={{ textAlign: 'center', zIndex: 1 }}>
      <img src="/assets/images/logo.png" alt="GameSpot" style={{
        width: '130px', marginBottom: '24px', opacity: 0.9,
        animation: 'gPulse 2s ease-in-out infinite'
      }} />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            animation: `gDot 1.4s ease-in-out ${i * 0.15}s infinite`,
            boxShadow: '0 0 8px rgba(99,102,241,0.4)'
          }}></div>
        ))}
      </div>
      <p style={{
        fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)',
        letterSpacing: '3px', textTransform: 'uppercase',
        animation: 'gFadeInOut 2s ease-in-out infinite'
      }}>Verifying Access</p>
      <style>{`
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
      `}</style>
    </div>
  </div>
);

/**
 * ProtectedRoute - Requires authenticated user
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading) return <AuthLoader />;
  if (!isAuthenticated) return <AuthLoader />;

  return <>{children}</>;
};

/**
 * AdminRoute - Requires admin authentication
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      } else if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [loading, isAuthenticated, isAdmin, router, pathname]);

  if (loading) return <AuthLoader />;
  if (!isAuthenticated || !isAdmin) return <AuthLoader />;

  return <>{children}</>;
};

/**
 * PublicOnlyRoute - For login/signup pages
 * Redirects authenticated users to home
 */
export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(isAdmin ? '/admin/dashboard' : '/');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) return <AuthLoader />;
  if (isAuthenticated) return <AuthLoader />;

  return <>{children}</>;
};

export { AuthLoader };
export default ProtectedRoute;
