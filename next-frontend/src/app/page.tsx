import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import FAQSchema from '@/components/structured-data/FAQSchema';
import BreadcrumbSchema from '@/components/structured-data/BreadcrumbSchema';

export const metadata: Metadata = {
  title: 'GameSpot Kodungallur - #1 Premium Gaming Lounge | PS5, Xbox, VR Gaming',
  description: 'GameSpot is the best gaming lounge in Kodungallur, Thrissur, Kerala. Play GTA V, God of War, FIFA, Spider-Man, Call of Duty & 50+ games on PS5, Xbox Series X & Meta Quest VR. Book sessions online. Professional setup, competitive pricing. Near Irinjalakuda, Guruvayur & Chalakudy.',
  keywords: [
    'GameSpot Kodungallur', 'gaming lounge Kodungallur', 'PS5 gaming Kodungallur',
    'best gaming cafe Kodungallur', 'VR gaming near Kodungallur', 'gaming zone Thrissur',
    'Xbox gaming Kerala', 'gaming near me Kodungallur', 'PlayStation 5 Kodungallur',
    'gaming cafe near Irinjalakuda', 'gaming lounge near Guruvayur',
    'GTA Kodungallur', 'GTA V gaming lounge Kodungallur', 'play GTA in Kodungallur',
    'FIFA Kodungallur', 'God of War Kodungallur', 'Spider-Man PS5 Kodungallur',
    'Call of Duty Kodungallur', 'gaming cafe Thrissur district',
    'PS5 gaming near me', 'gaming zone near Chalakudy', 'gaming lounge near Angamaly',
    'best gaming experience Kerala', 'premium gaming lounge Kerala',
    'VR experience Kodungallur', 'driving simulator Kodungallur',
    'esports Kodungallur', 'gaming center Thrissur', 'console gaming Kerala',
    'Fortnite Kodungallur', 'WWE gaming Kodungallur', 'racing games Kodungallur',
  ],
  alternates: {
    canonical: 'https://gamespotkdlr.com',
  },
  openGraph: {
    title: 'GameSpot Kodungallur - #1 Premium Gaming Lounge | PS5, Xbox, VR',
    description: 'Play GTA, FIFA, God of War & 50+ games on PS5, Xbox & VR at Kodungallur\'s best gaming lounge. Book your session now!',
    url: 'https://gamespotkdlr.com',
    siteName: 'GameSpot Kodungallur',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot Kodungallur - Premium Gaming Lounge' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GameSpot Kodungallur - #1 Gaming Lounge in Kerala',
    description: 'PS5, Xbox, VR gaming. GTA, FIFA, God of War & 50+ games. Book now!',
  },
};

/* JSON-LD Structured Data for Local Business SEO */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://gamespotkdlr.com',
  name: 'GameSpot - Premium Gaming Lounge',
  alternateName: 'GameSpot Kodungallur',
  description: 'Premium gaming lounge in Kodungallur offering PS5, Xbox Series X, and Meta Quest VR gaming sessions. Professional setup, 50+ games, and competitive pricing.',
  url: 'https://gamespotkdlr.com',
  telephone: '+91-XXXXXXXXXX', // Replace with actual phone number
  image: 'https://gamespotkdlr.com/assets/images/logo.png',
  logo: 'https://gamespotkdlr.com/assets/images/logo.png',
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, UPI, Google Pay, PhonePe, Card',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Kodungallur', // Replace with actual street address
    addressLocality: 'Kodungallur',
    addressRegion: 'Kerala',
    postalCode: '680664', // Replace with actual postal code
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 10.2269, // Replace with actual coordinates
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
        itemOffered: { '@type': 'Service', name: 'PS5 Gaming Session', description: 'PlayStation 5 gaming session with 50+ games' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Xbox Series X Gaming Session', description: 'Xbox Series X gaming session' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'VR Gaming Experience', description: 'Meta Quest VR gaming experience' },
      },
    ],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '150', // Update with actual review count
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
