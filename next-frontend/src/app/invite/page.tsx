import type { Metadata } from 'next';
import InvitePageClient from './InvitePageClient';

export const metadata: Metadata = {
  title: 'Invite Friends',
  description: 'Invite your friends to GameSpot and earn rewards! Share your referral code and both you and your friend get discounts.',
};

export default function InvitePage() {
  return <InvitePageClient />;
}
