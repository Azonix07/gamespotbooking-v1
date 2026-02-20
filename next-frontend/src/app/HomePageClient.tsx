'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCpu } from 'react-icons/fi';
import '@/styles/HomePage.css';
import '@/styles/SplashScreen.css';

const AIChat = lazy(() => import('@/components/AIChat'));

/** HLS master playlist — contains 360p / 480p / 720p variants.
 *  The player starts with the lowest quality and upgrades automatically
 *  as network bandwidth improves (like YouTube / Netflix). */
const HLS_SRC = '/assets/videos/hls/master.m3u8';

/** Smallest MP4 fallback — used only if HLS is completely unsupported */
const FALLBACK_MP4 = '/assets/videos/background-360p.mp4';

export default function HomePageClient() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  /* Dismiss splash: start exit animation, then remove from DOM */
  const dismissSplash = useCallback(() => {
    if (splashExiting) return;
    setSplashExiting(true);
    setTimeout(() => setSplashDone(true), 500);
  }, [splashExiting]);

  /* Video ready — dismiss splash */
  const handleVideoReady = useCallback(() => {
    if (videoLoaded) return; // prevent double-trigger
    setVideoLoaded(true);
    requestAnimationFrame(() => dismissSplash());
  }, [dismissSplash, videoLoaded]);

  /* Attach HLS adaptive streaming on mount */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;

    async function initHLS() {
      // Safari natively supports HLS — just set the src
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = HLS_SRC;
        video.load();
        return;
      }

      // All other browsers — use hls.js
      try {
        const Hls = (await import('hls.js')).default;

        if (!Hls.isSupported()) {
          // Very old browser — fall back to smallest MP4
          video.src = FALLBACK_MP4;
          video.load();
          return;
        }

        const hls = new Hls({
          // Start from the lowest quality — upgrades automatically
          startLevel: 0,
          // Enable auto quality switching based on bandwidth
          autoStartLoad: true,
          // Cap start-level at 360p so first frames arrive fast
          capLevelToPlayerSize: true,
          // Aggressive buffer tuning for background video
          maxBufferLength: 10,        // seconds of buffer ahead
          maxMaxBufferLength: 20,
          maxBufferSize: 2 * 1024 * 1024,  // 2 MB max buffer
          // Faster ABR switching
          abrEwmaDefaultEstimate: 500000,  // conservative start estimate (500 kbps)
          abrBandWidthUpFactor: 0.7,       // upgrade when 70% of next level is achievable
        });

        if (destroyed) { hls.destroy(); return; }

        hlsRef.current = hls;
        hls.loadSource(HLS_SRC);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!destroyed) video.play().catch(() => {});
        });

        // Handle fatal errors — fall back to MP4
        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal && !destroyed) {
            hls.destroy();
            hlsRef.current = null;
            video.src = FALLBACK_MP4;
            video.load();
            video.play().catch(() => {});
          }
        });
      } catch {
        // import failed — fall back to MP4
        if (!destroyed) {
          video.src = FALLBACK_MP4;
          video.load();
        }
      }
    }

    initHLS();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

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
      {/* Video Background — HLS adaptive streaming (360p → 480p → 720p based on network) */}
      <video
        ref={videoRef}
        className="hero-background-video"
        autoPlay
        loop
        muted
        playsInline
        poster="/assets/videos/poster.jpg"
        onCanPlay={handleVideoReady}
        onCanPlayThrough={handleVideoReady}
      />
      {/* src is set programmatically by the HLS init effect — not via JSX */}

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
