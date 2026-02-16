import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const ContactPageClient = dynamic(() => import('./ContactPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Contact Us - Location & Hours | GameSpot Kodungallur',
  description: 'Visit GameSpot Gaming Lounge in Kodungallur, Thrissur, Kerala. Get directions, opening hours, WhatsApp & phone contact. Near Kodungallur town, easy access from Irinjalakuda & Guruvayur.',
  keywords: ['GameSpot location Kodungallur', 'gaming lounge address Kodungallur', 'gaming cafe contact Thrissur', 'gaming near Kodungallur directions'],
  alternates: { canonical: 'https://gamespotkdlr.com/contact' },
  openGraph: {
    title: 'Contact & Location | GameSpot Kodungallur',
    description: 'Find us in Kodungallur, Thrissur. Get directions, WhatsApp & phone contact for Kerala\'s best gaming lounge.',
    url: 'https://gamespotkdlr.com/contact',
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
