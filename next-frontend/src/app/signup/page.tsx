import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const SignupPageClient = dynamic(() => import('./SignupPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Create Account | GameSpot Kodungallur',
  description: 'Create your GameSpot account. Join Kodungallur\'s ultimate gaming community. Book PS5, Xbox, VR sessions and unlock exclusive membership benefits.',
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return <SignupPageClient />;
}
