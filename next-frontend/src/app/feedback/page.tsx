import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const FeedbackPageClient = dynamic(() => import('./FeedbackPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Share Your Feedback | GameSpot Kodungallur',
  description: 'Share your gaming experience at GameSpot Kodungallur. Your feedback helps us improve our PS5, Xbox & VR gaming setup. Rate & review the best gaming lounge in Thrissur.',
  alternates: { canonical: 'https://gamespotkdlr.com/feedback' },
};

export default function FeedbackPage() {
  return <FeedbackPageClient />;
}
