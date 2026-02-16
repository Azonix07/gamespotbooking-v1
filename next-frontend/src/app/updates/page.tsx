import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const UpdatesPageClient = dynamic(() => import('./UpdatesPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Latest News & Updates | GameSpot Kodungallur',
  description: 'Stay updated with new game additions, events, tournaments & special offers at GameSpot Kodungallur. Latest gaming news from Thrissur\'s best gaming lounge.',
  keywords: ['gaming news Kodungallur', 'new games GameSpot', 'gaming events Thrissur', 'GameSpot updates Kerala'],
  alternates: { canonical: 'https://gamespotkdlr.com/updates' },
};

export default function UpdatesPage() {
  return <UpdatesPageClient />;
}
