import React, { useState } from 'react';
import { 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiClock, 
  FiCopy, 
  FiCheck,
  FiSend,
  FiInstagram,
  FiFacebook,
  FiTwitter,
  FiStar
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/ContactPage.css';

const ContactPage = () => {
  const [copied, setCopied] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [charCount, setCharCount] = useState(0);

  // Contact Information
  const contactInfo = {
    phone: '+91 70121 25919',
    email: 'contact@gamespot.com',
    address: 'GameSpot Kodungallur',
    city: 'Thrissur, Kerala, India',
    instagram: '@gamespot_kdlr',
    facebook: 'GameSpotOfficial',
    twitter: '@GameSpotIndia',
    googleMapsLink: 'https://maps.google.com/?q=10.2167,76.2000',
    googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3923.0!2d76.2000!3d10.2167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDEzJzAwLjEiTiA3NsKwMTInMDAuMCJF!5e0!3m2!1sen!2sin!4v1234567890',
    whatsappNumber: '917012125919', // Without + and spaces for WhatsApp API
    rating: 4.8,
    totalReviews: 326,
    workingHours: {
      weekdays: '10:00 AM - 11:00 PM',
      weekends: '9:00 AM - 12:00 AM'
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(contactInfo.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppSend = () => {
    if (whatsappMessage.trim()) {
      const encodedMessage = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/${contactInfo.whatsappNumber}?text=${encodedMessage}`, '_blank');
      setWhatsappMessage('');
      setCharCount(0);
    }
  };

  const handleMessageChange = (e) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setWhatsappMessage(text);
      setCharCount(text.length);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FiStar key={`full-${i}`} className="star filled" />);
    }
    if (hasHalfStar) {
      stars.push(<FiStar key="half" className="star half-filled" />);
    }
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FiStar key={`empty-${i}`} className="star" />);
    }
    return stars;
  };

  return (
    <div className="contact-page">
      <Navbar />
      
      <div className="contact-container">
        {/* Header Section */}
        <div className="contact-header">
          <h1 className="contact-title">Get In Touch</h1>
          <p className="contact-subtitle">
            We'd love to hear from you. Choose your preferred way to connect with us!
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="quick-contact-grid">
          {/* WhatsApp Card */}
          <div className="contact-card whatsapp-card">
            <div className="card-icon-header">
              <FaWhatsapp className="card-main-icon whatsapp-icon" />
              <h3>WhatsApp Us</h3>
            </div>
            <p className="card-description">
              Send us a message directly on WhatsApp for instant support
            </p>
            
            <div className="whatsapp-input-section">
              <label className="input-label">Your Message</label>
              <textarea
                className="whatsapp-textarea"
                placeholder="Type your message here..."
                value={whatsappMessage}
                onChange={handleMessageChange}
                rows="4"
              />
              <div className="textarea-footer">
                <span className="char-counter">{charCount}/500</span>
              </div>
            </div>

            <button 
              className="whatsapp-send-btn"
              onClick={handleWhatsAppSend}
              disabled={!whatsappMessage.trim()}
            >
              <FiSend />
              Send on WhatsApp
            </button>

            <div className="quick-message-chips">
              <span 
                className="chip"
                onClick={() => {
                  setWhatsappMessage("Hi! I'd like to know about your gaming packages.");
                  setCharCount("Hi! I'd like to know about your gaming packages.".length);
                }}
              >
                📦 Packages Info
              </span>
              <span 
                className="chip"
                onClick={() => {
                  setWhatsappMessage("Hello! I want to book a gaming session.");
                  setCharCount("Hello! I want to book a gaming session.".length);
                }}
              >
                🎮 Book Session
              </span>
              <span 
                className="chip"
                onClick={() => {
                  setWhatsappMessage("Hi! What are your current offers?");
                  setCharCount("Hi! What are your current offers?".length);
                }}
              >
                🎁 Offers
              </span>
            </div>
          </div>

          {/* Phone Contact Card */}
          <div className="contact-card phone-card">
            <div className="card-icon-header">
              <FiPhone className="card-main-icon phone-icon" />
              <h3>Call Us</h3>
            </div>
            <p className="card-description">
              Speak directly with our team for immediate assistance
            </p>
            
            <div className="phone-display">
              <div className="phone-number">{contactInfo.phone}</div>
              <button 
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyPhone}
              >
                {copied ? (
                  <>
                    <FiCheck /> Copied!
                  </>
                ) : (
                  <>
                    <FiCopy /> Copy
                  </>
                )}
              </button>
            </div>

            <a href={`tel:${contactInfo.phone}`} className="call-now-btn">
              <FiPhone />
              Call Now
            </a>

            <div className="working-hours">
              <FiClock className="hours-icon" />
              <div className="hours-info">
                <div className="hours-row">
                  <span className="hours-label">Mon - Fri:</span>
                  <span className="hours-value">{contactInfo.workingHours.weekdays}</span>
                </div>
                <div className="hours-row">
                  <span className="hours-label">Sat - Sun:</span>
                  <span className="hours-value">{contactInfo.workingHours.weekends}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media & Connections */}
        <div className="connections-section">
          <h2 className="section-title">
            <span className="title-icon">🌐</span>
            Connect With Us
          </h2>
          
          <div className="social-cards-grid">
            {/* Instagram */}
            <a 
              href={`https://instagram.com/${contactInfo.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-card instagram-card"
            >
              <FiInstagram className="social-icon" />
              <div className="social-info">
                <div className="social-name">Instagram</div>
                <div className="social-handle">{contactInfo.instagram}</div>
              </div>
              <div className="social-arrow">→</div>
            </a>

            {/* Facebook */}
            <a 
              href={`https://facebook.com/${contactInfo.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-card facebook-card"
            >
              <FiFacebook className="social-icon" />
              <div className="social-info">
                <div className="social-name">Facebook</div>
                <div className="social-handle">{contactInfo.facebook}</div>
              </div>
              <div className="social-arrow">→</div>
            </a>

            {/* Twitter */}
            <a 
              href={`https://twitter.com/${contactInfo.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-card twitter-card"
            >
              <FiTwitter className="social-icon" />
              <div className="social-info">
                <div className="social-name">Twitter</div>
                <div className="social-handle">{contactInfo.twitter}</div>
              </div>
              <div className="social-arrow">→</div>
            </a>

            {/* Email */}
            <a 
              href={`mailto:${contactInfo.email}`}
              className="social-card email-card"
            >
              <FiMail className="social-icon" />
              <div className="social-info">
                <div className="social-name">Email</div>
                <div className="social-handle">{contactInfo.email}</div>
              </div>
              <div className="social-arrow">→</div>
            </a>
          </div>
        </div>

        {/* Location & Map Section */}
        <div className="location-section">
          <h2 className="section-title">
            <span className="title-icon">📍</span>
            Visit Our Shop
          </h2>

          <div className="location-content">
            {/* Location Info Card */}
            <div className="location-info-card">
              <div className="location-header">
                <FiMapPin className="location-icon" />
                <div>
                  <h3>GameSpot Gaming Arena</h3>
                  <div className="rating-section">
                    <div className="stars-container">
                      {renderStars(contactInfo.rating)}
                    </div>
                    <span className="rating-text">
                      {contactInfo.rating} ({contactInfo.totalReviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="address-details">
                <div className="address-line">
                  <FiMapPin className="detail-icon" />
                  <div>
                    <div className="detail-label">Address</div>
                    <div className="detail-value">{contactInfo.address}</div>
                    <div className="detail-value">{contactInfo.city}</div>
                  </div>
                </div>

                <div className="address-line">
                  <FiPhone className="detail-icon" />
                  <div>
                    <div className="detail-label">Phone</div>
                    <div className="detail-value">{contactInfo.phone}</div>
                  </div>
                </div>

                <div className="address-line">
                  <FiClock className="detail-icon" />
                  <div>
                    <div className="detail-label">Opening Hours</div>
                    <div className="detail-value">
                      Mon-Fri: {contactInfo.workingHours.weekdays}
                    </div>
                    <div className="detail-value">
                      Sat-Sun: {contactInfo.workingHours.weekends}
                    </div>
                  </div>
                </div>
              </div>

              <div className="location-actions">
                <a 
                  href={contactInfo.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="direction-btn"
                >
                  <FiMapPin />
                  Get Directions
                </a>
                <button 
                  className="share-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(contactInfo.address + ', ' + contactInfo.city);
                    alert('Address copied to clipboard!');
                  }}
                >
                  <FiCopy />
                  Copy Address
                </button>
              </div>

              {/* Features */}
              <div className="location-features">
                <div className="feature-tag">🅿️ Free Parking</div>
                <div className="feature-tag">♿ Wheelchair Accessible</div>
                <div className="feature-tag">📶 Free WiFi</div>
                <div className="feature-tag">❄️ AC Gaming Zone</div>
              </div>
            </div>

            {/* Google Map */}
            <div className="map-container">
              <iframe
                src={contactInfo.googleMapsEmbed}
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '16px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="GameSpot Location"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="info-cards-section">
          <div className="info-card">
            <div className="info-card-icon">🎮</div>
            <h3>Latest Gaming Equipment</h3>
            <p>Experience gaming with PS5, Xbox Series X, and high-end gaming PCs</p>
          </div>
          
          <div className="info-card">
            <div className="info-card-icon">👥</div>
            <h3>Friendly Staff</h3>
            <p>Our expert team is always ready to help you have the best gaming experience</p>
          </div>
          
          <div className="info-card">
            <div className="info-card-icon">🍕</div>
            <h3>Food & Beverages</h3>
            <p>Enjoy snacks and drinks while gaming without leaving your seat</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;
