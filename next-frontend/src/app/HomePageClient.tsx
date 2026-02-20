'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCpu } from 'react-icons/fi';
import '@/styles/HomePage.css';
import '@/styles/SplashScreen.css';

const AIChat = lazy(() => import('@/components/AIChat'));

/**
 * Pick the right video variant based on device capability.
 * - Low-end mobile / slow connection / data-saver → 360p (772 KB)
 * - Tablet or mid-range mobile → 480p (1.5 MB)
 * - Desktop / high-end → 720p (2.8 MB)
 * The original 4K file is never served — it's kept only as a source master.
 */
function getOptimalVideoSrc(): string {
  if (typeof window === 'undefined') return '/assets/videos/background-720p.mp4';

  const w = window.screen.width;
  const dpr = window.devicePixelRatio || 1;
  const effectiveW = w * Math.min(dpr, 2); // cap DPR at 2 for video selection
  const cores = navigator.hardwareConcurrency || 2;
  const mem = (navigator as any).deviceMemory || 4; // GB — Chrome-only, fallback 4

  // Check for data-saver mode (Save-Data header hint via JS)
  const conn = (navigator as any).connection;
  const saveData = conn?.saveData === true;
  const slowConn = conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g');

  // Tier 1: Low-end — small screen, few cores, low memory, or slow network
  if (saveData || slowConn || cores <= 2 || mem <= 2 || effectiveW <= 640) {
    return '/assets/videos/background-360p.mp4';
  }

  // Tier 2: Mid-range — tablet, mid-tier phone
  if (effectiveW <= 1024 || cores <= 4 || mem <= 4) {
    return '/assets/videos/background-480p.mp4';
  }

  // Tier 3: Desktop / high-end
  return '/assets/videos/background-720p.mp4';
}

export default function HomePageClient() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Pick optimal video on mount (client-side only) */
  useEffect(() => {
    setVideoSrc(getOptimalVideoSrc());
  }, []);

  /* Dismiss splash: start exit animation, then remove from DOM */
  const dismissSplash = useCallback(() => {
    if (splashExiting) return; // prevent double-trigger
    setSplashExiting(true);
    setTimeout(() => setSplashDone(true), 500); // match exit animation duration
  }, [splashExiting]);

  /* Video loaded — dismiss splash */
  const handleVideoReady = useCallback(() => {
    setVideoLoaded(true);
    // Small delay to let the first frame paint before removing splash
    requestAnimationFrame(() => dismissSplash());
  }, [dismissSplash]);

  /* Safety fallback: if video takes too long (>4s), dismiss splash anyway */
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!splashDone && !splashExiting) {
        dismissSplash();
      }
    }, 4000); // reduced from 6s → 4s since videos are much smaller now
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
      {/* Video Background — adaptive resolution based on device capability */}
      {videoSrc && (
        <video
          ref={videoRef}
          className="hero-background-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/assets/videos/poster.jpg"
          onCanPlayThrough={handleVideoReady}
          onCanPlay={handleVideoReady}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Dark Overlay */}
      <div className="hero-video-overlay"></div>

      {/* Main Content — this is the LCP element */}
      <div className="hero-content">
        {/* SEO: visually-hidden H1 for search engines — logo serves as visual heading */}
        <h1 className="sr-only">GameSpot – Best Gaming Lounge in Kodungallur | PS5, GTA, VR &amp; Driving Simulator near Thrissur</h1>
        <Image
          src="/assets/images/logo.png"
          alt="GameSpot Kodungallur – Best Gaming Lounge for PS5, GTA, VR & Driving Simulator near Thrissur, Kerala"
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

        {/* Console Icons — next/image for ps5 & meta; plain img for xbox to preserve clarity */}
        <div className="console-icons-container">
          <Image src="/assets/images/ps5Icon.png" alt="PS5 gaming in Kodungallur" className="console-icon ps5-icon" width={48} height={48} loading="lazy" />
          <div className="console-separator">|</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/xboxIcon.png" alt="Xbox Series X gaming in Kodungallur" className="console-icon xbox-icon" loading="lazy" />
          <div className="console-separator">|</div>
          <Image src="/assets/images/metaIcon.png" alt="VR gaming in Kodungallur near Thrissur" className="console-icon meta-icon" width={48} height={48} loading="lazy" />
        </div>
      </div>

    </div>

    {/* AI Chat FAB — outside hero-container so overflow:hidden doesn't clip it */}
    {splashDone && (
      <button
        className="fab-button fab-ai-chat"
        onClick={() => setShowAIChat(true)}
        aria-label="Book with AI"
        title="Book with AI"
      >
        <FiCpu className="fab-icon" />
      </button>
    )}

    {showAIChat && (
      <Suspense fallback={<div>Loading AI...</div>}>
        <AIChat onClose={() => setShowAIChat(false)} />
      </Suspense>
    )}
    </>
  );
}
