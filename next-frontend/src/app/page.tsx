import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import FAQSchema from '@/components/structured-data/FAQSchema';
import BreadcrumbSchema from '@/components/structured-data/BreadcrumbSchema';

export const metadata: Metadata = {
  title: 'Best Gaming Lounge in Kodungallur | PS5, GTA, VR & Driving Simulator',
  description: 'Play PS5, GTA, VR games and driving simulator at the best gaming lounge in Kodungallur near Thrissur. Book online now. 50+ games including God of War, FIFA, Spider-Man & more on PS5, Xbox Series X & Meta Quest VR. Professional setup, competitive pricing.',
  keywords: [
    'GameSpot Kodungallur', 'gaming lounge Kodungallur', 'PS5 gaming Kodungallur',
    'best gaming cafe Kodungallur', 'VR gaming near Kodungallur', 'gaming zone Thrissur',
    'Xbox gaming Kerala', 'gaming near me Kodungallur', 'PlayStation 5 Kodungallur',
    'gaming cafe near Irinjalakuda', 'gaming lounge near Guruvayur',
    'GTA Kodungallur', 'GTA V gaming lounge Kodungallur', 'play GTA in Kodungallur',
    'GTA in Kodungallur', 'games in Kodungallur', 'games in Thrissur',
    'gaming center near me Kodungallur', 'gaming center near me Thrissur',
    'best gaming lounge in Kodungallur', 'game booking in Kodungallur',
    'FIFA Kodungallur', 'God of War Kodungallur', 'Spider-Man PS5 Kodungallur',
    'Call of Duty Kodungallur', 'gaming cafe Thrissur district',
    'PS5 gaming near me', 'gaming zone near Chalakudy', 'gaming lounge near Angamaly',
    'best gaming experience Kerala', 'premium gaming lounge Kerala',
    'VR experience Kodungallur', 'VR games in Kodungallur', 'VR in Thrissur',
    'driving simulator Kodungallur', 'driving simulator in Kodungallur',
    'PS5 in Kodungallur', 'gaming center Kodungallur',
    'esports Kodungallur', 'gaming center Thrissur', 'console gaming Kerala',
    'Fortnite Kodungallur', 'WWE gaming Kodungallur', 'racing games Kodungallur',
  ],
  alternates: {
    canonical: 'https://gamespotkdlr.com',
  },
  openGraph: {
    title: 'Best Gaming Lounge in Kodungallur | PS5, GTA, VR & Driving Simulator',
    description: 'Play GTA, FIFA, God of War & 50+ games on PS5, Xbox & VR at Kodungallur\'s best gaming lounge near Thrissur. Book your session now!',
    url: 'https://gamespotkdlr.com',
    siteName: 'GameSpot Kodungallur',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot Kodungallur - Premium Gaming Lounge' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Gaming Lounge in Kodungallur | PS5, GTA, VR & Driving Simulator',
    description: 'PS5, Xbox, VR gaming & driving simulator. GTA, FIFA, God of War & 50+ games. Book now!',
  },
};

/* JSON-LD Structured Data for Local Business SEO */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EntertainmentBusiness',
  '@id': 'https://gamespotkdlr.com/#business',
  name: 'GameSpot - Premium Gaming Lounge Kodungallur',
  alternateName: ['GameSpot Kodungallur', 'GameSpot Gaming Lounge', 'GameSpot Kodungallur Gaming Center'],
  description: 'Best gaming lounge in Kodungallur offering PS5, Xbox Series X, Meta Quest VR gaming sessions and driving simulator. Play GTA, FIFA, God of War & 50+ games. Professional setup, competitive pricing near Thrissur, Kerala.',
  url: 'https://gamespotkdlr.com',
  telephone: '+91-XXXXXXXXXX', // Replace with actual phone number
  image: 'https://gamespotkdlr.com/assets/images/logo.png',
  logo: 'https://gamespotkdlr.com/assets/images/logo.png',
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, UPI, Google Pay, PhonePe, Card',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shipu Complex, Near JJ Castle, Star Nagar',
    addressLocality: 'Kodungallur',
    addressRegion: 'Kerala',
    postalCode: '680664',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 10.2269,
    longitude: 76.1950,
  },
  areaServed: [
    { '@type': 'City', name: 'Kodungallur' },
    { '@type': 'City', name: 'Irinjalakuda' },
    { '@type': 'City', name: 'Thrissur' },
    { '@type': 'City', name: 'Guruvayur' },
    { '@type': 'City', name: 'Chalakudy' },
    { '@type': 'City', name: 'Angamaly' },
    { '@type': 'State', name: 'Kerala' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '00:00',
    },
  ],
  sameAs: [
    // Add your social media URLs here
    // 'https://instagram.com/gamespot_kodungallur',
    // 'https://facebook.com/gamespotkodungallur',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Gaming Sessions',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'PS5 Gaming Session', description: 'PlayStation 5 gaming session with 50+ games including GTA V, God of War, FIFA, Spider-Man at GameSpot Kodungallur' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Xbox Series X Gaming Session', description: 'Xbox Series X gaming session with Forza Horizon, Halo & more at GameSpot Kodungallur' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'VR Gaming Experience', description: 'Meta Quest VR gaming experience with Beat Saber, VR adventures at GameSpot Kodungallur near Thrissur' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Driving Simulator', description: 'Professional driving simulator experience at GameSpot Kodungallur. Realistic racing simulation near Thrissur, Kerala.' },
      },
    ],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '150',
    bestRating: '5',
  },
};

/* Website structured data for sitelinks searchbox */
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GameSpot Kodungallur',
  alternateName: 'GameSpot Gaming Lounge',
  url: 'https://gamespotkdlr.com',
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <FAQSchema />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }]} />
      <HomePageClient />
    </>
  );
}
