import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { getTheme } from './services/api';
import usePageTracking from './hooks/usePageTracking';

// Eager load only HomePage for fast initial load
import HomePage from './pages/HomePage.jsx';

// Lazy load all other pages - load only when visited
const BookingPage = lazy(() => import('./pages/BookingPage.jsx'));
const RentalPage = lazy(() => import('./pages/RentalPage.jsx'));
const CollegeSetupPage = lazy(() => import('./pages/CollegeSetupPage.jsx'));
const DiscountGamePage = lazy(() => import('./pages/DiscountGamePage.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const MembershipPlansPage = lazy(() => import('./pages/MembershipPlansPage.jsx'));
const GamesPage = lazy(() => import('./pages/GamesPage.jsx'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const UpdatesPage = lazy(() => import('./pages/UpdatesPage.jsx'));

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
  // Load and apply site theme on app initialization
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Try to get theme from API (database)
        const response = await getTheme();
        const theme = response.theme;
        
        // Apply theme to body
        document.body.className = theme;
        
        // Store in localStorage for offline/fast loading
        localStorage.setItem('siteTheme', theme);
      } catch (err) {
        // If API fails, try localStorage
        const cachedTheme = localStorage.getItem('siteTheme') || 'theme-purple';
        document.body.className = cachedTheme;
      }
    };

    loadTheme();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <PageTracker />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/rental" element={<RentalPage />} />
            <Route path="/college-setup" element={<CollegeSetupPage />} />
            <Route path="/discount-game" element={<DiscountGamePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/membership" element={<MembershipPlansPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* Redirect old admin login to new unified login */}
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
