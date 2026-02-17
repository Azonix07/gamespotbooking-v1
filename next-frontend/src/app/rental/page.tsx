import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const RentalPageClient = dynamic(() => import('./RentalPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'PS5 & VR Rental for Events, Parties & Home | GameSpot Kodungallur',
  description: 'Rent PS5 consoles, Xbox & Meta Quest VR headsets in Kodungallur, Kerala. Perfect for birthday parties, house parties, corporate events & college fests. Delivery available in Thrissur, Irinjalakuda, Guruvayur & Chalakudy.',
  keywords: [
    'PS5 rental Kodungallur', 'VR rental Kerala', 'gaming rental Thrissur',
    'console rental for events', 'PS5 rent for party Kodungallur',
    'gaming setup rental Kerala', 'PS5 rental for birthday party',
    'VR headset rental Thrissur', 'Xbox rental Kodungallur',
    'gaming party setup Kerala', 'rent PS5 near me',
    'gaming event rental Irinjalakuda', 'console rental near Guruvayur',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/rental' },
  openGraph: {
    title: 'PS5, Xbox & VR Rental | GameSpot Kodungallur',
    description: 'Rent PS5, Xbox & VR for parties, birthdays & events. Delivery in Thrissur district. Competitive pricing.',
    url: 'https://gamespotkdlr.com/rental',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot Console Rental' }],
  },
  twitter: {
    card: 'summary',
    title: 'Rent PS5 & VR for Events | GameSpot Kodungallur',
    description: 'Console & VR rental for parties and events. Delivery across Thrissur district.',
  },
};

export default function RentalPage() {
  return <RentalPageClient />;
}
