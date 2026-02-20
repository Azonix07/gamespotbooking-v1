'use client';
// @ts-nocheck

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaWhatsapp, FaInstagram, FaMapMarkerAlt, FaPhoneAlt, FaStar } from 'react-icons/fa';
import { FiCalendar, FiGift, FiArrowRight, FiMonitor, FiNavigation, FiUsers, FiClock, FiZap } from 'react-icons/fi';
import '@/styles/InvitePage.css';
import Image from 'next/image';

function InvitePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWhatsAppClick = () => window.open('https://wa.me/917012125919', '_blank', 'noopener');
  const handleInstagramClick = () => window.open('https://instagram.com/gamespot_kdlr', '_blank', 'noopener');
  const handleBookingClick = () => router.push('/');
  const handleGetOffersClick = () => router.push('/get-offers');
  const handleCallClick = () => window.open('tel:+917012125919');
  const handleLocationClick = () => window.open('https://maps.app.goo.gl/YourMapLinkHere', '_blank', 'noopener');

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

      <div className="inv__container">
        {/* ════════════ LEFT / TOP — HERO ════════════ */}
        <div className="inv__left">
          <div className="inv__left-inner">
            {/* Logo */}
            <div className="inv__logo-ring">
              <div className="inv__logo-ring-inner">
                <Image
                  src="/assets/images/logo.png"
                  alt="GameSpot Logo"
                  width={120}
                  height={120}
                  className="inv__logo-img"
                  priority
                />
              </div>
            </div>

            <h1 className="inv__title">
              Game<span className="inv__title-accent">Spot</span>
            </h1>
            <p className="inv__tagline">Kodungallur&apos;s Premium Gaming Lounge</p>

            <div className="inv__chips">
              <span className="inv__chip"><FiMonitor className="inv__chip-ico" /> 3× PS5</span>
              <span className="inv__chip"><FiNavigation className="inv__chip-ico" /> Racing Sim</span>
              <span className="inv__chip"><FiUsers className="inv__chip-ico" /> Multiplayer</span>
            </div>

            {/* Desktop-only features list */}
            <div className="inv__features">
              <div className="inv__feature">
                <div className="inv__feature-ico">🎮</div>
                <div>
                  <strong>PlayStation 5 Consoles</strong>
                  <p>3 dedicated units · 1–4 players each · latest titles</p>
                </div>
              </div>
              <div className="inv__feature">
                <div className="inv__feature-ico">🏎️</div>
                <div>
                  <strong>Professional Racing Simulator</strong>
                  <p>Steering wheel &amp; pedals · immersive experience</p>
                </div>
              </div>
              <div className="inv__feature">
                <div className="inv__feature-ico">⚡</div>
                <div>
                  <strong>Instant Online Booking</strong>
                  <p>No calls needed · pick your time · pay at venue</p>
                </div>
              </div>
            </div>

            {/* Location — desktop */}
            <div className="inv__loc-desktop" onClick={handleLocationClick}>
              <FaMapMarkerAlt />
              <span>Near Private Bus Stand, Kodungallur, Thrissur</span>
            </div>
          </div>
        </div>

        {/* ════════════ RIGHT / BOTTOM — ACTIONS ════════════ */}
        <div className="inv__right">
          <div className="inv__card">
            <div className="inv__card-header">
              <FaStar className="inv__card-header-star" />
              <span>Quick Links</span>
            </div>

            {/* Book Now — Hero CTA */}
            <div className="inv__cta" onClick={handleBookingClick}>
              <div className="inv__cta-left">
                <div className="inv__cta-icon">
                  <FiCalendar />
                </div>
                <div>
                  <span className="inv__cta-label">Book Your Session</span>
                  <span className="inv__cta-sub">Reserve a slot &amp; start playing</span>
                </div>
              </div>
              <FiArrowRight className="inv__cta-arrow" />
            </div>

            {/* Get Offers CTA */}
            <div className="inv__cta inv__cta--offer" onClick={handleGetOffersClick}>
              <div className="inv__cta-left">
                <div className="inv__cta-icon inv__cta-icon--offer">
                  <FiGift />
                </div>
                <div>
                  <span className="inv__cta-label">Get a Free Hour</span>
                  <span className="inv__cta-sub">Follow on Instagram &amp; claim reward</span>
                </div>
              </div>
              <FiArrowRight className="inv__cta-arrow" />
            </div>

            {/* Divider */}
            <div className="inv__divider">
              <span>Connect with us</span>
            </div>

            {/* Social / Contact buttons */}
            <div className="inv__socials">
              <button className="inv__social inv__social--wa" onClick={handleWhatsAppClick}>
                <FaWhatsapp className="inv__social-ico" />
                <span>WhatsApp</span>
              </button>
              <button className="inv__social inv__social--ig" onClick={handleInstagramClick}>
                <FaInstagram className="inv__social-ico" />
                <span>Instagram</span>
              </button>
              <button className="inv__social inv__social--call" onClick={handleCallClick}>
                <FaPhoneAlt className="inv__social-ico" />
                <span>Call Us</span>
              </button>
              <button className="inv__social inv__social--loc" onClick={handleLocationClick}>
                <FaMapMarkerAlt className="inv__social-ico" />
                <span>Directions</span>
              </button>
            </div>

            {/* Info banner — mobile only */}
            <div className="inv__mobile-info">
              <div className="inv__mobile-info-row">
                <span className="inv__mobile-info-emoji">🎮</span>
                <span>3× PS5 · 1–4 players each</span>
              </div>
              <div className="inv__mobile-info-row">
                <span className="inv__mobile-info-emoji">🏎️</span>
                <span>Racing Sim · Pro Setup</span>
              </div>
              <div className="inv__mobile-info-row">
                <span className="inv__mobile-info-emoji">⚡</span>
                <span>Online booking · Pay at venue</span>
              </div>
            </div>

            {/* Timing */}
            <div className="inv__timing">
              <FiClock className="inv__timing-ico" />
              <span>Open daily · Walk-ins welcome</span>
            </div>
          </div>

          {/* Footer */}
          <p className="inv__copyright">© {new Date().getFullYear()} GameSpot Gaming Lounge · Kodungallur</p>
        </div>
      </div>
    </div>
  );
}

export default InvitePage;
