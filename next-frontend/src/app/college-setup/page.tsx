import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const CollegeSetupPageClient = dynamic(() => import('./CollegeSetupPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'College Event & Fest Gaming Setup - PS5, VR, Simulators | GameSpot Kerala',
  description: 'Book professional gaming setups for college fests, tech fests & events across Kerala. PS5, Xbox, VR, driving simulators with full setup, delivery & technical support. Servicing Kodungallur, Thrissur, Ernakulam, Kochi & all Kerala districts.',
  keywords: [
    'college gaming event Kerala', 'gaming setup rental Thrissur',
    'college fest gaming Kodungallur', 'esports event Kerala',
    'gaming stall college fest', 'PS5 rental college fest',
    'tech fest gaming setup Kerala', 'VR experience college event',
    'gaming event organiser Kerala', 'college gaming tournament setup',
    'esports setup Thrissur', 'gaming booth college fest Ernakulam',
    'driving simulator rental Kerala', 'corporate gaming event Kerala',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/college-setup' },
  openGraph: {
    title: 'College Event Gaming Setup | GameSpot Kerala',
    description: 'Professional PS5, Xbox, VR & driving sim setups for college fests. Full setup & support across Kerala.',
    url: 'https://gamespotkdlr.com/college-setup',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot College Event Setup' }],
  },
  twitter: {
    card: 'summary',
    title: 'College Fest Gaming Setup | GameSpot Kerala',
    description: 'PS5, VR & simulators for college events. Professional setup across Kerala.',
  },
};

export default function CollegeSetupPage() {
  return <CollegeSetupPageClient />;
}
