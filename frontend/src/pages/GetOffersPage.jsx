import React, { useState } from 'react';
import { FaInstagram, FaShare, FaCheckCircle } from 'react-icons/fa';
import '../styles/GetOffersPage.css';

function GetOffersPage() {
  const [sharedCount, setSharedCount] = useState(0);
  const [offerCode, setOfferCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const generateOfferCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleShare = () => {
    const instagramUrl = 'https://instagram.com/gamespot_kdlr';
    const shareText = '🎮 Check out GameSpot KDLR! Amazing gaming experience awaits! Follow now: ';
    
    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'GameSpot KDLR',
        text: shareText,
        url: instagramUrl
      })
      .then(() => {
        incrementShareCount();
      })
      .catch((error) => {
        // Fallback to opening Instagram
        window.open(instagramUrl, '_blank');
        incrementShareCount();
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      window.open(instagramUrl, '_blank');
      incrementShareCount();
    }
  };

  const incrementShareCount = () => {
    const newCount = sharedCount + 1;
    setSharedCount(newCount);
    
    if (newCount >= 5 && !showCode) {
      const code = generateOfferCode();
      setOfferCode(code);
      setShowCode(true);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(offerCode);
    alert('Offer code copied to clipboard!');
  };

  return (
    <div className="get-offers-page">
      <div className="offers-container">
        <div className="offers-header">
          <h1>Get Exclusive Offers</h1>
          <p>Share our Instagram page with 5 friends and unlock your promo code!</p>
        </div>

        <div className="share-section">
          <div className="instagram-info">
            <FaInstagram className="ig-icon" />
            <h2>@gamespot_kdlr</h2>
          </div>

          <div className="progress-tracker">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(sharedCount / 5) * 100}%` }}
              ></div>
            </div>
            <p className="progress-text">
              {sharedCount} / 5 shares completed
            </p>
          </div>

          <div className="share-grid">
            {[1, 2, 3, 4, 5].map((num) => (
              <div 
                key={num} 
                className={`share-box ${sharedCount >= num ? 'completed' : ''}`}
              >
                {sharedCount >= num ? (
                  <FaCheckCircle className="check-icon" />
                ) : (
                  <span className="share-number">{num}</span>
                )}
              </div>
            ))}
          </div>

          {!showCode ? (
            <button className="share-button" onClick={handleShare}>
              <FaShare />
              Share Instagram Page
            </button>
          ) : (
            <div className="offer-code-section">
              <h3>🎉 Congratulations! 🎉</h3>
              <p>You've unlocked your exclusive offer code!</p>
              <div className="code-display" onClick={copyCode}>
                <span className="code-text">{offerCode}</span>
                <span className="copy-hint">Click to copy</span>
              </div>
              <p className="code-info">Use this code at checkout to get your discount!</p>
            </div>
          )}
        </div>

        {!showCode && (
          <div className="offers-instructions">
            <h3>How it works:</h3>
            <ol>
              <li>Click the "Share Instagram Page" button</li>
              <li>Share @gamespot_kdlr with your friends</li>
              <li>Complete 5 shares to unlock your promo code</li>
              <li>Use the code for exclusive discounts!</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default GetOffersPage;
