import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCpu } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/HomePage.css';

// Lazy load AI Chat (only loads when needed)
const AIChat = lazy(() => import('../components/AIChat'));

const HomePage = () => {
  const navigate = useNavigate();
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <div className="hero-container">
      {/* Standard Navbar - same as other pages */}
      <Navbar />

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
