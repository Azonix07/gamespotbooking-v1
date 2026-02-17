import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, Rajdhani } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.css';

/* Only load the weights actually used across the site */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700'],
  display: 'swap',
  preload: true,
});
const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['600', '700'],
  display: 'swap',
  preload: false, /* Only used in navbar — not critical for LCP */
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: {
    default: 'GameSpot Kodungallur – Next-Gen Gaming Experience',
    template: '%s | GameSpot Kodungallur',
  },
  description: 'GameSpot is the #1 premium gaming lounge in Kodungallur, Thrissur, Kerala. Book PS5, Xbox Series X, Meta Quest VR sessions. Best gaming cafe near Kodungallur, Irinjalakuda, Guruvayur, Chalakudy. Professional gaming setup & ultimate entertainment.',
  keywords: [
    'gaming lounge Kodungallur', 'PS5 gaming Kodungallur', 'gaming cafe Kodungallur',
    'VR gaming Kodungallur', 'Xbox gaming Kodungallur', 'gaming near Kodungallur',
    'GameSpot Kodungallur', 'gaming lounge Thrissur', 'gaming cafe Kerala',
    'PS5 booking Kerala', 'gaming lounge near me', 'best gaming cafe Thrissur',
    'VR experience Kodungallur', 'Meta Quest VR Kerala', 'esports Kodungallur',
    'gaming zone Kodungallur', 'gaming center Irinjalakuda', 'gaming cafe Guruvayur',
    'PlayStation 5 gaming Kerala', 'console gaming Thrissur district',
  ],
  authors: [{ name: 'CarbonCrew Technologies' }],
  creator: 'CarbonCrew Technologies',
  publisher: 'GameSpot Gaming Lounge Kodungallur',
  metadataBase: new URL('https://gamespotkdlr.com'),
  alternates: {
    canonical: 'https://gamespotkdlr.com',
  },
  openGraph: {
    title: 'GameSpot Kodungallur - Premium Gaming Lounge | PS5, Xbox, VR',
    description: 'Kodungallur\'s #1 gaming lounge. Book PS5, Xbox Series X, Meta Quest VR sessions. Professional gaming setup near Kodungallur, Thrissur, Kerala.',
    url: 'https://gamespotkdlr.com',
    siteName: 'GameSpot Kodungallur',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/assets/images/logo.png',
        width: 400,
        height: 75,
        alt: 'GameSpot Kodungallur - Premium Gaming Lounge Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GameSpot Kodungallur - Premium Gaming Lounge',
    description: 'Book PS5, Xbox, VR gaming sessions at Kodungallur\'s premier gaming lounge. Best gaming cafe in Thrissur, Kerala.',
    site: '@GameSpotIndia',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: [
      { url: '/assets/images/favicon-128.png?v=3', sizes: '128x128', type: 'image/png' },
      { url: '/assets/images/favicon-96.png?v=3', sizes: '96x96', type: 'image/png' },
      { url: '/assets/images/favicon-64.png?v=3', sizes: '64x64', type: 'image/png' },
      { url: '/assets/images/favicon-48.png?v=3', sizes: '48x48', type: 'image/png' },
      { url: '/assets/images/favicon-32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/assets/images/favicon-16.png?v=3', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico?v=3', sizes: 'any' },
    ],
    apple: '/assets/images/GS-favicon.PNG?v=3',
    shortcut: '/assets/images/favicon-96.png?v=3',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Replace with actual Google Search Console verification code
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=yes',
    'geo.region': 'IN-KL',
    'geo.placename': 'Kodungallur, Thrissur, Kerala',
    'geo.position': '10.2269;76.1950',
    'ICBM': '10.2269, 76.1950',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${rajdhani.variable}`}>
      <head>
        {/* Favicons are handled by metadata export — no manual <link> tags needed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Russo One — deferred load: preload as style, then apply after page paints */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap"
          as="style"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap"
          rel="stylesheet"
          media="print"
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap" rel="stylesheet" />
        </noscript>
        {/* Switch deferred font from media=print to media=all after first paint */}
        <script dangerouslySetInnerHTML={{ __html: `document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('link[media=print][href*=fonts]').forEach(function(l){l.media='all'})})` }} />
        <link rel="preconnect" href="https://gamespotbooking-v1-production.up.railway.app" />
        <link rel="dns-prefetch" href="https://gamespotbooking-v1-production.up.railway.app" />
      </head>
      <body className={inter.className} suppressHydrationWarning style={{ background: '#0f172a', minHeight: '100vh' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
