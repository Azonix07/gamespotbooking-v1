import type { Metadata } from 'next';
import BookingPageClient from './BookingPageClient';
import BreadcrumbSchema from '@/components/structured-data/BreadcrumbSchema';
import '@/styles/BookingPage.css';

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
