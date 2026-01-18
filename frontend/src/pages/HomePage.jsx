import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCpu } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import '../styles/HomePage.css';
import { useAuth } from "../context/AuthContext";


const HomePage = () => {
  const navigate = useNavigate();
  const [showAIChat, setShowAIChat] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
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
      >
        <source src="/assets/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Dark Overlay for better text readability */}
      <div className="hero-video-overlay"></div>
      
      <Navbar showCenter={true} />
      
      {/* Main Content - Centered Book Now Button */}
      <div className="hero-content">
        {/* Logo Image instead of text */}
        <img 
          src="/assets/images/logo.png" 
          alt="GameSpot Logo" 
          className="hero-logo"
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

        {/* Main CTA - Book Now Button as DIV */}
        <div
          onClick={() => navigate('/booking')}
          className="cta-book-now-button"
          style={{
            backgroundImage: 'url(/assets/images/buttonImage3.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer',
            display: 'inline-block',
          }}
        >
          BOOK NOW
        </div>

        {/* Console Icons - PS5 and Xbox */}
        <div className="console-icons-container">
          <img 
            src="/assets/images/ps5Icon.png" 
            alt="PlayStation 5" 
            className="console-icon ps5-icon"
          />
          <div className="console-separator">|</div>
          <img 
            src="/assets/images/xboxIcon.png" 
            alt="Xbox" 
            className="console-icon xbox-icon"
          />
          <div className="console-separator">|</div>
          <img 
            src="/assets/images/metaIcon.png" 
            alt="Meta" 
            className="console-icon meta-icon"
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

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat onClose={() => setShowAIChat(false)} />
      )}

      <Footer transparent={true} />
    </div>
  );
};

export default HomePage;
