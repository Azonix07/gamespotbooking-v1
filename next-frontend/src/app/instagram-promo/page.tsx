import type { Metadata } from 'next';
import InstagramPromoPageClient from './InstagramPromoPageClient';

export const metadata: Metadata = {
  title: 'Instagram Promo',
  description: 'Follow GameSpot on Instagram and get exclusive promo codes for discounts on your gaming sessions.',
};

export default function InstagramPromoPage() {
  return <InstagramPromoPageClient />;
}
