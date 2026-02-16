import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const GetOffersPageClient = dynamic(() => import('./GetOffersPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Gaming Offers & Discount Codes | GameSpot Kodungallur',
  description: 'Get exclusive gaming offers & discount codes at GameSpot Kodungallur. Follow us on Instagram, refer friends & claim discounts. Best gaming deals in Thrissur, Kerala.',
  keywords: ['gaming offers Kodungallur', 'discount codes gaming lounge', 'GameSpot deals Kerala', 'gaming promotions Thrissur'],
  alternates: { canonical: 'https://gamespotkdlr.com/get-offers' },
  openGraph: {
    title: 'Offers & Discounts | GameSpot Kodungallur',
    description: 'Exclusive gaming offers & discount codes. Follow, share & save at Kodungallur\'s best gaming lounge.',
    url: 'https://gamespotkdlr.com/get-offers',
  },
};

export default function GetOffersPage() {
  return <GetOffersPageClient />;
}
