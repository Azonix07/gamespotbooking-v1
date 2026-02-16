import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const CollegeSetupPageClient = dynamic(() => import('./CollegeSetupPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'College Event Gaming Setup - PS5, VR, Simulators | GameSpot Kerala',
  description: 'Book professional gaming setups for college fests & events in Kerala. PS5, VR, driving simulators with full setup & support. Servicing Kodungallur, Thrissur, Ernakulam & all Kerala.',
  keywords: ['college gaming event Kerala', 'gaming setup rental Thrissur', 'college fest gaming Kodungallur', 'esports event Kerala', 'gaming stall college fest'],
  alternates: { canonical: 'https://gamespotkdlr.com/college-setup' },
  openGraph: {
    title: 'College Event Gaming Setup | GameSpot Kerala',
    description: 'Professional gaming setups for college fests. PS5, VR, simulators with full support. Available across Kerala.',
    url: 'https://gamespotkdlr.com/college-setup',
  },
};

export default function CollegeSetupPage() {
  return <CollegeSetupPageClient />;
}
