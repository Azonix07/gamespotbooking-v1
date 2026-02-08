import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { FiCalendar, FiGift, FiArrowRight } from 'react-icons/fi';
import '../styles/InvitePage.css';

function InvitePage() {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/917012125919', '_blank', 'noopener');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/gamespot_kdlr', '_blank', 'noopener');
  };

  const handleBookingClick = () => {
    navigate('/');
  };

  const handleGetOffersClick = () => {
    navigate('/get-offers');
  };

  const cards = [
    {
      icon: <FaWhatsapp />,
      title: 'WhatsApp Us',
      desc: 'Chat with us directly for bookings, queries, or just to say hi!',
      color: '#25D366',
      action: handleWhatsAppClick,
      btnText: 'Open Chat',
    },
    {
      icon: <FiCalendar />,
      title: 'Book Now',
      desc: 'Reserve your gaming slot in seconds. Pick your time and jump in!',
      color: '#ff6b35',
      action: handleBookingClick,
      btnText: 'Book a Slot',
    },
    {
      icon: <FaInstagram />,
      title: 'Follow Us',
      desc: 'Stay updated with events, tournaments, and exclusive drops.',
      color: '#E1306C',
      action: handleInstagramClick,
      btnText: 'Follow @gamespot_kdlr',
    },
    {
      icon: <FiGift />,
      title: 'Get Offers',
      desc: 'Follow us on Instagram and unlock a free gaming hour — easy!',
      color: '#ff9966',
      action: handleGetOffersClick,
      btnText: 'Claim Free Hour',
    },
  ];

  return (
    <div className="invite-page">
      <div className="invite-bg">
        <div className="invite-bg-orb invite-bg-orb-1"></div>
        <div className="invite-bg-orb invite-bg-orb-2"></div>
      </div>

      <div className="invite-content">
        <div className="invite-logo">
          <span className="invite-logo-icon">🎮</span>
        </div>

        <h1 className="invite-title">
          Welcome to <span className="invite-brand">GameSpot</span>
        </h1>
        <p className="invite-sub">
          Calicut's premium gaming lounge — book, play, and level up!
        </p>

        <div className="invite-grid">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="invite-card"
              onClick={card.action}
              style={{ '--card-accent': card.color }}
            >
              <div className="invite-card-icon-wrap">
                {card.icon}
              </div>
              <div className="invite-card-body">
                <h3 className="invite-card-title">{card.title}</h3>
                <p className="invite-card-desc">{card.desc}</p>
              </div>
              <div className="invite-card-arrow">
                <FiArrowRight />
              </div>
            </div>
          ))}
        </div>

        <p className="invite-footer-text">
          GameSpot Gaming Lounge · Kozhikode, Kerala
        </p>
      </div>
    </div>
  );
}

export default InvitePage;
