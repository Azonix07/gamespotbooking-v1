import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const GamesPageClient = dynamic(() => import('./GamesPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'PS5 & Xbox Games Library - 50+ Titles | GameSpot Kodungallur',
  description: 'Browse 50+ PS5 & Xbox games at GameSpot Kodungallur. God of War Ragnarök, Spider-Man 2, GTA V, FC 25, and more. Best gaming library in Thrissur, Kerala.',
  keywords: ['PS5 games Kodungallur', 'gaming library Kerala', 'God of War Kodungallur', 'Spider-Man PS5 Thrissur', 'game catalog gaming lounge'],
  alternates: { canonical: 'https://gamespotkdlr.com/games' },
  openGraph: {
    title: 'Games Library | GameSpot Kodungallur',
    description: '50+ PS5 & Xbox games available. God of War, Spider-Man, GTA V, FC 25 and more at Kodungallur\'s best gaming lounge.',
    url: 'https://gamespotkdlr.com/games',
  },
};

export default function GamesPage() {
  return <GamesPageClient />;
}
