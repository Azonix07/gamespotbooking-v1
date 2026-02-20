'use client';
// @ts-nocheck

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaWhatsapp, FaInstagram, FaMapMarkerAlt, FaGamepad, FaClock, FaPhoneAlt } from 'react-icons/fa';
import { FiCalendar, FiGift, FiArrowRight, FiMonitor, FiNavigation } from 'react-icons/fi';
import '@/styles/InvitePage.css';
import Image from 'next/image';

function InvitePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleCallClick = () => {
    window.open('tel:+917012125919');
  };

  const handleLocationClick = () => {
    window.open('https://maps.app.goo.gl/YourMapLinkHere', '_blank', 'noopener');
  };

  return (
    <div className={`inv ${mounted ? 'inv--visible' : ''}`}>
      {/* Background */}
      <div className="inv__bg">
        <div className="inv__bg-grad"></div>
        <div className="inv__bg-pattern"></div>
        <div className="inv__bg-orb inv__bg-orb--1"></div>
        <div className="inv__bg-orb inv__bg-orb--2"></div>
        <div className="inv__bg-orb inv__bg-orb--3"></div>
      </div>

      <div className="inv__wrap">

        {/* ── Hero Section ── */}
        <header className="inv__hero">
          <div className="inv__logo-ring">
            <div className="inv__logo-ring-inner">
              <Image
                src="/assets/images/logo.png"
                alt="GameSpot Logo"
                width={100}
                height={100}
                className="inv__logo-img"
                priority
              />
            </div>
          </div>

          <h1 className="inv__title">
            Game<span className="inv__title-accent">Spot</span>
          </h1>
          <p className="inv__tagline">Premium Gaming Lounge</p>

          <div className="inv__chips">
            <span className="inv__chip">
              <FiMonitor className="inv__chip-ico" /> PS5 Gaming
            </span>
            <span className="inv__chip">
              <FiNavigation className="inv__chip-ico" /> Racing Sim
            </span>
            <span className="inv__chip">
              <FaClock className="inv__chip-ico" /> Open Daily
            </span>
          </div>
        </header>

        {/* ── Primary CTA ── */}
        <div className="inv__cta-primary" onClick={handleBookingClick}>
          <div className="inv__cta-primary-content">
            <FiCalendar className="inv__cta-primary-ico" />
            <div>
              <span className="inv__cta-primary-label">Book Your Session</span>
              <span className="inv__cta-primary-sub">Pick a slot &amp; start playing</span>
            </div>
          </div>
          <FiArrowRight className="inv__cta-primary-arrow" />
        </div>

        {/* ── Quick Actions ── */}
        <div className="inv__actions">
          <div className="inv__action" onClick={handleGetOffersClick}>
            <div className="inv__action-ico inv__action-ico--offer">
              <FiGift />
            </div>
            <span className="inv__action-text">Free Hour</span>
          </div>
          <div className="inv__action" onClick={handleWhatsAppClick}>
            <div className="inv__action-ico inv__action-ico--wa">
              <FaWhatsapp />
            </div>
            <span className="inv__action-text">WhatsApp</span>
          </div>
          <div className="inv__action" onClick={handleInstagramClick}>
            <div className="inv__action-ico inv__action-ico--ig">
              <FaInstagram />
            </div>
            <span className="inv__action-text">Instagram</span>
          </div>
          <div className="inv__action" onClick={handleCallClick}>
            <div className="inv__action-ico inv__action-ico--call">
              <FaPhoneAlt />
            </div>
            <span className="inv__action-text">Call Us</span>
          </div>
        </div>

        {/* ── Info Card ── */}
        <div className="inv__info-card">
          <h3 className="inv__info-title">What We Offer</h3>
          <div className="inv__info-items">
            <div className="inv__info-item">
              <span className="inv__info-emoji">🎮</span>
              <div>
                <strong>PlayStation 5</strong>
                <p>3 units · 1–4 players each</p>
              </div>
            </div>
            <div className="inv__info-item">
              <span className="inv__info-emoji">🏎️</span>
              <div>
                <strong>Racing Simulator</strong>
                <p>Pro wheel &amp; pedal setup</p>
              </div>
            </div>
            <div className="inv__info-item">
              <span className="inv__info-emoji">⚡</span>
              <div>
                <strong>Instant Booking</strong>
                <p>No calls needed · online slots</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="inv__footer">
          <div className="inv__footer-loc" onClick={handleLocationClick}>
            <FaMapMarkerAlt />
            <span>Near Private Bus Stand, Kodungallur</span>
          </div>
          <p className="inv__footer-copy">© {new Date().getFullYear()} GameSpot Gaming Lounge</p>
        </footer>

      </div>
    </div>
  );
}

export default InvitePage;
