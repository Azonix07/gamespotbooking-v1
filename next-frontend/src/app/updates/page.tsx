import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const UpdatesPageClient = dynamic(() => import('./UpdatesPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Latest News, New Games & Updates | GameSpot Kodungallur',
  description: 'Stay updated with new game additions, gaming events, tournaments, new console arrivals & special offers at GameSpot Kodungallur. Latest gaming news from Kodungallur, Thrissur, Kerala.',
  keywords: [
    'gaming news Kodungallur', 'new games GameSpot', 'gaming events Thrissur',
    'GameSpot updates Kerala', 'new PS5 games Kodungallur',
    'gaming tournament Kodungallur', 'latest games added Kerala',
    'gaming lounge news Thrissur',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/updates' },
  openGraph: {
    title: 'Latest Updates & News | GameSpot Kodungallur',
    description: 'New games, events, tournaments & offers at Kodungallur\'s best gaming lounge.',
    url: 'https://gamespotkdlr.com/updates',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
  },
};

export default function UpdatesPage() {
  return <UpdatesPageClient />;
}
