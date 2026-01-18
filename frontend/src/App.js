import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import RentalPage from './pages/RentalPage.jsx';
import CollegeSetupPage from './pages/CollegeSetupPage.jsx';
import DiscountGamePage from './pages/DiscountGamePage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import MembershipPlansPage from './pages/MembershipPlansPage.jsx';
import GamesPage from './pages/GamesPage.jsx';
import FeedbackPage from './pages/FeedbackPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import UpdatesPage from './pages/UpdatesPage.jsx';
import { getTheme } from './services/api';
import usePageTracking from './hooks/usePageTracking';

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
    <Router>
      <PageTracker />
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
    </Router>
  );
}

export default App;
