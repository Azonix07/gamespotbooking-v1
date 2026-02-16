import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const MembershipPlansPageClient = dynamic(() => import('./MembershipPlansPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Gaming Membership Plans & Passes | GameSpot Kodungallur',
  description: 'Join GameSpot Kodungallur membership for exclusive gaming discounts. Monthly, quarterly & annual plans. Story Pass & Driving Pass. Best value gaming in Thrissur, Kerala.',
  keywords: ['gaming membership Kodungallur', 'PS5 subscription Kerala', 'gaming pass Thrissur', 'discount gaming Kodungallur', 'gaming membership near me'],
  alternates: { canonical: 'https://gamespotkdlr.com/membership' },
  openGraph: {
    title: 'Membership Plans | GameSpot Kodungallur',
    description: 'Exclusive gaming memberships with amazing discounts. Story Pass, Driving Pass & more at Kodungallur\'s best gaming lounge.',
    url: 'https://gamespotkdlr.com/membership',
  },
};

export default function MembershipPage() {
  return <MembershipPlansPageClient />;
}
