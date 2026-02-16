'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiUser, FiHome, FiGrid, FiPhone, FiMessageSquare, FiCalendar, FiBell, FiX, FiAward, FiMonitor, FiBook, FiLogOut, FiSettings, FiCreditCard } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

const Navbar = ({ showCenter = true, variant = 'dark' }: { showCenter?: boolean; variant?: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const isLight = variant === 'light';
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
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
    router.push('/');
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleMobileNavClick = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const isActivePath = (path: string) => pathname === path;

  return (
    <>
      <nav className={`navbar${isLight ? ' navbar-light' : ''}`}>
        <Link href="/" className="navbar-brand">
          <img
            src="/assets/images/logo.png"
            alt="GameSpot Logo"
            className="navbar-logo"
            width={140}
            height={26}
          />
        </Link>

        {showCenter && (
          <div className="navbar-center">
            <Link href="/" className="navbar-item">Home</Link>
            <Link href="/games" className="navbar-item">Games</Link>
            <Link href="/get-offers" className="navbar-item">Offers</Link>
            <Link href="/membership" className="navbar-item">Membership</Link>

            {/* Services Dropdown */}
            <div className="navbar-dropdown">
              <div className="navbar-item dropdown-trigger">
                Services
                <span className="dropdown-arrow">▼</span>
              </div>
              <div className="dropdown-menu">
                <Link href="/rental" className="dropdown-item">
                  <FiMonitor className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">VR & PS5 Rental</div>
                    <div className="dropdown-description">Rent gaming equipment for home use</div>
                  </div>
                </Link>
                <Link href="/college-setup" className="dropdown-item">
                  <FiBook className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">College Events</div>
                    <div className="dropdown-description">Gaming setup for college fests</div>
                  </div>
                </Link>
                <Link href="/feedback" className="dropdown-item">
                  <FiMessageSquare className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">Feedback</div>
                    <div className="dropdown-description">Share your experience with us</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* More Dropdown */}
            <div className="navbar-dropdown">
              <div className="navbar-item dropdown-trigger">
                More
                <span className="dropdown-arrow">▼</span>
              </div>
              <div className="dropdown-menu">
                <Link href="/updates" className="dropdown-item">
                  <FiBell className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">Updates</div>
                    <div className="dropdown-description">Latest news & announcements</div>
                  </div>
                </Link>
                <Link href="/contact" className="dropdown-item">
                  <FiPhone className="dropdown-icon" />
                  <div className="dropdown-text-wrapper">
                    <div className="dropdown-title">Contact Us</div>
                    <div className="dropdown-description">Get in touch with our team</div>
                  </div>
                </Link>
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
                      {isAdmin && <span className="admin-badge">Admin</span>}
                    </div>
                  </div>

                  <div className="profile-dropdown-divider"></div>

                  <button
                    className="profile-dropdown-item"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      router.push(isAdmin ? '/admin/dashboard' : '/profile');
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
                          router.push('/membership');
                        }}
                      >
                        <span className="profile-dropdown-icon-small"><FiCreditCard /></span>
                        Membership
                      </button>

                      <button
                        className="profile-dropdown-item"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          router.push('/booking');
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
            <Link href="/login" className="login-icon-button" title="Login">
              <FiUser size={24} color={isLight ? '#212529' : 'white'} />
            </Link>
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
      <div className={`mobile-nav-drawer${isLight ? ' mobile-nav-light' : ''} ${mobileMenuOpen ? 'open' : ''}`}>
        <button
          className="mobile-nav-close"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <FiX />
        </button>

        <div className="mobile-nav-items">
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
