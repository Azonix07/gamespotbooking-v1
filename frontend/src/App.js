import React, { useEffect, lazy, Suspense, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { getTheme } from './services/api';
import usePageTracking from './hooks/usePageTracking';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx'; // Critical auth page - no lazy loading delay

// Error boundary — prevents a broken lazy-loaded page from white-screening the entire app
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error('Page load error:', err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f172a', color:'#fff', flexDirection:'column', gap:'1rem' }}>
          <h2 style={{ fontSize:'1.5rem' }}>Something went wrong</h2>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            style={{ padding:'0.75rem 2rem', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer' }}>
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage.jsx'));
const MembershipPlansPage = lazy(() => import('./pages/MembershipPlansPage.jsx'));
const GamesPage = lazy(() => import('./pages/GamesPage.jsx'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const UpdatesPage = lazy(() => import('./pages/UpdatesPage.jsx'));
const InvitePage = lazy(() => import('./pages/InvitePage.jsx'));
const GetOffersPage = lazy(() => import('./pages/GetOffersPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));

// Loading component for lazy-loaded pages — clean loader with GameSpot branding
const PageLoader = () => (
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
      {/* Logo */}
      <img src="/assets/images/logo.png" alt="GameSpot" style={{
        width: '140px', marginBottom: '28px', opacity: 0.9,
        animation: 'gPulse 2s ease-in-out infinite'
      }} />
      {/* Loading dots animation */}
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
      {/* Loading text */}
      <p style={{
        fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        letterSpacing: '3px', textTransform: 'uppercase',
        animation: 'gFadeInOut 2s ease-in-out infinite'
      }}>Loading</p>
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
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
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
          <ErrorBoundary>
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
              <Route path="/verify-email" element={<VerifyEmailPage />} />

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
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
