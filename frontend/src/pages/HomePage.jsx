import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCpu, FiMenu, FiX, FiHome, FiGrid, FiAward, FiMonitor, FiUser, FiLogOut, FiSettings, FiCalendar, FiBook, FiMessageSquare, FiBell, FiPhone, FiGift, FiCreditCard, FiChevronRight } from 'react-icons/fi';
import Footer from '../components/Footer';
import '../styles/HomePage.css';
import { useAuth } from "../context/AuthContext";

// Lazy load AI Chat (only loads when needed)
const AIChat = lazy(() => import('../components/AIChat'));

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAIChat, setShowAIChat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActivePath = (path) => location.pathname === path;

  const handleMenuNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };


  return (
    <div className="hero-container">
      {/* Video Background */}
      <video 
        className="hero-background-video"
        autoPlay 
        loop 
        muted 
        playsInline
        preload="auto"
      >
        <source src="/assets/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Dark Overlay for better text readability */}
      <div className="hero-video-overlay"></div>
      
      {/* Custom Header with Hamburger Menu */}
      <div className="homepage-header">
        <button 
          className="hamburger-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
        </button>
        
        <div className="header-right">
          {user ? (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => navigate('/profile')}
              >
                <FiUser size={20} />
                <span>{user.name}</span>
              </button>
            </div>
          ) : (
            <button 
              className="login-button"
              onClick={() => navigate('/login')}
            >
              <FiUser size={20} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Slide-out Menu - Full Navigation */}
      <div className={`slide-menu ${menuOpen ? 'menu-open' : ''}`}>
        {/* Menu Header */}
        <div className="slide-menu-header">
          <img 
            src="/assets/images/logo.png" 
            alt="GameSpot Logo" 
            className="slide-menu-logo"
          />
          <button className="slide-menu-close" onClick={() => setMenuOpen(false)}>
            <FiX size={22} />
          </button>
        </div>

        {/* User Info Section */}
        {user && (
          <div className="slide-menu-user">
            <div className="slide-menu-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </div>
            <div className="slide-menu-user-info">
              <span className="slide-menu-user-name">{user.name}</span>
              {user.email && <span className="slide-menu-user-email">{user.email}</span>}
              {isAdmin && <span className="slide-menu-admin-badge">Admin</span>}
            </div>
          </div>
        )}

        <div className="slide-menu-content">
          {/* Main Navigation */}
          <div className="slide-menu-section">
            <div className="slide-menu-section-title">Navigation</div>
            <div className={`slide-menu-item ${isActivePath('/') ? 'active' : ''}`} onClick={() => handleMenuNav('/')}>
              <div className="slide-menu-item-icon"><FiHome size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">Home</span>
                <span className="slide-menu-item-desc">Back to main page</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
            <div className={`slide-menu-item ${isActivePath('/booking') ? 'active' : ''}`} onClick={() => handleMenuNav('/booking')}>
              <div className="slide-menu-item-icon booking-icon"><FiCalendar size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">Book Now</span>
                <span className="slide-menu-item-desc">Reserve your gaming session</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
            <div className={`slide-menu-item ${isActivePath('/games') ? 'active' : ''}`} onClick={() => handleMenuNav('/games')}>
              <div className="slide-menu-item-icon"><FiGrid size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">Games</span>
                <span className="slide-menu-item-desc">Browse available games</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
            <div className={`slide-menu-item ${isActivePath('/membership') ? 'active' : ''}`} onClick={() => handleMenuNav('/membership')}>
              <div className="slide-menu-item-icon membership-icon"><FiAward size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">Membership</span>
                <span className="slide-menu-item-desc">Exclusive plans & benefits</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
          </div>

          {/* Services Section */}
          <div className="slide-menu-section">
            <div className="slide-menu-section-title">Services</div>
            <div className={`slide-menu-item ${isActivePath('/rental') ? 'active' : ''}`} onClick={() => handleMenuNav('/rental')}>
              <div className="slide-menu-item-icon"><FiMonitor size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">VR & PS5 Rental</span>
                <span className="slide-menu-item-desc">Rent gaming equipment for home</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
            <div className={`slide-menu-item ${isActivePath('/college-setup') ? 'active' : ''}`} onClick={() => handleMenuNav('/college-setup')}>
              <div className="slide-menu-item-icon"><FiBook size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">College Events</span>
                <span className="slide-menu-item-desc">Gaming setup for college fests</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
            <div className={`slide-menu-item ${isActivePath('/feedback') ? 'active' : ''}`} onClick={() => handleMenuNav('/feedback')}>
              <div className="slide-menu-item-icon"><FiMessageSquare size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">Feedback</span>
                <span className="slide-menu-item-desc">Share your experience</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
          </div>

          {/* Offers & Promos */}
          <div className="slide-menu-section">
            <div className="slide-menu-section-title">Offers & Promos</div>
            <div className={`slide-menu-item ${isActivePath('/get-offers') ? 'active' : ''}`} onClick={() => handleMenuNav('/get-offers')}>
              <div className="slide-menu-item-icon promo-icon"><FiGift size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">Get Offers</span>
                <span className="slide-menu-item-desc">Exclusive deals & discounts</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
          </div>

          {/* More Section */}
          <div className="slide-menu-section">
            <div className="slide-menu-section-title">More</div>
            <div className={`slide-menu-item ${isActivePath('/updates') ? 'active' : ''}`} onClick={() => handleMenuNav('/updates')}>
              <div className="slide-menu-item-icon"><FiBell size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">Updates</span>
                <span className="slide-menu-item-desc">Latest news & announcements</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
            <div className={`slide-menu-item ${isActivePath('/contact') ? 'active' : ''}`} onClick={() => handleMenuNav('/contact')}>
              <div className="slide-menu-item-icon"><FiPhone size={20} /></div>
              <div className="slide-menu-item-text">
                <span className="slide-menu-item-label">Contact Us</span>
                <span className="slide-menu-item-desc">Get in touch with our team</span>
              </div>
              <FiChevronRight className="slide-menu-item-arrow" />
            </div>
          </div>

          {/* User Account Section */}
          {user && (
            <div className="slide-menu-section">
              <div className="slide-menu-section-title">Account</div>
              <div className={`slide-menu-item ${isActivePath('/profile') ? 'active' : ''}`} onClick={() => handleMenuNav(isAdmin ? '/admin/dashboard' : '/profile')}>
                <div className="slide-menu-item-icon"><FiSettings size={20} /></div>
                <div className="slide-menu-item-text">
                  <span className="slide-menu-item-label">{isAdmin ? 'Dashboard' : 'My Profile'}</span>
                  <span className="slide-menu-item-desc">{isAdmin ? 'Admin controls' : 'View & edit profile'}</span>
                </div>
                <FiChevronRight className="slide-menu-item-arrow" />
              </div>
              {!isAdmin && (
                <div className={`slide-menu-item ${isActivePath('/membership') ? 'active' : ''}`} onClick={() => handleMenuNav('/membership')}>
                  <div className="slide-menu-item-icon"><FiCreditCard size={20} /></div>
                  <div className="slide-menu-item-text">
                    <span className="slide-menu-item-label">My Membership</span>
                    <span className="slide-menu-item-desc">Manage your plan</span>
                  </div>
                  <FiChevronRight className="slide-menu-item-arrow" />
                </div>
              )}
              <div className="slide-menu-item logout-item" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                <div className="slide-menu-item-icon logout-icon"><FiLogOut size={20} /></div>
                <div className="slide-menu-item-text">
                  <span className="slide-menu-item-label">Sign Out</span>
                  <span className="slide-menu-item-desc">Log out of your account</span>
                </div>
              </div>
            </div>
          )}

          {/* Login button for non-authenticated users */}
          {!user && (
            <div className="slide-menu-section">
              <div className="slide-menu-login-btn" onClick={() => handleMenuNav('/login')}>
                <FiUser size={20} />
                <span>Login / Sign Up</span>
              </div>
            </div>
          )}
        </div>

        {/* Menu Footer */}
        <div className="slide-menu-footer">
          <span>© 2026 GameSpot</span>
          <span>Premium Gaming</span>
        </div>
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      
      {/* Main Content - Centered Book Now Button */}
      <div className="hero-content">
        {/* Logo — LCP element: native img, no lazy loading, highest priority */}
        <img
          src="/assets/images/logo.png" 
          alt="GameSpot Logo" 
          className="hero-logo"
          fetchPriority="high"
          decoding="async"
          width="400"
          height="75"
        />
        
        <p className="hero-subtitle">
          Experience Next-Generation Gaming
        </p>
        <p className="hero-subtitle2">
          Premium Consoles • Professional Setup • Ultimate Entertainment
        </p>

        {user && (
          <div className="welcome-banner">
            <p style={{ margin: 0, color: 'var(--light-gray)' }}>
              Welcome back, <strong style={{ color: 'var(--primary)' }}>{user.name}</strong>! 
              {isAdmin && ' (Admin)'}
            </p>
          </div>
        )}

        {/* Main CTA - Book Now Button as DIV - Using CSS background for better performance */}
        <div
          onClick={() => navigate('/booking')}
          className="cta-book-now-button"
        >
          BOOK NOW
        </div>

        {/* Console Icons */}
        <div className="console-icons-container">
          <img
            src="/assets/images/ps5Icon.png" 
            alt="PlayStation 5" 
            className="console-icon ps5-icon"
            loading="lazy"
            decoding="async"
          />
          <div className="console-separator">|</div>
          <img
            src="/assets/images/xboxIcon.png" 
            alt="Xbox" 
            className="console-icon xbox-icon"
            loading="lazy"
            decoding="async"
          />
          <div className="console-separator">|</div>
          <img
            src="/assets/images/metaIcon.png" 
            alt="Meta" 
            className="console-icon meta-icon"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* AI Chat Robot Icon - Bottom Right Corner */}
      <button
        className="fab-button fab-ai-chat"
        onClick={() => setShowAIChat(true)}
        aria-label="Book with AI"
        title="Book with AI"
      >
        <FiCpu className="fab-icon" />
      </button>

      {/* AI Chat Modal - Lazy loaded */}
      {showAIChat && (
        <Suspense fallback={<div>Loading AI...</div>}>
          <AIChat onClose={() => setShowAIChat(false)} />
        </Suspense>
      )}

      <Footer transparent={true} />
    </div>
  );
};

export default HomePage;
