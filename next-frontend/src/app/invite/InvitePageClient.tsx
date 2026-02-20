'use client';
// @ts-nocheck

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import React from 'react';
import { FaWhatsapp, FaInstagram, FaMapMarkerAlt, FaGamepad, FaClock } from 'react-icons/fa';
import { FiCalendar, FiGift, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import '@/styles/InvitePage.css';
import Image from 'next/image';

function InvitePage() {
  const router = useRouter();

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/917012125919', '_blank', 'noopener');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/gamespot_kdlr', '_blank', 'noopener');
  };

  const handleBookingClick = () => {
    router.push('/');
  };

  const handleGetOffersClick = () => {
    router.push('/get-offers');
  };

  const handleLocationClick = () => {
    window.open('https://maps.app.goo.gl/YourMapLinkHere', '_blank', 'noopener'); // Replace with actual map link
  };

  const cards = [
    {
      icon: <FiCalendar />,
      title: 'Book a Slot',
      desc: 'Reserve your gaming station instantly.',
      color: '#FF6B35',
      btnColor: 'linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%)',
      action: handleBookingClick,
      btnText: 'Book Now',
      delay: 0.1
    },
    {
      icon: <FiGift />,
      title: 'Get Free Hour',
      desc: 'Follow us & unlock free gaming time.',
      color: '#FF9F1C',
      btnColor: 'linear-gradient(135deg, #FF9F1C 0%, #FFC75F 100%)',
      action: handleGetOffersClick,
      btnText: 'Claim Offer',
      delay: 0.2
    },
    {
      icon: <FaWhatsapp />,
      title: 'Chat on WhatsApp',
      desc: 'Questions? We are just a text away.',
      color: '#25D366',
      btnColor: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      action: handleWhatsAppClick,
      btnText: 'Open Chat',
      delay: 0.3
    },
    {
      icon: <FaInstagram />,
      title: 'Follow on Insta',
      desc: 'Catch the latest gaming updates.',
      color: '#E1306C',
      btnColor: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCAF45 100%)',
      action: handleInstagramClick,
      btnText: 'Follow Page',
      delay: 0.4
    },
  ];

  return (
    <div className="invite-page">
      <div className="invite-bg">
        <div className="invite-bg-img"></div>
        <div className="invite-bg-overlay"></div>
        <div className="invite-bg-orb invite-bg-orb-1"></div>
        <div className="invite-bg-orb invite-bg-orb-2"></div>
      </div>

      <div className="invite-content">
        
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="invite-header"
        >
          <div className="invite-logo-container">
            <div className="invite-logo-glow"></div>
            <Image 
              src="/assets/images/logo.png" 
              alt="GameSpot Logo" 
              width={120} 
              height={120} 
              className="invite-main-logo"
              priority
            />
          </div>
          
          <h1 className="invite-title">
            Welcome to <span className="invite-brand">GameSpot</span>
          </h1>
          <p className="invite-sub">
            Kodungallur&apos;s Premium Gaming Experience
          </p>
          
          <div className="invite-badges">
            <span className="invite-badge"><FaGamepad className="badge-icon"/> PS5 & VR</span>
            <span className="invite-badge"><FaClock className="badge-icon"/> Open Daily</span>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <div className="invite-grid">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: card.delay }}
              className="invite-card"
              onClick={card.action}
              whileTap={{ scale: 0.98 }}
            >
              <div className="invite-card-icon-wrap" style={{ background: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
              <div className="invite-card-body">
                <h3 className="invite-card-title">{card.title}</h3>
                <p className="invite-card-desc">{card.desc}</p>
              </div>
              <div className="invite-card-action">
                <div className="invite-action-btn" style={{ background: card.btnColor }}>
                  <FiArrowRight />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="invite-footer"
        >
          <div className="invite-location" onClick={handleLocationClick}>
            <FaMapMarkerAlt className="location-icon" />
            <p>Near Private Bus Stand, Kodungallur</p>
          </div>
          <p className="copyright-text">© {new Date().getFullYear()} GameSpot Gaming Lounge</p>
        </motion.div>
      </div>
    </div>
  );
}

export default InvitePage;
