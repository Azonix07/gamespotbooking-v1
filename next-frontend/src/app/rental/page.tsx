import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const RentalPageClient = dynamic(() => import('./RentalPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'PS5 & VR Rental for Events & Parties | GameSpot Kodungallur',
  description: 'Rent PS5 consoles & Meta Quest VR headsets in Kodungallur, Kerala. Perfect for parties, birthdays & events. Flexible rental, competitive pricing. Delivery in Thrissur district.',
  keywords: ['PS5 rental Kodungallur', 'VR rental Kerala', 'gaming rental Thrissur', 'console rental for events', 'PS5 rent for party Kodungallur'],
  alternates: { canonical: 'https://gamespotkdlr.com/rental' },
  openGraph: {
    title: 'PS5 & VR Rental | GameSpot Kodungallur',
    description: 'Rent PS5 & VR for home parties, birthdays & events. Flexible pricing, delivery in Thrissur district.',
    url: 'https://gamespotkdlr.com/rental',
  },
};

export default function RentalPage() {
  return <RentalPageClient />;
}
