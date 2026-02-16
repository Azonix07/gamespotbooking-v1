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
    default: 'GameSpot Kodungallur - Premium Gaming Lounge | PS5, Xbox, VR Gaming Near You',
    template: '%s | GameSpot Kodungallur - Gaming Lounge',
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
    icon: '/favicon.ico',
    apple: '/assets/images/logo.png',
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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${rajdhani.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Russo One — load non-blocking (display font, not needed for LCP) */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap"
          as="style"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://gamespotbooking-v1-production.up.railway.app" />
        <link rel="dns-prefetch" href="https://gamespotbooking-v1-production.up.railway.app" />
      </head>
      <body className={inter.className} style={{ background: '#0f172a', minHeight: '100vh' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
