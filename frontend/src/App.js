import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { getTheme } from './services/api';
import usePageTracking from './hooks/usePageTracking';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx'; // Critical auth page - no lazy loading delay

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '377614306435-te2kkpi5p7glk1tfe7halc24svv14l32.apps.googleusercontent.com';

// Lazy load all other pages - load only when visited

// Lazy load all other pages - load only when visited
const BookingPage = lazy(() => import('./pages/BookingPage.jsx'));
const RentalPage = lazy(() => import('./pages/RentalPage.jsx'));
const CollegeSetupPage = lazy(() => import('./pages/CollegeSetupPage.jsx'));
const DiscountGamePage = lazy(() => import('./pages/DiscountGamePage.jsx'));
const InstagramPromoPage = lazy(() => import('./pages/InstagramPromoPage.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const MembershipPlansPage = lazy(() => import('./pages/MembershipPlansPage.jsx'));
const GamesPage = lazy(() => import('./pages/GamesPage.jsx'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const UpdatesPage = lazy(() => import('./pages/UpdatesPage.jsx'));
const InvitePage = lazy(() => import('./pages/InvitePage.jsx'));
const GetOffersPage = lazy(() => import('./pages/GetOffersPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));

// Loading component for lazy-loaded pages — fun gaming-themed loader
const PageLoader = () => (
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
        position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
        top: '-100px', right: '-50px', animation: 'gOrbFloat 6s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute', width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,153,102,0.1) 0%, transparent 70%)',
        bottom: '-80px', left: '-60px', animation: 'gOrbFloat 8s ease-in-out infinite reverse'
      }}></div>
    </div>
    <div style={{ textAlign: 'center', zIndex: 1 }}>
      {/* Gaming controller SVG animation */}
      <div style={{ marginBottom: '28px', animation: 'gBounce 2s ease-in-out infinite' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 20px rgba(255,107,53,0.5))' }}>
          <path d="M6 11h2v2H6v-2zm4-2h2v2h-2V9zm4 2h2v2h-2v-2z" fill="#ff6b35"/>
          <path d="M17.5 7h-11A4.5 4.5 0 0 0 2 11.5c0 1.58.81 2.97 2.04 3.77L2.5 20h3l1-3h11l1 3h3l-1.54-4.73A4.49 4.49 0 0 0 22 11.5 4.5 4.5 0 0 0 17.5 7zm0 7h-11C4.57 14 3 12.43 3 10.5S4.57 7 6.5 7h11c1.93 0 3.5 1.57 3.5 3.5S19.43 14 17.5 14z" fill="#ff9966" opacity="0.9"/>
        </svg>
      </div>
      {/* Logo */}
      <img src="/assets/images/logo.png" alt="GameSpot" style={{
        width: '140px', marginBottom: '24px', opacity: 0.9,
        animation: 'gPulse 2s ease-in-out infinite'
      }} />
      {/* Loading dots animation */}
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
      {/* Loading text */}
      <p style={{
        fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        letterSpacing: '3px', textTransform: 'uppercase',
        animation: 'gFadeInOut 2s ease-in-out infinite'
      }}>Loading</p>
      <style>{`
        @keyframes gBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
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
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes gOrbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.1); }
        }
      `}</style>
    </div>
  </div>
);

// Component to handle page tracking inside Router
const PageTracker = () => {
  usePageTracking();
  return null;
};

function App() {
  // Load and apply site theme — use cached theme FIRST, then update from API
  useEffect(() => {
    // Step 1: Apply cached theme immediately (no network wait)
    const cachedTheme = localStorage.getItem('siteTheme') || 'theme-purple';
    document.body.className = cachedTheme;

    // Step 2: Update from API in background (non-blocking)
    const loadTheme = async () => {
      try {
        const response = await getTheme();
        const theme = response.theme;
        if (theme && theme !== cachedTheme) {
          document.body.className = theme;
          localStorage.setItem('siteTheme', theme);
        }
      } catch (err) {
        // Already using cached theme, ignore error
      }
    };

    loadTheme();
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <PageTracker />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ========== PUBLIC ROUTES (No auth required) ========== */}
              <Route path="/" element={<HomePage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/updates" element={<UpdatesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/discount-game" element={<DiscountGamePage />} />
              <Route path="/win-free-game" element={<InstagramPromoPage />} />
              <Route path="/instagram-promo" element={<InstagramPromoPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/rental" element={<RentalPage />} />
              <Route path="/college-setup" element={<CollegeSetupPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/invite" element={<InvitePage />} />

              {/* ========== AUTH PAGES (Redirect if already logged in) ========== */}
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
              <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

              {/* ========== PROTECTED ROUTES (Login required for account features) ========== */}
              <Route path="/membership" element={<MembershipPlansPage />} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/get-offers" element={<GetOffersPage />} />

              {/* ========== ADMIN ROUTES (Admin login required) ========== */}
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* ========== CATCH-ALL (404 → Home) ========== */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
