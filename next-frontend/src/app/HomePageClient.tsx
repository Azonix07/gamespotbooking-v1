'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCpu } from 'react-icons/fi';

const AIChat = lazy(() => import('@/components/AIChat'));

export default function HomePageClient() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  /* Defer video load — let LCP paint first, then start the video */
  useEffect(() => {
    const ric = typeof window !== 'undefined' ? window.requestIdleCallback : undefined;
    const cic = typeof window !== 'undefined' ? window.cancelIdleCallback : undefined;
    const timer = ric
      ? ric(() => setVideoReady(true))
      : setTimeout(() => setVideoReady(true), 100);
    return () => {
      if (typeof timer === 'number') {
        if (ric && cic) cic(timer);
        else clearTimeout(timer);
      }
    };
  }, []);

  return (
    <div className="hero-container">
      {/* Video Background — deferred to not block LCP */}
      {videoReady && (
        <video
          className="hero-background-video"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
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
  );
}
