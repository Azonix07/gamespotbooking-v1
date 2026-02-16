import type { Metadata } from 'next';
import DiscountGamePageClient from './DiscountGamePageClient';

export const metadata: Metadata = {
  title: 'Win Discount - Shooting Game',
  description: 'Play our browser shooting game to win exclusive discounts on your next gaming session at GameSpot!',
  keywords: ['gaming discount', 'shooting game', 'win prizes', 'GameSpot offers'],
};

export default function DiscountGamePage() {
  return <DiscountGamePageClient />;
}
