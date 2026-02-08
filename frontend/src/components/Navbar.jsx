import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiHome, FiGrid, FiPhone, FiMessageSquare, FiCalendar, FiBell, FiX, FiAward, FiMonitor, FiBook, FiLogOut, FiSettings, FiCreditCard } from 'react-icons/fi';
import '../styles/Navbar.css';
import { useAuth } from '../context/AuthContext';


const Navbar = ({ showCenter = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showProfileDropdown) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowProfileDropdown(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showProfileDropdown]);


  const handleLogout = async () => {
    await logout();
    setShowProfileDropdown(false);
    navigate("/");
  };


  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleMobileNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <img 
            src="/assets/images/logo.png" 
            alt="GameSpot Logo" 
            className="navbar-logo" 
          />
        </div>
        
        {showCenter && (
          <div className="navbar-center">
            {/* Primary Navigation - Always Visible */}
            <div className="navbar-item" onClick={() => navigate('/')}>
              Home
            </div>
            
            <div className="navbar-item" onClick={() => navigate('/games')}>
              Games
            </div>
            
            <div className="navbar-item" onClick={() => navigate('/get-offers')}>
              Offers
            </div>
            
            {/* Membership Tab - Normal styling */}
            <div className="navbar-item" onClick={() => navigate('/membership')}>
              Membership
            </div>
            
            {/* Services Dropdown */}
            <div className="navbar-dropdown">
              <div className="navbar-item dropdown-trigger">
                Services
                <span className="dropdown-arrow">▼</span>
              </div>
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => navigate('/rental')}>
                  <FiMonitor className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">VR & PS5 Rental</div>
                    <div className="dropdown-description">Rent gaming equipment for home use</div>
                  </div>
                </div>
                <div className="dropdown-item" onClick={() => navigate('/college-setup')}>
                  <FiBook className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">College Events</div>
                    <div className="dropdown-description">Gaming setup for college fests</div>
                  </div>
                </div>
                <div className="dropdown-item" onClick={() => navigate('/feedback')}>
                  <FiMessageSquare className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">Feedback</div>
                    <div className="dropdown-description">Share your experience with us</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* More Dropdown */}
            <div className="navbar-dropdown">
              <div className="navbar-item dropdown-trigger">
                More
                <span className="dropdown-arrow">▼</span>
              </div>
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => navigate('/updates')}>
                  <FiBell className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">Updates</div>
                    <div className="dropdown-description">Latest news & announcements</div>
                  </div>
                </div>
                <div className="dropdown-item" onClick={() => navigate('/contact')}>
                  <FiPhone className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">Contact Us</div>
                    <div className="dropdown-description">Get in touch with our team</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}
        
        <div className="navbar-buttons">
          {user ? (
            <div className="profile-container" ref={dropdownRef}>
              <button className="profile-button" onClick={handleProfileClick}>
                <div className="profile-icon">
                  {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                </div>
                <span className="profile-name">{user.name}</span>
                <span className="profile-arrow">▼</span>
              </button>
              
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-icon">
                      {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <div className="profile-dropdown-info">
                      <div className="profile-dropdown-name">{user.name}</div>
                      {user.email && (
                        <div className="profile-dropdown-email">{user.email}</div>
                      )}
                      {isAdmin && (
                        <span className="admin-badge">Admin</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="profile-dropdown-divider"></div>
                  
                  <button 
                    className="profile-dropdown-item"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate(isAdmin ? '/admin/dashboard' : '/profile');
                    }}
                  >
                    <span className="profile-dropdown-icon-small">
                      {isAdmin ? <FiSettings /> : <FiUser />}
                    </span>
                    {isAdmin ? 'Dashboard' : 'My Profile'}
                  </button>
                  
                  {!isAdmin && (
                    <>
                      <button 
                        className="profile-dropdown-item"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          navigate('/membership');
                        }}
                      >
                        <span className="profile-dropdown-icon-small"><FiCreditCard /></span>
                        Membership
                      </button>
                      
                      <button 
                        className="profile-dropdown-item"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          navigate('/booking');
                        }}
                      >
                        <span className="profile-dropdown-icon-small"><FiCalendar /></span>
                        My Bookings
                      </button>
                    </>
                  )}
                  
                  <div className="profile-dropdown-divider"></div>
                  
                  <button 
                    className="profile-dropdown-item profile-dropdown-logout"
                    onClick={handleLogout}
                  >
                    <span className="profile-dropdown-icon-small"><FiLogOut /></span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-icon-button" onClick={() => navigate('/login')} title="Login">
              <FiUser size={24} color='white' />
            </button>
          )}

          {/* Mobile Menu Button */}
          {showCenter && (
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className={`hamburger-icon ${mobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <div 
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <button 
          className="mobile-nav-close" 
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <FiX />
        </button>

        <div className="mobile-nav-items">
          {/* Main Navigation */}
          <div 
            className={`mobile-nav-item ${isActivePath('/') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/')}
          >
            <FiHome className="nav-icon" />
            Home
          </div>
          
          <div 
            className={`mobile-nav-item ${isActivePath('/booking') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/booking')}
          >
            <FiCalendar className="nav-icon" />
            Book Now
          </div>
          
          <div 
            className={`mobile-nav-item ${isActivePath('/games') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/games')}
          >
            <FiGrid className="nav-icon" />
            Games
          </div>
          
          <div 
            className={`mobile-nav-item ${isActivePath('/membership') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/membership')}
          >
            <FiAward className="nav-icon" />
            Membership
          </div>

          <div className="mobile-nav-divider"></div>
          <div className="mobile-nav-section-title">Services</div>
          
          <div 
            className={`mobile-nav-item ${isActivePath('/rental') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/rental')}
          >
            <FiMonitor className="nav-icon" />
            VR & PS5 Rental
          </div>
          
          <div 
            className={`mobile-nav-item ${isActivePath('/college-setup') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/college-setup')}
          >
            <FiBook className="nav-icon" />
            College Events
          </div>
          
          <div 
            className={`mobile-nav-item ${isActivePath('/feedback') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/feedback')}
          >
            <FiMessageSquare className="nav-icon" />
            Feedback
          </div>

          <div className="mobile-nav-divider"></div>
          <div className="mobile-nav-section-title">More</div>
          
          <div 
            className={`mobile-nav-item ${isActivePath('/updates') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/updates')}
          >
            <FiBell className="nav-icon" />
            Updates
          </div>
          
          <div 
            className={`mobile-nav-item ${isActivePath('/contact') ? 'active' : ''}`}
            onClick={() => handleMobileNavClick('/contact')}
          >
            <FiPhone className="nav-icon" />
            Contact Us
          </div>

        </div>
      </div>
    </>
  );
};

export default Navbar;
