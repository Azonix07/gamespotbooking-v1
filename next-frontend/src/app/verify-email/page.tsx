import type { Metadata } from 'next';
import { Suspense } from 'react';
import GameSpotLoader from '@/components/GameSpotLoader';
import VerifyEmailPageClient from './VerifyEmailPageClient';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your GameSpot account email address to complete registration.',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<GameSpotLoader />}>
      <VerifyEmailPageClient />
    </Suspense>
  );
}
