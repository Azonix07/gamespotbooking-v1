'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCpu } from 'react-icons/fi';
import '@/styles/HomePage.css';
import '@/styles/SplashScreen.css';

const AIChat = lazy(() => import('@/components/AIChat'));

/**
 * One-shot video quality selection — detect during splash, pick ONE quality,
 * play it forever. No switching, no stutter, no crossfading.
 *
 * Tiers:
 *  - 480p  (2.5 MB) — slow network / low-end device / data-saver
 *  - 720p  (4.7 MB) — mid-range network & device
 *  - 1080p (10 MB)  — fast network + powerful device
 */
const VIDEO_480  = '/assets/videos/background-480p.mp4';
const VIDEO_720  = '/assets/videos/background-720p.mp4';
const VIDEO_1080 = '/assets/videos/background-1080p.mp4';

/**
 * Runs a real bandwidth probe + device capability check.
 * Downloads a small chunk and measures throughput, then combines
 * with device hints (RAM, CPU cores, connection type) to pick
 * the best video the device can handle smoothly.
 */
async function detectBestVideo(): Promise<string> {
  if (typeof window === 'undefined') return VIDEO_480;

  const nav = navigator as any;

  // ── Device capability signals ──
  const memoryGB      = nav.deviceMemory ?? 8;       // GB of RAM (Chrome only, defaults 8)
  const cpuCores      = nav.hardwareConcurrency ?? 4; // logical cores
  const conn          = nav.connection ?? {};
  const saveData      = conn.saveData === true;
  const effectiveType = conn.effectiveType ?? '4g';   // slow-2g | 2g | 3g | 4g
  const downlinkMbps  = conn.downlink ?? null;        // estimated Mbps (Chrome only)

  // ── Immediate bail-outs ──
  if (saveData) return VIDEO_480;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return VIDEO_480;
  if (memoryGB <= 2) return VIDEO_480;

  // ── Real bandwidth measurement ──
  // Download a tiny probe file and measure speed.
  // We use the poster image (~109 KB) — it's already cached by the browser
  // after the <img> in splash loads it, so on fast connections this resolves
  // near-instantly from cache; on slow connections it gives us real throughput.
  let measuredMbps = downlinkMbps; // fallback to Network Information API value

  try {
    const probeUrl = '/assets/videos/poster.jpg?_probe=' + Date.now();
    const start = performance.now();
    const res = await fetch(probeUrl, { cache: 'no-store' });
    const blob = await res.blob();
    const elapsed = (performance.now() - start) / 1000; // seconds
    const bits = blob.size * 8;
    measuredMbps = (bits / elapsed) / 1_000_000; // Mbps
  } catch {
    // fetch failed — use API hint or default to conservative
    measuredMbps = measuredMbps ?? 2;
  }

  // ── Decision matrix ──
  // Combine bandwidth + device capability into a single score

  // Device score: 0 (weak) to 3 (powerful)
  let deviceScore = 0;
  if (memoryGB >= 4) deviceScore++;
  if (memoryGB >= 8) deviceScore++;
  if (cpuCores >= 4) deviceScore++;

  // Network score: 0 (slow) to 3 (fast)
  let networkScore = 0;
  if (effectiveType === '4g') networkScore++;
  if (measuredMbps !== null && measuredMbps > 5)  networkScore++;
  if (measuredMbps !== null && measuredMbps > 15) networkScore++;

  const totalScore = deviceScore + networkScore; // 0–6

  // Score 0–2: 480p  (slow network or weak device)
  // Score 3–4: 720p  (mid-range)
  // Score 5–6: 1080p (fast + powerful)
  if (totalScore >= 5) return VIDEO_1080;
  if (totalScore >= 3) return VIDEO_720;
  return VIDEO_480;
}

export default function HomePageClient() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

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

  /* Run detection during splash screen, then set video src */
  useEffect(() => {
    let cancelled = false;

    detectBestVideo().then((src) => {
      if (!cancelled) setVideoSrc(src);
    });

    return () => { cancelled = true; };
  }, []);

  /* Once videoSrc is set, load and play */
  useEffect(() => {
    if (!videoSrc || !videoRef.current) return;
    const video = videoRef.current;
    video.src = videoSrc;
    video.load();
    video.play().catch(() => {});
  }, [videoSrc]);

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
      {/* Single background video — quality chosen during splash based on network + device */}
      <video
        ref={videoRef}
        className="hero-background-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/assets/videos/poster.jpg"
        onCanPlay={handleVideoReady}
        onCanPlayThrough={handleVideoReady}
      />
      {/* src is set by the detection effect — not via JSX prop */}

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
