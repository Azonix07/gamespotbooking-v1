import type { Metadata } from 'next';
import { Suspense } from 'react';
import GameSpotLoader from '@/components/GameSpotLoader';
import ForgotPasswordPageClient from './ForgotPasswordPageClient';

export const metadata: Metadata = {
  title: 'Reset Password | GameSpot Kodungallur',
  description: 'Reset your GameSpot account password. We\'ll send you an OTP to verify your identity and restore access to your gaming account.',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<GameSpotLoader />}>
      <ForgotPasswordPageClient />
    </Suspense>
  );
}
