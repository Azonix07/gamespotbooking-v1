import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCpu } from 'react-icons/fi';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/HomePage.css';
import { useAuth } from "../context/AuthContext";

// Lazy load AI Chat (only loads when needed)
const AIChat = lazy(() => import('../components/AIChat'));

const HomePage = () => {
  const navigate = useNavigate();
  const [showAIChat, setShowAIChat] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };


  return (
    <div className="hero-container">
      {/* Video Background with Poster Image for Faster Initial Load */}
      <video 
        className="hero-background-video"
        autoPlay 
        loop 
        muted 
        playsInline
        preload="metadata"
        poster="/assets/images/video-poster.jpg"
        onLoadedData={() => setVideoLoaded(true)}
      >
        <source src="/assets/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Dark Overlay for better text readability */}
      <div className="hero-video-overlay"></div>
      
      <Navbar showCenter={true} />
      
      {/* Main Content - Centered Book Now Button */}
      <div className="hero-content">
        {/* Logo Image with lazy loading */}
        <LazyLoadImage
          src="/assets/images/logo.png" 
          alt="GameSpot Logo" 
          className="hero-logo"
          effect="blur"
          threshold={100}
        />
        
        <p className="hero-subtitle">
          STEP INTO A NEXT-GEN GAMING LOUNGE EXPERIENCE
        </p>
        <p className="hero-subtitle2">
          PLAY COMPETE AND ENJOY A PREMIUM GAMING SETUP
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

        {/* Console Icons with lazy loading */}
        <div className="console-icons-container">
          <LazyLoadImage
            src="/assets/images/ps5Icon.png" 
            alt="PlayStation 5" 
            className="console-icon ps5-icon"
            effect="opacity"
            threshold={200}
          />
          <div className="console-separator">|</div>
          <LazyLoadImage
            src="/assets/images/xboxIcon.png" 
            alt="Xbox" 
            className="console-icon xbox-icon"
            effect="opacity"
            threshold={200}
          />
          <div className="console-separator">|</div>
          <LazyLoadImage
            src="/assets/images/metaIcon.png" 
            alt="Meta" 
            className="console-icon meta-icon"
            effect="opacity"
            threshold={200}
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
