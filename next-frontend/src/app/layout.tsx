import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Orbitron, Rajdhani } from 'next/font/google';
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
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  preload: true,
});
const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  preload: false, /* Only used for display/CTA — not critical for LCP */
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
    default: 'GameSpot Kodungallur – Best Gaming Lounge | PS5, GTA, VR & Driving Simulator near Thrissur',
    template: '%s | GameSpot Kodungallur',
  },
  description: 'GameSpot is the best gaming lounge in Kodungallur, Thrissur, Kerala. Play GTA, PS5, VR games & driving simulator. Book PS5, Xbox Series X, Meta Quest VR sessions online. Near Irinjalakuda, Guruvayur, Chalakudy. 50+ games, professional setup.',
  keywords: [
    'games in Kodungallur', 'games in Thrissur', 'GTA in Kodungallur',
    'gaming lounge in Kodungallur', 'PS5 in Kodungallur', 'VR games in Kodungallur',
    'driving simulator in Kodungallur', 'gaming center near me',
    'best gaming lounge in Kodungallur', 'game booking in Kodungallur',
    'gaming lounge Kodungallur', 'PS5 gaming Kodungallur', 'gaming cafe Kodungallur',
    'VR gaming Kodungallur', 'Xbox gaming Kodungallur', 'gaming near Kodungallur',
    'GameSpot Kodungallur', 'gaming lounge Thrissur', 'gaming cafe Kerala',
    'PS5 booking Kerala', 'gaming lounge near me', 'best gaming cafe Thrissur',
    'VR experience Kodungallur', 'VR in Thrissur', 'Meta Quest VR Kerala',
    'esports Kodungallur', 'gaming zone Kodungallur', 'gaming center Irinjalakuda',
    'gaming cafe Guruvayur', 'PlayStation 5 gaming Kerala', 'console gaming Thrissur district',
    'gaming center near me Kodungallur', 'gaming center near me Thrissur',
  ],
  authors: [{ name: 'CarbonCrew Technologies' }],
  creator: 'CarbonCrew Technologies',
  publisher: 'GameSpot Gaming Lounge Kodungallur',
  metadataBase: new URL('https://gamespotkdlr.com'),
  alternates: {
    canonical: 'https://gamespotkdlr.com',
  },
  openGraph: {
    title: 'GameSpot Kodungallur – Best Gaming Lounge | PS5, GTA, VR & Driving Simulator',
    description: 'Best gaming lounge in Kodungallur, Thrissur. Play GTA, PS5, VR games & driving simulator. Book sessions online. 50+ games, professional setup.',
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
    title: 'GameSpot Kodungallur – Best Gaming Lounge | PS5, GTA, VR',
    description: 'Play GTA, PS5, VR & driving simulator at the best gaming lounge in Kodungallur near Thrissur, Kerala. Book online now.',
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable} ${orbitron.variable} ${rajdhani.variable}`}>
      <head>
        {/* Favicons are handled by metadata export — no manual <link> tags needed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Orbitron is now loaded via next/font — no external stylesheet needed */}
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
