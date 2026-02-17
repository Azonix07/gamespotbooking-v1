'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCpu } from 'react-icons/fi';
import '@/styles/HomePage.css';
import '@/styles/SplashScreen.css';

const AIChat = lazy(() => import('@/components/AIChat'));

export default function HomePageClient() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Dismiss splash: start exit animation, then remove from DOM */
  const dismissSplash = useCallback(() => {
    if (splashExiting) return; // prevent double-trigger
    setSplashExiting(true);
    setTimeout(() => setSplashDone(true), 500); // match exit animation duration
  }, [splashExiting]);

  /* Video loaded — dismiss splash */
  const handleVideoReady = useCallback(() => {
    setVideoLoaded(true);
    dismissSplash();
  }, [dismissSplash]);

  /* Safety fallback: if video takes too long (>6s), dismiss splash anyway */
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!splashDone && !splashExiting) {
        dismissSplash();
      }
    }, 6000);
    return () => clearTimeout(fallback);
  }, [splashDone, splashExiting, dismissSplash]);

  return (
    <>
    {/* SPLASH SCREEN */}
    {!splashDone && (
      <div className={`splash-screen ${splashExiting ? 'splash-exit' : ''}`}>
        {/* Background Effects */}
        <div className="splash-bg-grid" />
        <div className="splash-glow splash-glow-1" />
        <div className="splash-glow splash-glow-2" />

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
            <div className={`splash-progress-fill ${videoLoaded ? 'splash-progress-complete' : ''}`} />
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
      {/* Video Background — starts loading immediately, splash waits for it */}
      <video
        ref={videoRef}
        className="hero-background-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={handleVideoReady}
      >
        <source src="/assets/videos/background.mp4" type="video/mp4" />
      </video>

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

        <p className="hero-subtitle">
          <span className="hero-subtitle-full">Experience Next-Generation Gaming</span>
          <span className="hero-subtitle-mobile">Next-Gen Gaming Awaits</span>
        </p>
        <p className="hero-subtitle2">
          <span className="hero-subtitle2-full">Premium Consoles • Professional Setup • Ultimate Entertainment</span>
          <span className="hero-subtitle2-mobile">PS5 • Xbox • VR</span>
        </p>

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
