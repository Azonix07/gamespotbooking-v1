import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const GetOffersPageClient = dynamic(() => import('./GetOffersPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Gaming Offers, Deals & Discount Codes | GameSpot Kodungallur',
  description: 'Get exclusive gaming offers & promo codes at GameSpot Kodungallur. Follow on Instagram, refer friends & claim discounts on PS5, Xbox & VR sessions. Best gaming deals in Kodungallur, Thrissur, Kerala.',
  keywords: [
    'gaming offers Kodungallur', 'discount codes gaming lounge',
    'GameSpot deals Kerala', 'gaming promotions Thrissur',
    'PS5 gaming discount Kodungallur', 'gaming promo code Kerala',
    'gaming lounge offers near me', 'cheap gaming Kodungallur',
    'gaming deals Thrissur district',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/get-offers' },
  openGraph: {
    title: 'Gaming Offers & Discounts | GameSpot Kodungallur',
    description: 'Exclusive gaming offers, promo codes & referral discounts at Kodungallur\'s best gaming lounge.',
    url: 'https://gamespotkdlr.com/get-offers',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot Gaming Offers' }],
  },
};

export default function GetOffersPage() {
  return <GetOffersPageClient />;
}
