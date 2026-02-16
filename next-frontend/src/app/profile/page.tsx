import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const ProfilePageClient = dynamic(() => import('./ProfilePageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'My Profile | GameSpot Kodungallur',
  description: 'Manage your GameSpot profile, view booking history, rewards, quest pass progress, and membership status.',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
