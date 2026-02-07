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

// Loading component for lazy-loaded pages
const PageLoader = () => (
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
      <p>Loading...</p>
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
              <Route path="/get-offers" element={<GetOffersPage />} />
              <Route path="/invite" element={<InvitePage />} />

              {/* ========== AUTH PAGES (Redirect if already logged in) ========== */}
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
              <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

              {/* ========== PROTECTED ROUTES (Login required for account features) ========== */}
              <Route path="/membership" element={<ProtectedRoute><MembershipPlansPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

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
