'use client';
// @ts-nocheck

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiPhone, FiMail, FiMapPin, FiClock, FiCopy, FiCheck,
  FiSend, FiInstagram, FiFacebook, FiTwitter, FiStar,
  FiChevronRight, FiNavigation, FiMessageCircle, FiZap,
  FiMonitor, FiUsers, FiWifi, FiArrowRight, FiExternalLink, FiHeart
} from 'react-icons/fi';
import { FaWhatsapp, FaParking, FaSnowflake } from 'react-icons/fa';
import { IoGameController } from 'react-icons/io5';
import '@/styles/ContactPage.css';

const ContactPage = () => {
  const [copied, setCopied] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [activeQuickMsg, setActiveQuickMsg] = useState(null);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [currentStat, setCurrentStat] = useState(0);
  const sectionRefs = useRef({});

  const contactInfo = {
    phone: '+91 70121 25919',
    email: 'contact@gamespot.com',
    address: 'GameSpot Gaming Lounge',
    addressLine2: 'Near KSRTC Bus Stand',
    city: 'Kodungallur',
    district: 'Thrissur',
    state: 'Kerala',
    pincode: '680664',
    fullAddress: 'GameSpot Gaming Lounge, Near KSRTC Bus Stand, Kodungallur, Thrissur, Kerala 680664',
    instagram: '@gamespot_kdlr',
    facebook: 'GameSpotOfficial',
    twitter: '@GameSpotIndia',
    whatsappNumber: '917012125919',
    googleMapsLink: 'https://maps.app.goo.gl/SZR9uXT92GYof6LRA',
    googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4019.3577938775693!2d76.19629983498955!3d10.225511276423111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b081beb62009d5d%3A0x30e7c01503a70001!2sGameSpot!5e0!3m2!1sen!2sin!4v1770449440208!5m2!1sen!2sin',
    rating: 4.8,
    totalReviews: 326,
    workingHours: {
      weekdays: '10:00 AM – 11:00 PM',
      weekends: '9:00 AM – 12:00 AM',
      special: '9:00 AM – 1:00 AM'
    },
    landmark: 'Near KSRTC Bus Stand, Kodungallur'
  };

  const stats = [
    { value: '4.8★', label: 'Google Rating' },
    { value: '326+', label: 'Happy Reviews' },
    { value: '5000+', label: 'Gamers Served' },
    { value: '24/7', label: 'WhatsApp Support' },
  ];

  const quickMessages = [
    { id: 'packages', emoji: '📦', label: 'Packages', text: "Hi! I'd like to know about your gaming packages and pricing." },
    { id: 'book', emoji: '🎮', label: 'Book Session', text: "Hello! I want to book a gaming session. What slots are available?" },
    { id: 'offers', emoji: '🎁', label: 'Offers', text: "Hi! What are your current offers and discounts?" },
    { id: 'birthday', emoji: '🎂', label: 'Birthday', text: "Hi! I'd like to organize a birthday party at GameSpot. Can you share the details?" },
    { id: 'college', emoji: '🎓', label: 'College Event', text: "Hello! We're interested in booking GameSpot for our college fest. Can we discuss?" },
    { id: 'vr', emoji: '🥽', label: 'VR Info', text: "Hi! I want to try the VR experience. Is it available today?" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, (entry.target as HTMLElement).dataset.section]));
          }
        });
      },
      { threshold: 0.12 }
    );
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentStat((p) => (p + 1) % stats.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleWhatsAppSend = () => {
    if (whatsappMessage.trim()) {
      window.open(`https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
      setWhatsappMessage('');
      setCharCount(0);
      setActiveQuickMsg(null);
    }
  };

  const handleMessageChange = (e) => {
    if (e.target.value.length <= 500) {
      setWhatsappMessage(e.target.value);
      setCharCount(e.target.value.length);
      setActiveQuickMsg(null);
    }
  };

  const handleQuickMessage = (msg) => {
    setWhatsappMessage(msg.text);
    setCharCount(msg.text.length);
    setActiveQuickMsg(msg.id);
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <FiStar key={i} className={`star ${i < Math.floor(rating) ? 'filled' : i < rating ? 'half-filled' : ''}`} />
    ));

  return (
    <div className="contact-page">
{/* ═══ HERO ═══ */}
      <section className="contact-hero">
        <div className="contact-hero-bg">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-grid-pattern" />
        </div>
        <motion.div
          className="contact-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="contact-hero-badge"><FiMessageCircle /> Let's Connect</div>
          <h1 className="contact-hero-title">Get In <span className="text-gradient">Touch</span></h1>
          <p className="contact-hero-subtitle">
            Reach out through WhatsApp, phone, or visit us at our gaming lounge in Kodungallur.
          </p>
          <div className="contact-hero-stats">
            {stats.map((stat, idx) => (
              <div key={idx} className={`hero-stat ${idx === currentStat ? 'active' : ''}`}>
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="contact-hero-actions">
            <a href={`https://wa.me/${contactInfo.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hero-action-btn whatsapp-action">
              <FaWhatsapp /> WhatsApp Us
            </a>
            <a href={`tel:${contactInfo.phone}`} className="hero-action-btn call-action">
              <FiPhone /> Call Now
            </a>
            <a href={contactInfo.googleMapsLink} target="_blank" rel="noopener noreferrer" className="hero-action-btn directions-action">
              <FiNavigation /> Directions
            </a>
          </div>
        </motion.div>
      </section>

      <div className="contact-main-container">

        {/* ═══ CONTACT CARDS ═══ */}
        <section className={`contact-section ${visibleSections.has('cards') ? 'visible' : ''}`} data-section="cards" ref={(el) => (sectionRefs.current.cards = el)}>
          <div className="quick-contact-grid">
            {/* WhatsApp Card */}
            <div className="contact-card whatsapp-card">
              <div className="card-glow whatsapp-glow" />
              <div className="card-icon-header">
                <div className="card-icon-wrap whatsapp-icon-wrap"><FaWhatsapp className="card-main-icon" /></div>
                <div>
                  <h3>WhatsApp Us</h3>
                  <span className="card-status online">● Online Now</span>
                </div>
              </div>
              <p className="card-description">Send us a message for instant support — we reply within minutes!</p>
              <div className="quick-message-chips">
                {quickMessages.map((msg) => (
                  <button key={msg.id} className={`chip ${activeQuickMsg === msg.id ? 'active' : ''}`} onClick={() => handleQuickMessage(msg)}>
                    <span className="chip-emoji">{msg.emoji}</span>{msg.label}
                  </button>
                ))}
              </div>
              <div className="whatsapp-input-section">
                <textarea className="whatsapp-textarea" placeholder="Type your message here..." value={whatsappMessage} onChange={handleMessageChange} rows="3" />
                <div className="textarea-footer">
                  <span className={`char-counter ${charCount > 400 ? 'warn' : ''}`}>{charCount}/500</span>
                </div>
              </div>
              <button className="whatsapp-send-btn" onClick={handleWhatsAppSend} disabled={!whatsappMessage.trim()}>
                <FiSend /> Send on WhatsApp <FiArrowRight className="btn-arrow" />
              </button>
            </div>

            {/* Phone Card */}
            <div className="contact-card phone-card">
              <div className="card-glow phone-glow" />
              <div className="card-icon-header">
                <div className="card-icon-wrap phone-icon-wrap"><FiPhone className="card-main-icon" /></div>
                <div>
                  <h3>Call Us Directly</h3>
                  <span className="card-status available">● Available</span>
                </div>
              </div>
              <p className="card-description">Speak directly with our team for bookings, enquiries, or support.</p>
              <div className="phone-display">
                <div className="phone-number-wrap">
                  <span className="phone-flag">🇮🇳</span>
                  <span className="phone-number">{contactInfo.phone}</span>
                </div>
                <button className={`copy-btn ${copied === 'phone' ? 'copied' : ''}`} onClick={() => handleCopy(contactInfo.phone, 'phone')}>
                  {copied === 'phone' ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy</>}
                </button>
              </div>
              <a href={`tel:${contactInfo.phone}`} className="call-now-btn">
                <FiPhone /> Call Now — It's Free <FiArrowRight className="btn-arrow" />
              </a>
              <div className="working-hours-card">
                <div className="hours-header"><FiClock className="hours-header-icon" /><span>Working Hours</span></div>
                <div className="hours-grid">
                  <div className="hours-row"><span className="hours-day">Mon – Fri</span><div className="hours-dots" /><span className="hours-time">{contactInfo.workingHours.weekdays}</span></div>
                  <div className="hours-row"><span className="hours-day">Sat – Sun</span><div className="hours-dots" /><span className="hours-time weekend">{contactInfo.workingHours.weekends}</span></div>
                  <div className="hours-row special"><span className="hours-day">🎉 Holidays</span><div className="hours-dots" /><span className="hours-time weekend">{contactInfo.workingHours.special}</span></div>
                </div>
              </div>
              <a href={`mailto:${contactInfo.email}`} className="email-quick-link">
                <FiMail /><span>{contactInfo.email}</span><FiExternalLink className="email-arrow" />
              </a>
            </div>
          </div>
        </section>

        {/* ═══ SOCIALS ═══ */}
        <section className={`contact-section ${visibleSections.has('social') ? 'visible' : ''}`} data-section="social" ref={(el) => (sectionRefs.current.social = el)}>
          <div className="section-header">
            <div className="section-badge"><FiHeart /> Community</div>
            <h2 className="section-title">Follow Our <span className="text-gradient">Gaming Journey</span></h2>
            <p className="section-subtitle">Stay updated with events, offers, and gaming highlights</p>
          </div>
          <div className="social-cards-grid">
            {[
              { href: `https://instagram.com/${contactInfo.instagram.replace('@', '')}`, cls: 'instagram-card', Icon: FiInstagram, name: 'Instagram', handle: contactInfo.instagram, action: 'Follow' },
              { href: `https://facebook.com/${contactInfo.facebook}`, cls: 'facebook-card', Icon: FiFacebook, name: 'Facebook', handle: contactInfo.facebook, action: 'Like' },
              { href: `https://twitter.com/${contactInfo.twitter.replace('@', '')}`, cls: 'twitter-card', Icon: FiTwitter, name: 'Twitter / X', handle: contactInfo.twitter, action: 'Follow' },
              { href: `https://wa.me/${contactInfo.whatsappNumber}`, cls: 'whatsapp-social-card', Icon: FaWhatsapp, name: 'WhatsApp', handle: 'Chat Now', action: 'Open' },
            ].map(({ href, cls, Icon, name, handle, action }) => (
              <a key={cls} href={href} target="_blank" rel="noopener noreferrer" className={`social-card ${cls}`}>
                <div className="social-card-bg" />
                <Icon className="social-icon" />
                <div className="social-info"><div className="social-name">{name}</div><div className="social-handle">{handle}</div></div>
                <div className="social-follow-tag">{action}</div>
                <FiChevronRight className="social-arrow" />
              </a>
            ))}
          </div>
        </section>

        {/* ═══ LOCATION & MAP ═══ */}
        <section className={`contact-section ${visibleSections.has('location') ? 'visible' : ''}`} data-section="location" ref={(el) => (sectionRefs.current.location = el)}>
          <div className="section-header">
            <div className="section-badge"><FiMapPin /> Location</div>
            <h2 className="section-title">Visit <span className="text-gradient">GameSpot</span></h2>
            <p className="section-subtitle">Find us easily — we're right near KSRTC Bus Stand, Kodungallur</p>
          </div>
          <div className="location-layout">
            <div className="map-container">
              <iframe
                src={contactInfo.googleMapsEmbed}
                width="100%" height="100%" style={{ border: 0 }}
                allowFullScreen="" loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="GameSpot Location — Kodungallur, Kerala"
              />
              <div className="map-overlay-badge"><FiMapPin /> GameSpot, Kodungallur</div>
            </div>
            <div className="location-grid">
              <div className="location-card address-loc-card">
                <div className="location-card-icon"><FiMapPin /></div>
                <div className="location-card-content">
                  <h4>Our Address</h4>
                  <p className="location-card-main">{contactInfo.address}</p>
                  <p className="location-card-sub">{contactInfo.addressLine2}</p>
                  <p className="location-card-sub">{contactInfo.city}, {contactInfo.district}, {contactInfo.state} - {contactInfo.pincode}</p>
                </div>
                <button className={`location-card-action ${copied === 'address' ? 'copied' : ''}`} onClick={() => handleCopy(contactInfo.fullAddress, 'address')}>
                  {copied === 'address' ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
              <div className="location-card rating-loc-card">
                <div className="location-card-icon rating-icon"><FiStar /></div>
                <div className="location-card-content">
                  <h4>Google Rating</h4>
                  <div className="rating-display">
                    <span className="rating-big">{contactInfo.rating}</span>
                    <div className="rating-details"><div className="stars-row">{renderStars(contactInfo.rating)}</div><span className="rating-count">{contactInfo.totalReviews} reviews</span></div>
                  </div>
                </div>
              </div>
              <div className="location-card landmark-loc-card">
                <div className="location-card-icon landmark-icon"><FiNavigation /></div>
                <div className="location-card-content">
                  <h4>Landmark</h4>
                  <p className="location-card-main">{contactInfo.landmark}</p>
                  <p className="location-card-sub">Easy to find — 2 min from the bus stand</p>
                </div>
              </div>
              <div className="location-card hours-loc-card">
                <div className="location-card-icon hours-mini-icon"><FiClock /></div>
                <div className="location-card-content">
                  <h4>Open Today</h4>
                  <p className="location-card-main open-status"><span className="open-dot" /> Open Now</p>
                  <p className="location-card-sub">{new Date().getDay() === 0 || new Date().getDay() === 6 ? contactInfo.workingHours.weekends : contactInfo.workingHours.weekdays}</p>
                </div>
              </div>
            </div>
            <div className="location-actions-row">
              <a href={contactInfo.googleMapsLink} target="_blank" rel="noopener noreferrer" className="location-action-btn primary-loc-action">
                <FiNavigation /> Get Directions on Google Maps
              </a>
              <a href={`https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent("Hi! I'm on my way to GameSpot. Can you share the exact location?")}`} target="_blank" rel="noopener noreferrer" className="location-action-btn secondary-loc-action">
                <FaWhatsapp /> Ask for Location Help
              </a>
            </div>
          </div>
        </section>

        {/* ═══ WHY VISIT ═══ */}
        <section className={`contact-section ${visibleSections.has('features') ? 'visible' : ''}`} data-section="features" ref={(el) => (sectionRefs.current.features = el)}>
          <div className="section-header">
            <div className="section-badge"><FiZap /> Experience</div>
            <h2 className="section-title">Why Visit <span className="text-gradient">GameSpot?</span></h2>
            <p className="section-subtitle">Premium gaming experience in the heart of Kodungallur</p>
          </div>
          <div className="features-grid">
            {[
              { Icon: IoGameController, title: 'Latest Consoles', desc: 'PS5, Xbox Series X, and high-end gaming PCs with 4K monitors', cls: '' },
              { Icon: FiMonitor, title: 'VR Experience', desc: 'Immersive virtual reality — Beat Saber, Half-Life Alyx & more', cls: 'vr-icon' },
              { Icon: FiUsers, title: 'Party & Events', desc: 'Birthday parties, college events, and private gaming sessions', cls: 'party-icon' },
              { Icon: FaSnowflake, title: 'AC Gaming Zone', desc: 'Fully air-conditioned with premium gaming chairs & ambiance', cls: 'comfort-icon' },
              { Icon: FiWifi, title: 'Free WiFi', desc: 'Blazing fast internet for seamless online multiplayer gaming', cls: 'wifi-icon' },
              { Icon: FaParking, title: 'Free Parking', desc: 'Convenient parking space available right outside the lounge', cls: 'parking-icon' },
            ].map(({ Icon, title, desc, cls }) => (
              <div key={title} className="feature-card">
                <div className={`feature-icon-wrap ${cls}`}><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating WhatsApp */}
      <a href={`https://wa.me/${contactInfo.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="floating-whatsapp" aria-label="Chat on WhatsApp">
        <FaWhatsapp /><span className="floating-pulse" />
      </a>
</div>
  );
};

export default ContactPage;
