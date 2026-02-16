import type { Metadata } from 'next';
import { Suspense } from 'react';
import GameSpotLoader from '@/components/GameSpotLoader';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Login to Your Account | GameSpot Kodungallur',
  description: 'Sign in to your GameSpot account. Book PS5, Xbox, VR gaming sessions and manage your memberships at Kodungallur\'s premier gaming lounge.',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<GameSpotLoader />}>
      <LoginPageClient />
    </Suspense>
  );
}
