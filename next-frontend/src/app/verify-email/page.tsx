import type { Metadata } from 'next';
import { Suspense } from 'react';
import GameSpotLoader from '@/components/GameSpotLoader';
import VerifyEmailPageClient from './VerifyEmailPageClient';

export const metadata: Metadata = {
  title: 'Verify Email | GameSpot Kodungallur',
  description: 'Verify your GameSpot account email address to complete registration and start booking PS5, Xbox & VR gaming sessions.',
  robots: { index: false, follow: true },
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<GameSpotLoader />}>
      <VerifyEmailPageClient />
    </Suspense>
  );
}
