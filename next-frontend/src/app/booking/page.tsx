import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const BookingPageClient = dynamic(() => import('./BookingPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Book Gaming Session - PS5, Xbox, VR | GameSpot Kodungallur',
  description: 'Book your PS5, Xbox Series X, or Meta Quest VR gaming session at GameSpot Kodungallur. Real-time availability, instant booking. Best gaming lounge in Kodungallur, Thrissur, Kerala.',
  keywords: ['book PS5 Kodungallur', 'gaming session booking Kerala', 'VR booking Thrissur', 'gaming lounge booking Kodungallur', 'Xbox booking near me'],
  alternates: { canonical: 'https://gamespotkdlr.com/booking' },
  openGraph: {
    title: 'Book Gaming Session | GameSpot Kodungallur',
    description: 'Book PS5, Xbox, VR sessions at Kodungallur\'s best gaming lounge. Real-time availability & instant booking.',
    url: 'https://gamespotkdlr.com/booking',
  },
};

export default function BookingPage() {
  return <BookingPageClient />;
}
