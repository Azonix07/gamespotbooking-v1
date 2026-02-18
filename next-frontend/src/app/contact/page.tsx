import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const ContactPageClient = dynamic(() => import('./ContactPageClient'), {
  loading: () => <GameSpotLoader />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Contact Us - Location, Hours & Directions | GameSpot Kodungallur',
  description: 'Visit GameSpot Gaming Lounge in Kodungallur, Thrissur, Kerala 680664. Shipu Complex, Near JJ Castle, Star Nagar. Get directions, opening hours (9AM-12AM daily), WhatsApp & phone contact. Easy access from Irinjalakuda, Guruvayur, Chalakudy & Angamaly.',
  keywords: [
    'GameSpot location Kodungallur', 'gaming lounge address Kodungallur',
    'gaming cafe contact Thrissur', 'gaming near Kodungallur directions',
    'GameSpot Kodungallur phone number', 'gaming lounge near me Kodungallur',
    'GameSpot opening hours', 'gaming cafe location Thrissur district',
    'how to reach GameSpot Kodungallur', 'gaming lounge map Kodungallur',
  ],
  alternates: { canonical: 'https://gamespotkdlr.com/contact' },
  openGraph: {
    title: 'Contact & Location | GameSpot Kodungallur',
    description: 'Find GameSpot in Kodungallur, Thrissur. Open 9AM-12AM (Midnight) daily. Get directions, WhatsApp & phone contact.',
    url: 'https://gamespotkdlr.com/contact',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot Kodungallur Location' }],
  },
  twitter: {
    card: 'summary',
    title: 'Contact GameSpot Kodungallur',
    description: 'Gaming lounge in Kodungallur, Thrissur. Open daily 9AM-12AM (Midnight).',
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
