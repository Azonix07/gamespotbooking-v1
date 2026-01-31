import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import { apiFetch } from '../services/apiClient';
import '../styles/Navbar.css';

const Navbar = ({ showCenter = true }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // SINGLE useEffect for session check on mount
  useEffect(() => {
    checkUserSession();
  }, []); // Empty dependency - runs once on mount

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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showProfileDropdown]);

  const checkUserSession = async () => {
    try {
      const data = await apiFetch('/api/auth/check');
      
      console.log('Navbar session check:', data); // Debug log
      
      if (data.authenticated) {
        if (data.user_type === 'admin') {
          setIsAdmin(true);
          setUser({ name: data.user.username || 'Admin' });
        } else {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error('Navbar session check error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST'
      });
      setUser(null);
      setIsAdmin(false);
      setShowProfileDropdown(false);
      navigate('/');
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  return (
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
          
          {/* Services Dropdown */}
          <div className="navbar-dropdown">
            <div className="navbar-item dropdown-trigger">
              Services
              <span className="dropdown-arrow">▼</span>
            </div>
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => navigate('/rental')}>
                <span className="dropdown-icon">🎮</span>
                <div className="dropdown-text-wrapper">
                  <div className="dropdown-title">VR & PS5 Rental</div>
                  <div className="dropdown-description">Rent gaming equipment for home</div>
                </div>
              </div>
              <div className="dropdown-item" onClick={() => navigate('/college-setup')}>
                <span className="dropdown-icon">🎓</span>
                <div className="dropdown-text-wrapper">
                  <div className="dropdown-title">College Setup</div>
                  <div className="dropdown-description">Gaming events for colleges</div>
                </div>
              </div>
              <div className="dropdown-item" onClick={() => navigate('/feedback')}>
                <span className="dropdown-icon">💬</span>
                <div className="dropdown-text-wrapper">
                  <div className="dropdown-title">Feedback</div>
                  <div className="dropdown-description">Share your experience</div>
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
                <span className="dropdown-icon">📢</span>
                <div className="dropdown-text-wrapper">
                  <div className="dropdown-title">Updates</div>
                  <div className="dropdown-description">Latest news & announcements</div>
                </div>
              </div>
              <div className="dropdown-item" onClick={() => navigate('/contact')}>
                <span className="dropdown-icon">📞</span>
                <div className="dropdown-text-wrapper">
                  <div className="dropdown-title">Contact Us</div>
                  <div className="dropdown-description">Get in touch with us</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Special Promo Tab - Always Visible */}
          <div className="navbar-item discount-tab" onClick={() => navigate('/discount-game')}>
            🎯 Win Free Game
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
                    navigate(isAdmin ? '/admin/dashboard' : '/membership');
                  }}
                >
                  <span className="profile-dropdown-icon-small">
                    {isAdmin ? '📊' : '💳'}
                  </span>
                  {isAdmin ? 'Dashboard' : 'Membership'}
                </button>
                
                {!isAdmin && (
                  <button 
                    className="profile-dropdown-item"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/booking');
                    }}
                  >
                    <span className="profile-dropdown-icon-small">📅</span>
                    My Bookings
                  </button>
                )}
                
                <div className="profile-dropdown-divider"></div>
                
                <button 
                  className="profile-dropdown-item profile-dropdown-logout"
                  onClick={handleLogout}
                >
                  <span className="profile-dropdown-icon-small">🚪</span>
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
      </div>
    </nav>
  );
};

export default Navbar;
