import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaInstagram, FaGamepad, FaGift } from 'react-icons/fa';
import '../styles/InvitePage.css';

function InvitePage() {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/917012125919', '_blank');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/gamespot_kdlr', '_blank');
  };

  const handleBookingClick = () => {
    navigate('/');
  };

  const handleGetOffersClick = () => {
    navigate('/get-offers');
  };

  return (
    <div className="invite-page">
      <div className="invite-container">
        <div className="invite-header">
          <h1>Welcome to GameSpot</h1>
          <p>Your Gateway to Gaming Paradise</p>
        </div>

        <div className="invite-links">
          <div className="invite-card" onClick={handleWhatsAppClick}>
            <div className="invite-icon whatsapp">
              <FaWhatsapp />
            </div>
            <h3>WhatsApp Us</h3>
            <p>7012125919</p>
            <span className="link-hint">Quick Response • 24/7 Available</span>
          </div>

          <div className="invite-card" onClick={handleBookingClick}>
            <div className="invite-icon booking">
              <FaGamepad />
            </div>
            <h3>Book Now</h3>
            <p>Go to Homepage</p>
            <span className="link-hint">Start Your Gaming Session</span>
          </div>

          <div className="invite-card" onClick={handleInstagramClick}>
            <div className="invite-icon instagram">
              <FaInstagram />
            </div>
            <h3>Follow Us</h3>
            <p>@gamespot_kdlr</p>
            <span className="link-hint">Latest Updates • Gaming News</span>
          </div>

          <div className="invite-card special" onClick={handleGetOffersClick}>
            <div className="invite-icon offers">
              <FaGift />
            </div>
            <h3>Get Offers</h3>
            <p>Share & Win</p>
            <span className="link-hint">Exclusive Promo Codes</span>
          </div>
        </div>

        <div className="invite-footer">
          <p>Choose any option to continue</p>
        </div>
      </div>
    </div>
  );
}

export default InvitePage;
