import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const BookingPageClient = dynamic(() => import('./BookingPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Book Gaming Session - PS5, Xbox, VR | GameSpot Kodungallur',
  description: 'Book your PS5, Xbox Series X, or Meta Quest VR gaming session at GameSpot Kodungallur. Play GTA V, FIFA, God of War, Spider-Man & 50+ games. Real-time availability, instant booking. Best gaming lounge in Kodungallur, Thrissur, Kerala.',
  keywords: [
    'book PS5 Kodungallur', 'gaming session booking Kerala', 'VR booking Thrissur',
    'gaming lounge booking Kodungallur', 'Xbox booking near me',
    'play GTA Kodungallur', 'play FIFA Kodungallur', 'play PS5 games Kodungallur',
    'gaming cafe booking Thrissur', 'book gaming session near Irinjalakuda',
    'PS5 gaming near Guruvayur', 'online gaming booking Kerala',
    'book VR experience Kodungallur', 'gaming slot booking Thrissur district',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/booking' },
  openGraph: {
    title: 'Book Gaming Session - PS5, Xbox, VR | GameSpot Kodungallur',
    description: 'Book PS5, Xbox, VR sessions at Kodungallur\'s best gaming lounge. GTA, FIFA, God of War & 50+ games. Real-time availability & instant booking.',
    url: 'https://gamespotkdlr.com/booking',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'Book Gaming at GameSpot Kodungallur' }],
  },
  twitter: {
    card: 'summary',
    title: 'Book PS5, Xbox, VR Gaming | GameSpot Kodungallur',
    description: 'Instant booking for PS5, Xbox & VR sessions. 50+ games including GTA, FIFA, God of War.',
  },
};

export default function BookingPage() {
  return <BookingPageClient />;
}
