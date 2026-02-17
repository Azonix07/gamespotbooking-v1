import type { Metadata } from 'next';
import InstagramPromoPageClient from './InstagramPromoPageClient';

export const metadata: Metadata = {
  title: 'Instagram Promo - Follow & Get Gaming Discounts | GameSpot Kodungallur',
  description: 'Follow GameSpot Kodungallur on Instagram and get exclusive promo codes for discounts on PS5, Xbox & VR gaming sessions. Best gaming deals in Kodungallur, Thrissur, Kerala.',
  keywords: [
    'GameSpot Instagram promo', 'gaming promo code Kodungallur',
    'GameSpot discount code', 'free gaming discount Kerala',
    'GameSpot Instagram follow offer',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/instagram-promo' },
  openGraph: {
    title: 'Instagram Promo | GameSpot Kodungallur',
    description: 'Follow us on Instagram & get exclusive promo codes for gaming discounts.',
    url: 'https://gamespotkdlr.com/instagram-promo',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
  },
};

export default function InstagramPromoPage() {
  return <InstagramPromoPageClient />;
}
