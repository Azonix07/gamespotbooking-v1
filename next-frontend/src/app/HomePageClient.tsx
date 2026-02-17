'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCpu } from 'react-icons/fi';
import '@/styles/HomePage.css';
import '@/styles/SplashScreen.css';

const AIChat = lazy(() => import('@/components/AIChat'));

export default function HomePageClient() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);

  /* Splash screen — show for 2s then reveal homepage */
  useEffect(() => {
    const exitTimer = setTimeout(() => setSplashExiting(true), 1800);
    const doneTimer = setTimeout(() => setSplashDone(true), 2300);
    return () => { clearTimeout(exitTimer); clearTimeout(doneTimer); };
  }, []);

  /* Defer video load — wait for splash to finish before loading 13MB video */
  useEffect(() => {
    if (splashDone) {
      const timer = setTimeout(() => setVideoReady(true), 200);
      return () => clearTimeout(timer);
    }
  }, [splashDone]);

  return (
    <>
    {/* SPLASH SCREEN */}
    {!splashDone && (
      <div className={`splash-screen ${splashExiting ? 'splash-exit' : ''}`}>
        {/* Background Effects */}
        <div className="splash-bg-grid" />
        <div className="splash-glow splash-glow-1" />
        <div className="splash-glow splash-glow-2" />
        <div className="splash-scanline" />

        {/* Content */}
        <div className="splash-content">
          {/* Logo */}
          <div className="splash-logo-wrap">
            <Image
              src="/assets/images/logo.png"
              alt="GameSpot"
              className="splash-logo"
              width={320}
              height={60}
              priority
            />
          </div>

          {/* Tagline */}
          <p className="splash-tagline">LOADING EXPERIENCE</p>

          {/* Progress Bar */}
          <div className="splash-progress-track">
            <div className="splash-progress-fill" />
            <div className="splash-progress-glow" />
          </div>

          {/* Console Icons */}
          <div className="splash-consoles">
            <span className="splash-console-dot" />
            <span className="splash-console-label">PS5</span>
            <span className="splash-console-sep">•</span>
            <span className="splash-console-label">XBOX</span>
            <span className="splash-console-sep">•</span>
            <span className="splash-console-label">VR</span>
            <span className="splash-console-dot" />
          </div>
        </div>

        {/* Bottom Branding */}
        <p className="splash-brand">GAMESPOT KODUNGALLUR</p>
      </div>
    )}

    {/* MAIN HOMEPAGE */}
    <div className={`hero-container ${splashDone ? 'hero-revealed' : 'hero-hidden'}`}>
      {/* Video Background — deferred 1.5s to not block LCP */}
      {videoReady && (
        <video
          className="hero-background-video"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster=""
        >
          <source src="/assets/videos/background.mp4" type="video/mp4" />
        </video>
      )}

      {/* Dark Overlay */}
      <div className="hero-video-overlay"></div>

      {/* Main Content — this is the LCP element */}
      <div className="hero-content">
        <Image
          src="/assets/images/logo.png"
          alt="GameSpot Logo"
          className="hero-logo"
          width={400}
          height={75}
          priority
          quality={85}
          sizes="(max-width: 480px) 280px, (max-width: 768px) 340px, 400px"
          fetchPriority="high"
        />

        <p className="hero-subtitle">Experience Next-Generation Gaming</p>
        <p className="hero-subtitle2">Premium Consoles • Professional Setup • Ultimate Entertainment</p>

        <Link href="/booking" className="cta-book-now-button" prefetch>
          BOOK NOW
        </Link>

        {/* Console Icons — plain <img> for crisp rendering (small sprites <6KB each) */}
        <div className="console-icons-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/ps5Icon.png" alt="PlayStation 5" className="console-icon ps5-icon" loading="lazy" />
          <div className="console-separator">|</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/xboxIcon.png" alt="Xbox Series X" className="console-icon xbox-icon" loading="lazy" />
          <div className="console-separator">|</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/metaIcon.png" alt="Meta Quest VR" className="console-icon meta-icon" loading="lazy" />
        </div>
      </div>

      {/* AI Chat FAB */}
      <button
        className="fab-button fab-ai-chat"
        onClick={() => setShowAIChat(true)}
        aria-label="Book with AI"
        title="Book with AI"
      >
        <FiCpu className="fab-icon" />
      </button>

      {showAIChat && (
        <Suspense fallback={<div>Loading AI...</div>}>
          <AIChat onClose={() => setShowAIChat(false)} />
        </Suspense>
      )}
    </div>
    </>
  );
}
