import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { FiCalendar, FiGift, FiArrowRight, FiMapPin, FiExternalLink } from 'react-icons/fi';
import { HiAcademicCap } from 'react-icons/hi2';
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

  const collegeEvents = [
    {
      name: 'Vidya Academy of Science & Technology',
      location: 'Thrissur',
      url: 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE3OTY0MzU4NjI4ODQ0Nzk0?story_media_id=3470624048138732843&igsh=b3dranNtOTMzMm5w',
    },
    {
      name: 'Sahrdaya College of Engineering & Technology (Autonomous)',
      location: 'Kodungallur',
      url: 'https://www.instagram.com/reel/DB5vX7qRn6U/?igsh=MTF4emhrM2hkbGVqbw==',
    },
    {
      name: 'Tharananellur Arts & Science College',
      location: 'Tharananellur',
      url: 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE3ODYyNzkwMjg0MzQwNDE0?story_media_id=3551761286377482930&igsh=dHEydXYxMXBkajJ5',
    },
    {
      name: 'Nirmala College of Arts & Science',
      location: 'Meloor, Thrissur',
      url: 'https://www.instagram.com/reel/DHBdnOaMKUg/?igsh=Z29kdDh2cW54c2M4',
    },
    {
      name: 'Jyothi Engineering College (Autonomous)',
      location: 'Cheruthuruthy, Thrissur',
      url: 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MDc2NzQ1NTMxNTgyNTIz?story_media_id=3809966238920069623&igsh=MXh0cDFjdnJicXo5Yw==',
    },
  ];

  const handleCollegeClick = (url) => {
    window.open(url, '_blank', 'noopener');
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
          Kodungallur's premium gaming lounge — book, play, and level up!
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

        {/* College Events Section */}
        <div className="invite-college-section">
          <div className="invite-college-header">
            <HiAcademicCap className="invite-college-header-icon" />
            <h2 className="invite-college-title">College Events</h2>
            <p className="invite-college-subtitle">We've been to these campuses — tap to watch the highlights!</p>
          </div>
          <div className="invite-college-list">
            {collegeEvents.map((college, idx) => (
              <div
                key={idx}
                className="invite-college-card"
                onClick={() => handleCollegeClick(college.url)}
              >
                <div className="invite-college-icon-wrap">
                  <FaInstagram />
                </div>
                <div className="invite-college-info">
                  <h4 className="invite-college-name">{college.name}</h4>
                  <span className="invite-college-location">
                    <FiMapPin /> {college.location}
                  </span>
                </div>
                <div className="invite-college-action">
                  <FiExternalLink />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="invite-footer-text">
          GameSpot Gaming Lounge · Kodungallur, Thrissur, Kerala
        </p>
      </div>
    </div>
  );
}

export default InvitePage;
