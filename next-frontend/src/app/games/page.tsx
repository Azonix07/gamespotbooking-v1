import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const GamesPageClient = dynamic(() => import('./GamesPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'PS5 & Xbox Games Library - GTA, FIFA, God of War & 50+ Games | GameSpot Kodungallur',
  description: 'Browse 50+ PS5 & Xbox games at GameSpot Kodungallur. Play GTA V, GTA Online, God of War Ragnarök, Spider-Man 2, FC 25, Call of Duty, Fortnite, WWE, NBA, Mortal Kombat & more in Kodungallur, Thrissur, Kerala.',
  keywords: [
    'PS5 games Kodungallur', 'GTA V Kodungallur', 'GTA gaming lounge Kodungallur',
    'play GTA in Kodungallur', 'FIFA Kodungallur', 'FC 25 Kodungallur',
    'God of War Kodungallur', 'Spider-Man PS5 Kodungallur', 'Call of Duty Kodungallur',
    'gaming library Kerala', 'PS5 game catalog Thrissur', 'Fortnite Kodungallur',
    'WWE 2K Kodungallur', 'NBA 2K Kodungallur', 'Mortal Kombat Kodungallur',
    'play PS5 games near me', 'Xbox games Kodungallur', 'gaming lounge game list',
    'best PS5 games available Thrissur', 'latest games gaming cafe Kerala',
    'Tekken Kodungallur', 'Gran Turismo Kodungallur', 'racing games Kodungallur',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/games' },
  openGraph: {
    title: 'GTA, FIFA, God of War & 50+ Games | GameSpot Kodungallur',
    description: 'Play GTA V, God of War, Spider-Man, FC 25, Call of Duty & 50+ games on PS5 & Xbox at Kodungallur\'s best gaming lounge.',
    url: 'https://gamespotkdlr.com/games',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot Games Library' }],
  },
  twitter: {
    card: 'summary',
    title: 'GTA, FIFA & 50+ PS5 Games | GameSpot Kodungallur',
    description: 'Play the latest PS5 & Xbox titles at Kodungallur\'s premium gaming lounge.',
  },
};

export default function GamesPage() {
  return <GamesPageClient />;
}
