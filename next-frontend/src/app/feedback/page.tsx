import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const FeedbackPageClient = dynamic(() => import('./FeedbackPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Share Your Feedback & Reviews | GameSpot Kodungallur',
  description: 'Rate and review your gaming experience at GameSpot Kodungallur. Your feedback helps us improve our PS5, Xbox & VR gaming setup. Best gaming lounge in Kodungallur, Thrissur, Kerala.',
  keywords: [
    'GameSpot reviews', 'gaming lounge review Kodungallur', 'GameSpot feedback',
    'PS5 gaming review Thrissur', 'gaming cafe ratings Kodungallur',
    'best gaming lounge review Kerala',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/feedback' },
  openGraph: {
    title: 'Share Your Feedback | GameSpot Kodungallur',
    description: 'Rate your gaming experience at Kodungallur\'s best gaming lounge. PS5, Xbox & VR sessions.',
    url: 'https://gamespotkdlr.com/feedback',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
  },
};

export default function FeedbackPage() {
  return <FeedbackPageClient />;
}
