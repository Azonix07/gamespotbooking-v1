import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';
import BreadcrumbSchema from '@/components/structured-data/BreadcrumbSchema';

const MembershipPlansPageClient = dynamic(() => import('./MembershipPlansPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Gaming Membership Plans & Passes | GameSpot Kodungallur',
  description: 'Join GameSpot Kodungallur membership for exclusive gaming discounts on PS5, Xbox & VR sessions. Monthly, quarterly & annual plans. Story Pass, Driving Pass. Best value gaming in Kodungallur, Thrissur, Kerala.',
  keywords: [
    'gaming membership Kodungallur', 'PS5 subscription Kerala', 'gaming pass Thrissur',
    'discount gaming Kodungallur', 'gaming membership near me',
    'GameSpot membership plans', 'gaming lounge membership Thrissur',
    'PS5 monthly pass Kodungallur', 'gaming discount card Kerala',
    'unlimited gaming Kodungallur', 'gaming subscription near Irinjalakuda',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/membership' },
  openGraph: {
    title: 'Gaming Membership Plans | GameSpot Kodungallur',
    description: 'Exclusive gaming memberships with discounts on PS5, Xbox & VR. Story Pass, Driving Pass & more at Kodungallur\'s best gaming lounge.',
    url: 'https://gamespotkdlr.com/membership',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot Membership Plans' }],
  },
  twitter: {
    card: 'summary',
    title: 'Gaming Membership Plans | GameSpot Kodungallur',
    description: 'Save on PS5, Xbox & VR gaming with exclusive membership plans.',
  },
};

export default function MembershipPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Membership Plans', url: '/membership' }]} />
      <MembershipPlansPageClient />
    </>
  );
}
