'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCpu } from 'react-icons/fi';
import '@/styles/HomePage.css';
import '@/styles/SplashScreen.css';

const AIChat = lazy(() => import('@/components/AIChat'));

/**
 * Progressive video quality upgrade — NO HLS, NO stutter.
 *
 * Strategy:
 *  1. Poster image shows instantly (109 KB)
 *  2. 360p MP4 loads first (1 MB) — plays within ~2s on any connection
 *  3. Once 360p is playing, we silently preload 720p in a hidden <video>
 *  4. When 720p is fully buffered, we crossfade to it — zero stutter
 *
 * On low-end mobile (< 4 GB RAM or "slow" connection hint), we skip
 * the upgrade and stay on 360p forever to keep things silky smooth.
 */
const VIDEO_360 = '/assets/videos/background-360p.mp4';
const VIDEO_480 = '/assets/videos/background-480p.mp4';
const VIDEO_720 = '/assets/videos/background-720p.mp4';

/** Pick the upgrade target based on device capabilities */
function getUpgradeTarget(): string | null {
  if (typeof window === 'undefined') return null;

  // Detect low-end devices — skip upgrade entirely
  const nav = navigator as any;
  const memoryGB = nav.deviceMemory ?? 8; // defaults to 8 if unknown
  const conn = nav.connection ?? {};
  const saveData = conn.saveData === true;
  const effectiveType = conn.effectiveType ?? '4g';

  // Data-saver mode or very slow connection — stay on 360p
  if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') return null;

  // Low memory device — stay on 360p
  if (memoryGB <= 2) return null;

  // 3G or low memory — upgrade to 480p only
  if (effectiveType === '3g' || memoryGB <= 4) return VIDEO_480;

  // Everything else (4G, WiFi, desktop) — upgrade to 720p
  return VIDEO_720;
}

export default function HomePageClient() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);       // primary (360p initially)
  const upgradeVideoRef = useRef<HTMLVideoElement>(null); // hidden preload video
  const upgradeAttempted = useRef(false);

  /* Dismiss splash: start exit animation, then remove from DOM */
  const dismissSplash = useCallback(() => {
    if (splashExiting) return;
    setSplashExiting(true);
    setTimeout(() => setSplashDone(true), 500);
  }, [splashExiting]);

  /* Video ready — dismiss splash */
  const handleVideoReady = useCallback(() => {
    if (videoLoaded) return;
    setVideoLoaded(true);
    requestAnimationFrame(() => dismissSplash());
  }, [dismissSplash, videoLoaded]);

  /**
   * Progressive upgrade: once 360p is playing smoothly, silently
   * preload a higher quality video and crossfade when ready.
   */
  useEffect(() => {
    if (!videoLoaded || upgradeAttempted.current) return;
    upgradeAttempted.current = true;

    const target = getUpgradeTarget();
    if (!target) return; // low-end device — stay on 360p

    const primary = videoRef.current;
    const upgrade = upgradeVideoRef.current;
    if (!primary || !upgrade) return;

    // Wait 2 seconds after 360p starts playing before preloading
    // This ensures 360p playback is smooth first
    const timer = setTimeout(() => {
      upgrade.src = target;
      upgrade.load();

      const onReady = () => {
        // Sync playback position so the swap is seamless
        upgrade.currentTime = primary.currentTime % upgrade.duration;
        upgrade.play().then(() => {
          // Crossfade: fade in the upgrade video on top
          setUpgraded(true);
        }).catch(() => {
          // Autoplay blocked — stay on 360p
        });
        upgrade.removeEventListener('canplaythrough', onReady);
      };

      upgrade.addEventListener('canplaythrough', onReady);
    }, 2000);

    return () => clearTimeout(timer);
  }, [videoLoaded]);

  /* Safety fallback: dismiss splash if video takes too long */
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!splashDone && !splashExiting) dismissSplash();
    }, 4000);
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
      {/* Primary video — starts with 360p for instant playback */}
      <video
        ref={videoRef}
        className={`hero-background-video ${upgraded ? 'hero-video-fade-out' : ''}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/assets/videos/poster.jpg"
        onCanPlay={handleVideoReady}
        onCanPlayThrough={handleVideoReady}
        src={VIDEO_360}
      />

      {/* Upgrade video — silently preloaded, fades in when ready */}
      <video
        ref={upgradeVideoRef}
        className={`hero-background-video hero-upgrade-video ${upgraded ? 'hero-video-fade-in' : ''}`}
        loop
        muted
        playsInline
        preload="none"
      />

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
