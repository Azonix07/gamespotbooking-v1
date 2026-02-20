import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import BreadcrumbSchema from '@/components/structured-data/BreadcrumbSchema';

/*
 * Import BookingPage.css at the server-component (page) level so it's
 * included in the initial HTML <head> as a <link> tag on full-page loads.
 * Next.js deduplicates if the client component also imports it.
 */
import '@/styles/BookingPage.css';

/*
 * Dynamic-import with ssr:false avoids framer-motion rendering invisible
 * opacity:0 elements during SSR.
 *
 * IMPORTANT: The skeleton loader uses ONLY inline styles — zero CSS class
 * dependencies.  During client-side navigation on slow networks the
 * BookingPage.css chunk may not have arrived yet, so any class-based
 * styling would appear unstyled.  Pure inline styles guarantee the
 * loader always looks correct regardless of CSS load timing.
 */
const BookingPageClient = dynamic(() => import('./BookingPageClient'), {
  ssr: false,
  loading: () => <BookingSkeleton />,
});

/** Fully self-contained skeleton — uses ONLY inline styles, no external CSS */
function BookingSkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #ffffff 0%, #fff5f0 30%, #ffe8dc 60%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Animated background orbs — pure inline */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)',
          top: '-5%', right: '-5%', animation: 'booking-sk-float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,153,102,0.06) 0%, transparent 70%)',
          bottom: '10%', left: '-3%', animation: 'booking-sk-float 10s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 800, margin: '0 auto', padding: '80px 20px 40px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Step indicators skeleton */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: n === 1
                  ? 'linear-gradient(135deg, #ff6b35, #ff9966)'
                  : '#e9ecef',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: n === 1 ? '#fff' : '#adb5bd', fontSize: 14, fontWeight: 600,
              }}>
                {n}
              </div>
              <span style={{
                fontSize: 13, color: n === 1 ? '#ff6b35' : '#adb5bd',
                fontWeight: n === 1 ? 600 : 400, display: 'none',
              }}>
                {n === 1 ? 'Schedule' : n === 2 ? 'Equipment' : 'Confirm'}
              </span>
              {n < 3 && (
                <div style={{ width: 40, height: 2, background: '#e9ecef', borderRadius: 1 }} />
              )}
            </div>
          ))}
        </div>

        {/* Card skeleton */}
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: 20, padding: '32px 24px',
          boxShadow: '0 4px 20px rgba(255,107,53,0.08)',
          border: '1px solid rgba(255,107,53,0.1)',
        }}>
          {/* Header skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,153,102,0.1))',
              animation: 'booking-sk-pulse 1.5s ease-in-out infinite',
            }} />
            <div>
              <div style={{
                width: 200, height: 18, borderRadius: 8, marginBottom: 8,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'booking-sk-shimmer 1.5s ease-in-out infinite',
              }} />
              <div style={{
                width: 150, height: 14, borderRadius: 6,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'booking-sk-shimmer 1.5s ease-in-out infinite 0.2s',
              }} />
            </div>
          </div>

          {/* Date picker skeleton */}
          <div style={{
            width: '100%', height: 52, borderRadius: 12, marginBottom: 24,
            background: 'linear-gradient(90deg, #f5f5f5 25%, #ebebeb 50%, #f5f5f5 75%)',
            backgroundSize: '200% 100%',
            animation: 'booking-sk-shimmer 1.5s ease-in-out infinite 0.1s',
          }} />

          {/* Time slots skeleton */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              width: 120, height: 16, borderRadius: 6, marginBottom: 16,
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'booking-sk-shimmer 1.5s ease-in-out infinite 0.3s',
            }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  width: 80, height: 42, borderRadius: 10,
                  background: 'linear-gradient(90deg, #f5f5f5 25%, #ebebeb 50%, #f5f5f5 75%)',
                  backgroundSize: '200% 100%',
                  animation: `booking-sk-shimmer 1.5s ease-in-out infinite ${0.1 * i}s`,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes — scoped inline */}
      <style>{`
        @keyframes booking-sk-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes booking-sk-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        @keyframes booking-sk-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Book Gaming Slot in Kodungallur | PS5, VR & Driving Simulator Booking',
  description: 'Book your PS5, Xbox Series X, VR or driving simulator session at GameSpot Kodungallur. Play GTA V, FIFA, God of War, Spider-Man & 50+ games. Real-time availability, instant booking. Best gaming lounge in Kodungallur, Thrissur, Kerala.',
  keywords: [
    'book PS5 Kodungallur', 'gaming session booking Kerala', 'VR booking Thrissur',
    'gaming lounge booking Kodungallur', 'Xbox booking near me',
    'play GTA Kodungallur', 'play FIFA Kodungallur', 'play PS5 games Kodungallur',
    'gaming cafe booking Thrissur', 'book gaming session near Irinjalakuda',
    'PS5 gaming near Guruvayur', 'online gaming booking Kerala',
    'book VR experience Kodungallur', 'gaming slot booking Thrissur district',
    'game booking in Kodungallur', 'book gaming slot Kodungallur',
    'driving simulator booking Kodungallur', 'PS5 in Kodungallur',
    'VR games in Kodungallur', 'games in Kodungallur',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/booking' },
  openGraph: {
    title: 'Book Gaming Slot in Kodungallur | PS5, VR & Driving Simulator Booking',
    description: 'Book PS5, Xbox, VR & driving simulator sessions at Kodungallur\'s best gaming lounge. GTA, FIFA, God of War & 50+ games. Real-time availability & instant booking.',
    url: 'https://gamespotkdlr.com/booking',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'Book Gaming at GameSpot Kodungallur' }],
  },
  twitter: {
    card: 'summary',
    title: 'Book Gaming Slot in Kodungallur | PS5 & VR Booking',
    description: 'Instant booking for PS5, Xbox, VR & driving simulator. 50+ games including GTA, FIFA, God of War.',
  },
};

export default function BookingPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Book Gaming Slot', url: '/booking' }]} />
      <BookingPageClient />
    </>
  );
}
