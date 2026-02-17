import type { Metadata } from 'next';
import InvitePageClient from './InvitePageClient';

export const metadata: Metadata = {
  title: 'Invite Friends & Earn Rewards | GameSpot Kodungallur',
  description: 'Refer your friends to GameSpot Kodungallur and earn gaming rewards! Share your referral code — both you and your friend get discounts on PS5, Xbox & VR sessions.',
  keywords: [
    'GameSpot referral', 'gaming rewards Kodungallur', 'refer friend gaming lounge',
    'gaming discount referral Kerala', 'GameSpot invite code',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/invite' },
  robots: { index: false, follow: true },
};

export default function InvitePage() {
  return <InvitePageClient />;
}
